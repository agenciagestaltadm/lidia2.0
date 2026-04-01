# WhatsApp QR Funcional - Guia de Implementação

## 📋 Visão Geral

Este documento descreve a implementação completa do sistema WhatsApp QR com suporte a múltiplos tipos de mensagens, sincronização de contatos, otimização de performance e atualizações em tempo real.

## 🎯 Fases Implementadas

### Fase 1: Recebimento de Mensagens ✅

**Status**: Implementado

#### Componentes:
- **[`BaileysService.handleIncomingMessage()`](../src/lib/whatsapp/baileys-service.ts:321)** - Processa mensagens recebidas
- **[`messages.upsert` event](../src/lib/whatsapp/baileys-service.ts:296)** - Listener para mensagens do Baileys
- **[`useWhatsAppMessages` hook](../src/hooks/use-whatsapp-messages.ts)** - Realtime subscription

#### Fluxo:
1. Baileys recebe mensagem via `messages.upsert`
2. `handleIncomingMessage()` extrai conteúdo e tipo
3. Mensagem é salva no Supabase
4. Contato é atualizado ou criado
5. Realtime subscription notifica UI
6. UI atualiza automaticamente

#### Tipos de Mensagens Suportados:
- ✅ Texto
- ✅ Imagem
- ✅ Vídeo
- ✅ Áudio
- ✅ Documento
- ✅ Sticker

---

### Fase 2: Otimização de Carregamento ✅

**Status**: Implementado

#### Estratégias:

1. **Cache Local**
   - Cache em memória com duração de 5 minutos
   - Implementado em [`useWhatsAppMessages`](../src/hooks/use-whatsapp-messages.ts:16)
   - Implementado em [`useWhatsAppContacts`](../src/hooks/use-whatsapp-contacts.ts:15)

2. **Paginação**
   - Limite de 50 mensagens por página
   - Parâmetro `before` para carregar mensagens antigas
   - Implementado em [`GET /api/whatsapp/sessions/[id]/messages`](../src/app/api/whatsapp/sessions/[id]/messages/route.ts:53)

3. **Índices de Banco de Dados**
   - Índices compostos para queries frequentes
   - Índices parciais para filtros comuns
   - Implementado em [`021_add_whatsapp_performance_indexes.sql`](../supabase/migrations/021_add_whatsapp_performance_indexes.sql)

4. **Lazy Loading**
   - Carregamento sob demanda de mensagens antigas
   - Função `loadMore()` em [`useWhatsAppMessages`](../src/hooks/use-whatsapp-messages.ts:147)

#### Índices Criados:
```sql
-- Mensagens
idx_whatsapp_messages_session_contact_timestamp
idx_whatsapp_messages_session_timestamp
idx_whatsapp_messages_type
idx_whatsapp_messages_status

-- Contatos
idx_whatsapp_contacts_session_lastmsg
idx_whatsapp_contacts_session_name
idx_whatsapp_contacts_session_phone

-- Parciais
idx_whatsapp_messages_unread
idx_whatsapp_contacts_groups
```

---

### Fase 3: Suporte a Múltiplos Tipos de Mensagens ✅

**Status**: Implementado

#### Métodos Implementados:

1. **[`sendMessage()`](../src/lib/whatsapp/baileys-service.ts:568)**
   - Envia mensagens de texto
   - Salva no banco com status 'sent'

2. **[`sendMediaMessage()`](../src/lib/whatsapp/baileys-service.ts:619)**
   - Suporta: imagem, vídeo, áudio, documento, sticker
   - Converte Buffer para formato Baileys
   - Salva metadados (fileName, mediaSize)

3. **[`sendMediaMessage()` hook](../src/hooks/use-whatsapp-messages.ts:145)**
   - Wrapper para envio de mídia
   - Converte Buffer para base64
   - Limpa cache após envio

#### Tipos Suportados:

| Tipo | Método | Suporte |
|------|--------|---------|
| Texto | `sendMessage()` | ✅ |
| Imagem | `sendMediaMessage()` | ✅ |
| Vídeo | `sendMediaMessage()` | ✅ |
| Áudio | `sendMediaMessage()` | ✅ |
| Documento | `sendMediaMessage()` | ✅ |
| Sticker | `sendMediaMessage()` | ✅ |

