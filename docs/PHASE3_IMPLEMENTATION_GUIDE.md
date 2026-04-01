# Guia de Implementação - Fase 3 das APIs Baileys

## Visão Geral

Este documento descreve a implementação completa da Fase 3 das APIs Baileys, incluindo:
- Webhooks para eventos em tempo real
- Busca avançada de mensagens
- Arquivamento de conversas
- Agendamento de mensagens
- Backup automático

## Arquitetura

### Banco de Dados

#### Tabelas Criadas

1. **whatsapp_webhooks**
   - Armazena configurações de webhooks
   - URLs de callback para eventos
   - Tipos de eventos subscritos
   - Status ativo/inativo

2. **whatsapp_webhook_events**
   - Histórico de eventos disparados
   - Payload dos eventos
   - Status de entrega
   - Tentativas de reentrega

3. **whatsapp_message_search_index**
   - Índice de busca full-text
   - Metadados de mensagens
   - Otimização de performance

4. **whatsapp_archived_conversations**
   - Conversas arquivadas
   - Data de arquivamento
   - Motivo do arquivamento

5. **whatsapp_scheduled_messages**
   - Mensagens agendadas
   - Data/hora de envio
   - Status de execução

6. **whatsapp_backups**
   - Histórico de backups
   - Localização do arquivo
   - Tamanho e checksum

### APIs REST

#### Webhooks (`/api/whatsapp/sessions/[id]/webhooks`)

```typescript
// GET - Listar webhooks
GET /api/whatsapp/sessions/{sessionId}/webhooks

// POST - Criar webhook
POST /api/whatsapp/sessions/{sessionId}/webhooks
{
  "url": "https://example.com/webhook",
  "events": ["message.received", "message.sent", "group.created"],
  "isActive": true,
  "retryPolicy": {
    "maxRetries": 3,
    "retryDelayMs": 5000
  }
}

// PUT - Atualizar webhook
PUT /api/whatsapp/sessions/{sessionId}/webhooks/{webhookId}
{
  "url": "https://example.com/webhook",
  "events": ["message.received"],
  "isActive": true
}

// DELETE - Deletar webhook
DELETE /api/whatsapp/sessions/{sessionId}/webhooks/{webhookId}

// GET - Listar eventos disparados
GET /api/whatsapp/sessions/{sessionId}/webhooks/{webhookId}/events?limit=50&offset=0
```

#### Busca Avançada (`/api/whatsapp/sessions/[id]/search`)

```typescript
// GET - Buscar mensagens
GET /api/whatsapp/sessions/{sessionId}/search?q={query}&filters={filters}&limit=50&offset=0

// Filtros suportados:
// - from: número do contato
// - to: número do contato
// - type: message|image|video|audio|document
// - dateFrom: ISO 8601
// - dateTo: ISO 8601
// - hasReactions: true|false
// - isDeleted: true|false
// - isForwarded: true|false

// Exemplo:
GET /api/whatsapp/sessions/{sessionId}/search?q=hello&from=5511999999999&type=message&dateFrom=2026-01-01
```

#### Arquivamento (`/api/whatsapp/sessions/[id]/archive`)

```typescript
// GET - Listar conversas arquivadas
GET /api/whatsapp/sessions/{sessionId}/archive?limit=50&offset=0

// POST - Arquivar conversa
POST /api/whatsapp/sessions/{sessionId}/archive
{
  "contactPhone": "5511999999999",
  "reason": "Motivo opcional"
}

// DELETE - Desarquivar conversa
DELETE /api/whatsapp/sessions/{sessionId}/archive/{archiveId}

// GET - Buscar conversa arquivada
GET /api/whatsapp/sessions/{sessionId}/archive/{archiveId}
```

#### Agendamento (`/api/whatsapp/sessions/[id]/schedule`)

