# Plano de Correção: Arquitetura Event-Driven do Baileys

## Resumo do Problema

A evidência na imagem mostra que o sistema WhatsLidia Web exibe "Sem mensagens" para todas as conversas, mesmo com "WABA Conectado". O problema raiz é o uso de arquitetura incorreta com **loop de polling de 3 segundos** no frontend, violando completamente o padrão event-driven nativo do Baileys.

## Diagnóstico

### Problemas Identificados

1. **Polling Incorreto** - `use-whatsapp-messages.ts` (linhas 267-275):
   ```typescript
   // ANTI-PATTERN: Polling que sobrecarrega a API
   useEffect(() => {
     const interval = setInterval(() => {
       fetchMessages();
     }, 3000);
   }, [sessionId, phone, fetchMessages]);
   ```

2. **Arquitetura Baileys Atual** - Já usa eventos nativos no backend, mas:
   - Falta processamento de fila sem bloqueio
   - Faltam handlers para `messages.delete` e `messages.update` completos
   - Reconexão precisa de refinamentos

3. **Integração Frontend-Backend** - As mensagens chegam via WebSocket do Baileys, são salvas no Supabase, mas o frontend usa polling em vez de Realtime subscriptions eficientes

## Arquitetura Alvo

```mermaid
flowchart TB
    subgraph "WhatsApp Servers"
        WA[WhatsApp Servers]
    end

    subgraph "Backend - Event Driven"
        B[Baileys WebSocket]
        E1[sock.ev.on('messages.upsert')]
        E2[sock.ev.on('messages.update')]
        E3[sock.ev.on('messages.delete')]
        E4[sock.ev.on('connection.update')]
        E5[sock.ev.on('creds.update')]
        Q[Fila de Processamento]
        DB[(Supabase PostgreSQL)]
        RT[Realtime Broadcast]
        
        B --> E1 --> Q --> DB
        B --> E2 --> Q --> DB
        B --> E3 --> Q --> DB
        B --> E4
        B --> E5
        DB --> RT
    end

    subgraph "Frontend - Realtime"
        SUB[Supabase Subscription]
        UI[Interface React]
        
        RT --> SUB --> UI
    end

    WA <--> B
```

## Implementação

### 1. Remover Polling do Frontend

**Arquivo**: `src/hooks/use-whatsapp-messages.ts`

**Remover completamente o useEffect de polling** (linhas 267-275):
```typescript
// REMOVER ESTE BLOCO:
useEffect(() => {
  if (!sessionId || !phone) return;
  const interval = setInterval(() => {
    fetchMessages();
  }, 3000);
  return () => clearInterval(interval);
}, [sessionId, phone, fetchMessages]);
```

**Otimizar Realtime Subscription** (linhas 221-264):
- Usar filtro específico por `contact_phone` para reduzir tráfego
- Adicionar debounce para atualizações em massa
- Implementar deduplicação de mensagens

### 2. Refatorar BaileysService para Event-Driven Completo

**Arquivo**: `src/lib/whatsapp/baileys-service.ts`

#### A. Configuração do Socket com KeepAlive

```typescript
this.socket = makeWASocket({
  printQRInTerminal: false,
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
  },
  logger: baileysLogger,
  browser: Browsers.ubuntu('Chrome'),
  connectTimeoutMs: 120000,
  keepAliveIntervalMs: 15000,  // Reduzido de 30s para 15s
  markOnlineOnConnect: true,   // Alterado para true
  syncFullHistory: true,
  generateHighQualityLinkPreview: true,
  // Configurações adicionais para estabilidade
  defaultQueryTimeoutMs: 60000,
  emitOwnEvents: true,
});
```

#### B. Fila de Processamento de Mensagens

Implementar uma fila interna para processamento assíncrono sem bloqueio:

```typescript
// Mapa de filas por sessão
const messageQueues = new Map<string, MessageQueue>();

interface QueuedMessage {
  type: 'upsert' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

class MessageQueue {
  private queue: QueuedMessage[] = [];
  private processing = false;
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  enqueue(item: QueuedMessage) {
    this.queue.push(item);
    if (!this.processing) {
      this.process();
    }
  }

  private async process() {
    this.processing = true;
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item) {
        try {
          await this.processItem(item);
        } catch (error) {
          console.error(`[MessageQueue] Error processing item:`, error);
        }
      }
      // Yield para não bloquear o event loop
      await new Promise(resolve => setImmediate(resolve));
    }
    this.processing = false;
  }

  private async processItem(item: QueuedMessage) {
    switch (item.type) {
      case 'upsert':
        await this.handleUpsert(item.data);
        break;
      case 'update':
        await this.handleUpdate(item.data);
        break;
      case 'delete':
        await this.handleDelete(item.data);
        break;
    }
  }
}
```

#### C. Handler messages.upsert Otimizado

```typescript
this.socket.ev.on('messages.upsert', async (m) => {
  const queue = messageQueues.get(this.sessionId);
  if (!queue) return;

  for (const msg of m.messages) {
    queue.enqueue({
      type: 'upsert',
      data: { msg, type: m.type },
      timestamp: Date.now(),
    });
  }
});
```

#### D. Handler messages.update Completo

Atualizar o handler existente (linhas 343-347) para processamento de fila:

```typescript
this.socket.ev.on('messages.update', async (updates) => {
  const queue = messageQueues.get(this.sessionId);
  if (!queue) return;

  for (const update of updates) {
    queue.enqueue({
      type: 'update',
      data: update,
      timestamp: Date.now(),
    });
  }
});
```