#### Renderização de Mídia:

- **[`MessageBubble.renderMediaContent()`](../src/components/whatslidia/MessageBubble.tsx:236)**
  - Imagem: Preview com legenda
  - Vídeo: Ícone play com duração
  - Áudio: Player com waveform
  - Documento: Ícone com nome e tamanho
  - Sticker: Renderização nativa

---

### Fase 4: Sincronização de Contatos ✅

**Status**: Implementado

#### Métodos:

1. **[`syncContacts()`](../src/lib/whatsapp/baileys-service.ts:720)**
   - Busca contatos do WhatsApp via `fetchBlocklist()`
   - Sincroniza com Supabase
   - Atualiza ou cria contatos

2. **[`useWhatsAppContacts` hook](../src/hooks/use-whatsapp-contacts.ts)**
   - Cache de contatos (10 minutos)
   - Realtime subscription para atualizações
   - Função `syncContacts()` para sincronização manual

3. **[`POST /api/whatsapp/sessions/[id]/contacts/sync`](../src/app/api/whatsapp/sessions/[id]/contacts/route.ts:88)**
   - Endpoint para sincronizar contatos
   - Validação de autenticação e sessão

#### Fluxo:
```
Usuário clica "Sincronizar"
    ↓
POST /api/whatsapp/sessions/[id]/contacts/sync
    ↓
BaileysService.syncContacts()
    ↓
Busca contatos do WhatsApp
    ↓
Atualiza/cria no Supabase
    ↓
Retorna contatos sincronizados
    ↓
UI atualiza com novo cache
```

---

### Fase 5: Melhorias na UI/UX ✅

**Status**: Parcialmente Implementado

#### Implementado:

1. **Status de Mensagens**
   - ✅ Ícone de enviado (Check)
   - ✅ Ícone de entregue (CheckCheck)
   - ✅ Ícone de lido (CheckCheck azul)
   - ✅ Ícone de erro (AlertCircle)
   - Implementado em [`MessageBubble.getStatusIcon()`](../src/components/whatslidia/MessageBubble.tsx:217)

2. **Preview de Mídia**
   - ✅ Imagens com legenda
   - ✅ Vídeos com duração
   - ✅ Áudio com waveform
   - ✅ Documentos com tamanho
   - Implementado em [`MessageBubble.renderMediaContent()`](../src/components/whatslidia/MessageBubble.tsx:236)

3. **Realtime Updates**
   - ✅ Mensagens novas aparecem instantaneamente
   - ✅ Contatos sincronizam em tempo real
   - Implementado em [`useWhatsAppMessages`](../src/hooks/use-whatsapp-messages.ts:161) e [`useWhatsAppContacts`](../src/hooks/use-whatsapp-contacts.ts:130)

#### Não Implementado (Próximas Fases):

- ⏳ Indicador de "digitando"
- ⏳ Drag-and-drop para arquivos
- ⏳ Gravação de áudio integrada

---

## 🔧 API Endpoints

### Mensagens

#### GET `/api/whatsapp/sessions/[id]/messages`
Listar mensagens de uma conversa

**Query Parameters:**
- `phone` (required): Número do contato
- `limit` (optional): Limite de mensagens (default: 50)
- `before` (optional): Timestamp para paginação

**Response:**
```json
[
  {
    "id": "uuid",
    "session_id": "uuid",
    "message_id": "string",
    "contact_phone": "string",
    "content": "string",
    "type": "text|image|video|audio|document|sticker",
    "direction": "incoming|outgoing",
    "status": "pending|sent|delivered|read|failed",
    "timestamp": "ISO8601"
  }
]
```

#### POST `/api/whatsapp/sessions/[id]/messages`
Enviar mensagem (texto ou mídia)

**Body:**
```json
{
  "phone": "string",
  "message": "string (para texto)",
  "mediaType": "image|video|audio|document|sticker (para mídia)",
  "mediaUrl": "string (URL da mídia)",
  "caption": "string (opcional)",
  "fileName": "string (opcional)"
}
```

### Contatos

#### GET `/api/whatsapp/sessions/[id]/contacts`
Listar contatos