```typescript
// GET - Listar mensagens agendadas
GET /api/whatsapp/sessions/{sessionId}/schedule?status=pending&limit=50&offset=0

// POST - Agendar mensagem
POST /api/whatsapp/sessions/{sessionId}/schedule
{
  "contactPhone": "5511999999999",
  "message": "Conteúdo da mensagem",
  "scheduledAt": "2026-04-15T10:30:00Z",
  "mediaUrl": "https://..." (opcional),
  "mediaType": "image|video|audio|document" (opcional)
}

// PUT - Atualizar agendamento
PUT /api/whatsapp/sessions/{sessionId}/schedule/{scheduleId}
{
  "scheduledAt": "2026-04-15T11:00:00Z",
  "message": "Novo conteúdo"
}

// DELETE - Cancelar agendamento
DELETE /api/whatsapp/sessions/{sessionId}/schedule/{scheduleId}

// POST - Executar agendamento manualmente
POST /api/whatsapp/sessions/{sessionId}/schedule/{scheduleId}/execute
```

#### Backup (`/api/whatsapp/sessions/[id]/backup`)

```typescript
// GET - Listar backups
GET /api/whatsapp/sessions/{sessionId}/backup?limit=50&offset=0

// POST - Criar backup
POST /api/whatsapp/sessions/{sessionId}/backup
{
  "includeMessages": true,
  "includeMedia": true,
  "includeContacts": true,
  "dateFrom": "2026-01-01" (opcional),
  "dateTo": "2026-04-01" (opcional)
}

// GET - Baixar backup
GET /api/whatsapp/sessions/{sessionId}/backup/{backupId}/download

// DELETE - Deletar backup
DELETE /api/whatsapp/sessions/{sessionId}/backup/{backupId}

// POST - Restaurar backup
POST /api/whatsapp/sessions/{sessionId}/backup/{backupId}/restore
{
  "overwrite": false
}
```

## Hooks React

### useWhatsAppWebhooks

```typescript
const {
  webhooks,              // Webhook[]
  loading,
  error,
  fetchWebhooks,         // () => Promise<void>
  createWebhook,         // (url, events, retryPolicy) => Promise<Webhook | null>
  updateWebhook,         // (webhookId, updates) => Promise<boolean>
  deleteWebhook,         // (webhookId) => Promise<boolean>
  toggleWebhook,         // (webhookId, isActive) => Promise<boolean>
  fetchWebhookEvents,    // (webhookId, limit?, offset?) => Promise<WebhookEvent[]>
  retryWebhookEvent,     // (eventId) => Promise<boolean>
  getWebhookStatus,      // (webhookId) => 'active' | 'inactive' | 'error'
} = useWhatsAppWebhooks(sessionId);
```

### useWhatsAppSearch

```typescript
const {
  results,               // Message[]
  loading,
  error,
  total,
  limit,
  offset,
  searchMessages,        // (query, filters?, limit?, offset?) => Promise<void>
  clearSearch,           // () => void
  loadMore,              // () => void
  getFilteredResults,    // (filterKey, filterValue) => Message[]
  getResultsByType,      // (type) => Message[]
  getResultsByDate,      // (dateFrom, dateTo) => Message[]
  exportResults,         // (format: 'json' | 'csv') => Promise<Blob>
} = useWhatsAppSearch(sessionId);
```

### useWhatsAppArchive

```typescript
const {
  archivedConversations, // ArchivedConversation[]
  loading,
  error,
  total,
  limit,
  offset,
  fetchArchived,         // (limit?, offset?) => Promise<void>
  archiveConversation,   // (contactPhone, reason?) => Promise<boolean>
  unarchiveConversation, // (archiveId) => Promise<boolean>
  deleteArchived,        // (archiveId) => Promise<boolean>
  loadMore,              // () => void
  getArchivedByDate,     // (dateFrom, dateTo) => ArchivedConversation[]
  searchArchived,        // (query) => ArchivedConversation[]
} = useWhatsAppArchive(sessionId);
```