#### E. Novo Handler messages.delete

```typescript
this.socket.ev.on('messages.delete', async (item) => {
  const queue = messageQueues.get(this.sessionId);
  if (!queue) return;

  // item pode ser: { keys: WAMessageKey[] } ou { jid: string, all: true }
  if ('keys' in item && Array.isArray(item.keys)) {
    for (const key of item.keys) {
      queue.enqueue({
        type: 'delete',
        data: { key, all: false },
        timestamp: Date.now(),
      });
    }
  } else if ('jid' in item && item.all) {
    // Marca todas as mensagens do chat como deletadas
    queue.enqueue({
      type: 'delete',
      data: { jid: item.jid, all: true },
      timestamp: Date.now(),
    });
  }
});
```

#### F. Handler connection.update Refinado

O handler existente (linhas 177-327) já está bem implementado, precisa apenas adicionar:

```typescript
this.socket.ev.on('connection.update', async (update) => {
  const { connection, lastDisconnect, qr, receivedPendingNotifications } = update;

  // Novo: Processar receivedPendingNotifications
  if (receivedPendingNotifications) {
    console.log('[BaileysService] Received pending notifications - sync complete');
  }

  // Código existente...
});
```

#### G. Handler creds.update Existente

Já implementado na linha 330.

### 3. Handlers Adicionais Recomendados

#### A. Chats Update

```typescript
this.socket.ev.on('chats.upsert', async (chats) => {
  // Processar novos chats
});

this.socket.ev.on('chats.update', async (updates) => {
  // Processar atualizações de chats (arquivamento, fix, etc)
});
```

#### B. Grupos

```typescript
this.socket.ev.on('groups.upsert', async (groups) => {
  // Novos grupos
});

this.socket.ev.on('group-participants.update', async (update) => {
  // Atualizações de participantes
});
```

#### C. Presence

```typescript
this.socket.ev.on('presence.update', async (update) => {
  // Atualizações de status "online", "typing", etc
});
```

### 4. Mecanismo de Broadcast Realtime

**Arquivo**: `src/lib/whatsapp/baileys-service.ts`

Função auxiliar para notificar o frontend via Supabase Realtime:

```typescript
private async broadcastMessageChange(
  event: 'INSERT' | 'UPDATE' | 'DELETE',
  message: WhatsAppMessage
) {
  const supabase = await createClient();

  // Broadcast via Supabase Realtime
  await supabase.channel(`whatsapp-messages-${this.sessionId}`)
    .send({
      type: 'broadcast',
      event: 'message-change',
      payload: { event, message },
    });
}
```

### 5. Frontend - Otimização do Realtime

**Arquivo**: `src/hooks/use-whatsapp-messages.ts`

```typescript
useEffect(() => {
  if (!sessionId || !phone) return;

  const channel = supabase
    .channel(`whatsapp-messages-${sessionId}`, {
      config: {
        broadcast: { self: false },
      },
    })
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'whatsapp_messages',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const message = payload.new as WhatsAppMessage;
        if (message.contact_phone === phone) {
          // Adiciona mensagem sem duplicar
          setState((prev) => {
            if (prev.messages.some(m => m.id === message.id)) {
              return prev;
            }
            return {
              ...prev,
              messages: [...prev.messages, message],
            };
          });
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'whatsapp_messages',
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        const message = payload.new as WhatsAppMessage;
        if (message.contact_phone === phone) {
          setState((prev) => ({
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === message.id ? message : m
            ),
          }));
        }
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, [sessionId, phone, supabase]);
```

### 6. Migration do Banco

**Nova migration**: `supabase/migrations/021_whatsapp_realtime_optimization.sql`

```sql
-- Índices para otimizar queries de realtime
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_session_contact 
ON whatsapp_messages(session_id, contact_phone);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_session_created 
ON whatsapp_messages(session_id, created_at DESC);

-- Trigger para notificar sobre novas mensagens (opcional, se não usar Supabase Realtime nativo)
DROP TRIGGER IF EXISTS whatsapp_messages_notify ON whatsapp_messages;

-- Adicionar política RLS para realtime se necessário
-- Já deve existir, mas garantir permissões
```

## Fluxo de Dados Corrigido

```
WhatsApp Server (WebSocket)
    ↓
Baileys Socket (ws)
    ↓
Event Handler (sock.ev.on)
    ↓
Fila de Processamento (async)
    ↓
Supabase PostgreSQL
    ↓
Supabase Realtime (Broadcast)
    ↓
Frontend Subscription (EventSource)
    ↓
React State Update
    ↓
UI Instantânea
```

## Checklist de Verificação

- [ ] Nenhum `setInterval` no frontend para mensagens
- [ ] Mensagens chegam em < 500ms
- [ ] Reconexão automática funciona após desconexão
- [ ] Histórico é sincronizado na conexão
- [ ] Mídia é baixada sem bloquear mensagens
- [ ] Sem duplicação de mensagens
- [ ] Eventos de delete/update refletidos na UI

## Notas Técnicas

1. **keepAliveIntervalMs**: Reduzido para 15s para detectar desconexões mais rápido
2. **emitOwnEvents**: Habilitado para receber confirmação de envio
3. **syncFullHistory**: Essencial para carregar conversas anteriores
4. **Fila de Processamento**: Evita bloqueio do event loop do Baileys
5. **setImmediate**: Yield entre processamentos para manter responsividade