**Query Parameters:**
- `search` (optional): Buscar por nome ou telefone
- `limit` (optional): Limite de contatos (default: 50)
- `offset` (optional): Offset para paginação

#### POST `/api/whatsapp/sessions/[id]/contacts/sync`
Sincronizar contatos do WhatsApp

**Response:**
```json
[
  {
    "id": "uuid",
    "session_id": "uuid",
    "phone": "string",
    "name": "string",
    "profile_picture": "string (URL)",
    "status": "string",
    "last_message_at": "ISO8601",
    "is_group": "boolean"
  }
]
```

---

## 📊 Estrutura de Dados

### Tabelas Principais

#### `whatsapp_messages`
```sql
id UUID PRIMARY KEY
session_id UUID (FK)
message_id VARCHAR(255)
contact_phone VARCHAR(50)
contact_name VARCHAR(255)
content TEXT
type VARCHAR(50) -- text, image, video, audio, document, sticker
direction VARCHAR(50) -- incoming, outgoing
status VARCHAR(50) -- pending, sent, delivered, read, failed
media_url TEXT
metadata JSONB -- {fileName, mediaSize, duration, caption}
timestamp TIMESTAMPTZ
created_at TIMESTAMPTZ
```

#### `whatsapp_contacts`
```sql
id UUID PRIMARY KEY
session_id UUID (FK)
phone VARCHAR(50)
name VARCHAR(255)
profile_picture TEXT
status VARCHAR(255)
last_message_at TIMESTAMPTZ
is_group BOOLEAN
unread_count INTEGER
last_message_preview TEXT
is_active BOOLEAN
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### `whatsapp_sessions`
```sql
id UUID PRIMARY KEY
company_id UUID (FK)
name VARCHAR(255)
token UUID
status VARCHAR(50) -- creating, waiting_qr, connecting, connected, active, disconnected, error
phone_number VARCHAR(50)
push_name VARCHAR(255)
profile_picture TEXT
last_connected_at TIMESTAMPTZ
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

---

## 🚀 Como Usar

### 1. Criar Sessão
```typescript
const service = new BaileysService(sessionId, companyId);
const session = await service.createSession('Minha Sessão');
```

### 2. Iniciar Sessão com QR
```typescript
await service.startSession(
  (qr) => console.log('QR:', qr),
  (status, phone, name) => console.log('Status:', status)
);
```

### 3. Enviar Mensagem de Texto
```typescript
const message = await service.sendMessage('5511999999999', 'Olá!');
```

### 4. Enviar Mídia
```typescript
const mediaBuffer = fs.readFileSync('image.jpg');
const message = await service.sendMediaMessage(
  '5511999999999',
  mediaBuffer,
  'image',
  'Veja esta imagem!'
);
```

### 5. Sincronizar Contatos
```typescript
const contacts = await service.syncContacts();
```

### 6. Usar Hooks no Frontend
```typescript
const { messages, sendMessage, sendMediaMessage, loading } = useWhatsAppMessages(sessionId, phone);
const { contacts, syncContacts, refresh } = useWhatsAppContacts(sessionId);
```

---

## 🔍 Troubleshooting

### Mensagens não aparecem
1. Verificar se `messages.upsert` está sendo disparado
2. Verificar logs do Baileys
3. Verificar se Realtime está habilitado no Supabase
4. Verificar RLS policies

### Contatos não sincronizam
1. Verificar se sessão está ativa
2. Verificar se `fetchBlocklist()` retorna dados
3. Verificar permissões no banco de dados

### Performance lenta
1. Verificar índices do banco
2. Verificar cache (5 minutos para mensagens, 10 para contatos)
3. Verificar paginação (limite de 50 por página)
4. Verificar queries no Supabase

---

## 📝 Próximas Melhorias

- [ ] Indicador de "digitando"
- [ ] Drag-and-drop para arquivos
- [ ] Gravação de áudio integrada
- [ ] Suporte a grupos
- [ ] Suporte a reações de emoji
- [ ] Suporte a mensagens temporárias
- [ ] Backup automático de conversas
- [ ] Busca avançada de mensagens

---

## 📚 Referências

- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [WhatsApp API](https://www.whatsapp.com/business/api)

---

**Última atualização**: 2026-04-01
**Versão**: 1.0.0