### useWhatsAppSchedule

```typescript
const {
  scheduledMessages,     // ScheduledMessage[]
  loading,
  error,
  total,
  limit,
  offset,
  fetchScheduled,        // (status?, limit?, offset?) => Promise<void>
  scheduleMessage,       // (contactPhone, message, scheduledAt, media?) => Promise<ScheduledMessage | null>
  updateSchedule,        // (scheduleId, updates) => Promise<boolean>
  cancelSchedule,        // (scheduleId) => Promise<boolean>
  executeSchedule,       // (scheduleId) => Promise<boolean>
  loadMore,              // () => void
  getScheduledByStatus,  // (status) => ScheduledMessage[]
  getScheduledByDate,    // (dateFrom, dateTo) => ScheduledMessage[]
  getUpcomingMessages,   // (hoursAhead) => ScheduledMessage[]
} = useWhatsAppSchedule(sessionId);
```

### useWhatsAppBackup

```typescript
const {
  backups,               // Backup[]
  loading,
  error,
  total,
  limit,
  offset,
  fetchBackups,          // (limit?, offset?) => Promise<void>
  createBackup,          // (options) => Promise<Backup | null>
  downloadBackup,        // (backupId) => Promise<Blob>
  deleteBackup,          // (backupId) => Promise<boolean>
  restoreBackup,         // (backupId, overwrite?) => Promise<boolean>
  loadMore,              // () => void
  getBackupSize,         // (backupId) => string
  getBackupStatus,       // (backupId) => 'pending' | 'completed' | 'failed'
  getLatestBackup,       // () => Backup | null
  scheduleAutoBackup,    // (intervalDays) => Promise<boolean>
} = useWhatsAppBackup(sessionId);
```

## Componentes React

### WebhookManager

Gerenciador de webhooks com interface visual.

```typescript
<WebhookManager
  sessionId={sessionId}
  isDarkMode={true}
  onWebhookCreated={(webhook) => handleWebhookCreated(webhook)}
  onWebhookDeleted={(webhookId) => handleWebhookDeleted(webhookId)}
/>
```

### SearchBar

Barra de busca avançada com filtros.

```typescript
<SearchBar
  sessionId={sessionId}
  onSearch={(query, filters) => handleSearch(query, filters)}
  isDarkMode={true}
  placeholder="Buscar mensagens..."
/>
```

### SearchResults

Exibição de resultados de busca.

```typescript
<SearchResults
  results={results}
  loading={loading}
  onSelectMessage={(message) => handleSelectMessage(message)}
  onExport={(format) => handleExport(format)}
  isDarkMode={true}
/>
```

### ArchiveManager

Gerenciador de conversas arquivadas.

```typescript
<ArchiveManager
  sessionId={sessionId}
  isDarkMode={true}
  onArchiveConversation={(contactPhone) => handleArchive(contactPhone)}
  onUnarchiveConversation={(archiveId) => handleUnarchive(archiveId)}
/>
```

### ScheduleModal

Modal para agendamento de mensagens.

```typescript
<ScheduleModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSchedule={(message, scheduledAt) => handleSchedule(message, scheduledAt)}
  sessionId={sessionId}
  isDarkMode={true}
/>
```

### ScheduledMessagesList

Lista de mensagens agendadas.

```typescript
<ScheduledMessagesList
  sessionId={sessionId}
  isDarkMode={true}
  onCancelSchedule={(scheduleId) => handleCancel(scheduleId)}
  onExecuteSchedule={(scheduleId) => handleExecute(scheduleId)}
/>
```

### BackupManager

Gerenciador de backups.

```typescript
<BackupManager
  sessionId={sessionId}
  isDarkMode={true}
  onBackupCreated={(backup) => handleBackupCreated(backup)}
  onBackupDeleted={(backupId) => handleBackupDeleted(backupId)}
  onBackupRestored={(backupId) => handleBackupRestored(backupId)}
/>
```

## Fluxo de Dados

### Webhooks

```
Evento WhatsApp (message.received)
  ↓
Baileys Event Handler
  ↓
POST /api/whatsapp/sessions/{id}/webhooks/trigger
  ↓
Supabase (insert webhook_events)
  ↓
Webhook Dispatcher
  ↓
HTTP POST to registered URLs
  ↓
Retry Logic (se falhar)
  ↓
Update event status
```

### Busca Avançada

```
SearchBar (user input)
  ↓
useWhatsAppSearch.searchMessages()
  ↓
GET /api/whatsapp/sessions/{id}/search
  ↓
Full-text search no Supabase
  ↓
Apply filters
  ↓
Return paginated results
  ↓
SearchResults (display)
```

### Arquivamento

```
ConversationList (right-click)
  ↓
Archive action
  ↓
useWhatsAppArchive.archiveConversation()
  ↓
POST /api/whatsapp/sessions/{id}/archive
  ↓
Supabase (insert archived_conversations)
  ↓
Update conversation status
  ↓
Toast notification
```

### Agendamento

```
ScheduleModal (user input)
  ↓
useWhatsAppSchedule.scheduleMessage()
  ↓
POST /api/whatsapp/sessions/{id}/schedule
  ↓
Supabase (insert scheduled_messages)
  ↓
Background Job (cron)
  ↓
Check scheduled messages
  ↓
Send message via Baileys
  ↓
Update status
```

### Backup

```
BackupManager (create backup)
  ↓
useWhatsAppBackup.createBackup()
  ↓
POST /api/whatsapp/sessions/{id}/backup
  ↓
Export data (messages, media, contacts)
  ↓
Compress and encrypt
  ↓
Upload to Supabase Storage
  ↓
Insert backup record
  ↓
Notification
```

## Segurança

### Row Level Security (RLS)

Todas as tabelas possuem políticas RLS que garantem:

1. Usuários só podem ver dados da sua empresa
2. Usuários só podem modificar dados que pertencem à sua sessão
3. Super users têm acesso completo

### Validações

- Validação de URLs de webhook
- Validação de eventos suportados
- Validação de datas de agendamento
- Validação de tamanho de backup
- Validação de permissões

### Criptografia

- Backup criptografado com AES-256
- Senhas de webhook com hash
- Tokens de autenticação seguros

## Performance

### Índices

- Índices full-text para busca
- Índices compostos para queries frequentes
- Índices em colunas de filtro

### Cache

- Cache local de webhooks
- Cache de resultados de busca
- Cache de conversas arquivadas

### Paginação

- Suporte a paginação para todos os endpoints
- Lazy loading para listas grandes
- Infinite scroll para mobile

## Realtime

### Subscriptions

- Eventos de webhook em tempo real
- Atualizações de agendamento
- Status de backup

### Triggers

- Atualização automática de status
- Notificações de eventos

## Próximos Passos

1. Integração com Baileys para eventos
2. Suporte a webhooks com autenticação OAuth
3. Suporte a templates de backup
4. Suporte a agendamento recorrente
5. Suporte a busca com IA

## Troubleshooting

### Webhooks não disparam

1. Verificar se a URL é válida
2. Verificar se o webhook está ativo
3. Verificar logs de eventos
4. Verificar permissões de firewall

### Busca não retorna resultados

1. Verificar se o índice foi criado
2. Verificar sintaxe da query
3. Verificar filtros aplicados
4. Verificar permissões RLS

### Agendamento não executa

1. Verificar data/hora do agendamento
2. Verificar se a sessão está ativa
3. Verificar logs de execução
4. Verificar permissões

### Backup falha

1. Verificar espaço em storage
2. Verificar permissões de acesso
3. Verificar tamanho dos dados
4. Verificar conexão com Supabase

## Referências

- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [React Hooks](https://react.dev/reference/react)
