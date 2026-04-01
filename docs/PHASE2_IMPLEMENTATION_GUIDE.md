# Guia de Implementação - Fase 2 das APIs Baileys

## Visão Geral

Este documento descreve a implementação completa da Fase 2 das APIs Baileys, incluindo:
- Reações em Mensagens
- Encaminhar Mensagens
- Deletar Mensagens
- Gerenciamento de Grupos
- Upload/Download de Mídia

## Arquitetura

### Banco de Dados

#### Tabelas Criadas

1. **whatsapp_message_reactions**
   - Armazena reações de usuários em mensagens
   - Suporta múltiplas reações por mensagem
   - Índices para performance otimizada

2. **whatsapp_message_forwards**
   - Histórico de encaminhamentos de mensagens
   - Rastreamento de para quem foi encaminhado

3. **whatsapp_message_deletions**
   - Registro de mensagens deletadas
   - Motivo e quem deletou

4. **whatsapp_groups**
   - Informações de grupos WhatsApp
   - Suporte para arquivamento

5. **whatsapp_group_participants**
   - Participantes de grupos
   - Controle de permissões (admin)

6. **whatsapp_media**
   - Armazenamento de metadados de mídia
   - Integração com Supabase Storage

### APIs REST

#### Reações (`/api/whatsapp/sessions/[id]/reactions`)

```typescript
// GET - Buscar reações de uma mensagem
GET /api/whatsapp/sessions/{sessionId}/reactions?messageId={messageId}

// POST - Adicionar/remover reação (toggle)
POST /api/whatsapp/sessions/{sessionId}/reactions
{
  "messageId": "uuid",
  "contactPhone": "5511999999999",
  "reactionEmoji": "👍"
}

// DELETE - Remover reação específica
DELETE /api/whatsapp/sessions/{sessionId}/reactions
{
  "messageId": "uuid",
  "contactPhone": "5511999999999",
  "reactionEmoji": "👍"
}
```

#### Encaminhamento (`/api/whatsapp/sessions/[id]/forward`)

```typescript
// POST - Encaminhar mensagem
POST /api/whatsapp/sessions/{sessionId}/forward
{
  "messageId": "uuid",
  "forwardToPhones": ["5511999999999", "5511888888888"]
}

// GET - Buscar histórico de encaminhamentos
GET /api/whatsapp/sessions/{sessionId}/forward?messageId={messageId}
```

#### Deleção (`/api/whatsapp/sessions/[id]/delete`)

```typescript
// DELETE - Deletar mensagem
DELETE /api/whatsapp/sessions/{sessionId}/delete
{
  "messageId": "uuid",
  "deletedBy": "5511999999999",
  "reason": "Motivo opcional"
}

// GET - Verificar se mensagem foi deletada
GET /api/whatsapp/sessions/{sessionId}/delete?messageId={messageId}
```

#### Grupos (`/api/whatsapp/sessions/[id]/groups`)

```typescript
// GET - Listar grupos
GET /api/whatsapp/sessions/{sessionId}/groups?includeArchived=false

// POST - Criar grupo
POST /api/whatsapp/sessions/{sessionId}/groups
{
  "groupJid": "120363123456789-1234567890@g.us",
  "name": "Nome do Grupo",
  "description": "Descrição",
  "profilePictureUrl": "https://...",
  "ownerPhone": "5511999999999"
}

// PUT - Atualizar grupo
PUT /api/whatsapp/sessions/{sessionId}/groups
{
  "groupId": "uuid",
  "name": "Novo Nome",
  "description": "Nova Descrição",
  "isArchived": false
}

// DELETE - Deletar grupo
DELETE /api/whatsapp/sessions/{sessionId}/groups
{
  "groupId": "uuid"
}
```

#### Participantes (`/api/whatsapp/sessions/[id]/groups/[groupId]/participants`)

```typescript
// GET - Listar participantes
GET /api/whatsapp/sessions/{sessionId}/groups/{groupId}/participants

// POST - Adicionar participante
POST /api/whatsapp/sessions/{sessionId}/groups/{groupId}/participants
{
  "participantPhone": "5511999999999",
  "participantName": "Nome",
  "isAdmin": false
}

// PUT - Atualizar participante
PUT /api/whatsapp/sessions/{sessionId}/groups/{groupId}/participants
{
  "participantId": "uuid",
  "isAdmin": true,
  "participantName": "Novo Nome"
}

// DELETE - Remover participante
DELETE /api/whatsapp/sessions/{sessionId}/groups/{groupId}/participants
{
  "participantId": "uuid"
}
```

#### Mídia (`/api/whatsapp/sessions/[id]/media`)

```typescript
// GET - Listar mídia
GET /api/whatsapp/sessions/{sessionId}/media?type=image&limit=50&offset=0

// POST - Upload de mídia
POST /api/whatsapp/sessions/{sessionId}/media
FormData:
  - file: File
  - mediaType: "image" | "video" | "audio" | "document" | "sticker"
  - messageId: uuid (opcional)
  - caption: string (opcional)

// DELETE - Deletar mídia
DELETE /api/whatsapp/sessions/{sessionId}/media
{
  "mediaId": "uuid"
}
```

## Hooks React

### useWhatsAppReactions

```typescript
const {
  reactions,           // Record<emoji, Reaction[]>
  loading,
  error,
  fetchReactions,      // (messageId) => Promise<void>
  toggleReaction,      // (contactPhone, emoji) => Promise<boolean>
  removeReaction,      // (contactPhone, emoji) => Promise<boolean>
  getReactionCount,    // () => number
  getReactionsByEmoji, // (emoji) => Reaction[]
  getReactionEmojis,   // () => string[]
} = useWhatsAppReactions(sessionId, messageId);
```

### useWhatsAppForward

```typescript
const {
  forwards,            // Forward[]
  loading,
  error,
  fetchForwards,       // (messageId) => Promise<void>
  forwardMessage,      // (messageId, phones) => Promise<boolean>
  getForwardCount,     // () => number
  getForwardedToPhones,// () => string[]
} = useWhatsAppForward(sessionId);
```

### useWhatsAppDelete

```typescript
const {
  deletion,            // Deletion | null
  loading,
  error,
  fetchDeletion,       // (messageId) => Promise<void>
  deleteMessage,       // (messageId, deletedBy, reason?) => Promise<boolean>
  isDeleted,           // () => boolean
  getDeletionInfo,     // () => Deletion | null
} = useWhatsAppDelete(sessionId);
```

### useWhatsAppGroups

```typescript
const {
  groups,              // Group[]
  selectedGroup,       // Group | null
  participants,        // Participant[]
  loading,
  error,
  fetchGroups,         // (includeArchived?) => Promise<void>
  fetchParticipants,   // (groupId) => Promise<void>
  createGroup,         // (...) => Promise<boolean>
  updateGroup,         // (groupId, updates) => Promise<boolean>
  deleteGroup,         // (groupId) => Promise<boolean>
  addParticipant,      // (...) => Promise<boolean>
  removeParticipant,   // (groupId, participantId) => Promise<boolean>
  selectGroup,         // (group) => void
} = useWhatsAppGroups(sessionId);
```

### useWhatsAppMedia

```typescript
const {
  media,               // Media[]
  loading,
  error,
  total,
  limit,
  offset,
  fetchMedia,          // (type?, limit?, offset?) => Promise<void>
  uploadMedia,         // (file, type, messageId?, caption?) => Promise<Media | null>
  deleteMedia,         // (mediaId) => Promise<boolean>
  loadMore,            // () => void
  getMediaByType,      // (type) => Media[]
  getMediaCountByType, // (type) => number
  getTotalMediaSize,   // () => number
  formatFileSize,      // (bytes) => string
} = useWhatsAppMedia(sessionId);
```

## Componentes React

### ReactionPicker

Componente para seleção de reações com emojis predefinidos e customizados.

```typescript
<ReactionPicker
  onReactionSelect={(emoji) => handleReaction(emoji)}
  isDarkMode={true}
/>
```

### MessageActions

Menu de ações para mensagens (responder, copiar, encaminhar, deletar, reagir).

```typescript
<MessageActions
  messageId={message.id}
  onReaction={handleReaction}
  onForward={handleForward}
  onDelete={handleDelete}
  onReply={handleReply}
  onCopy={handleCopy}
  isDarkMode={true}
/>
```

### ForwardModal

Modal para seleção de contatos para encaminhamento.

```typescript
<ForwardModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onForward={(phones) => handleForward(phones)}
  contacts={contacts}
  loading={loading}
  isDarkMode={true}
/>
```

### MediaGallery

Galeria de mídia com filtros por tipo e ações.

```typescript
<MediaGallery
  media={media}
  loading={loading}
  onDelete={(mediaId) => handleDelete(mediaId)}
  onDownload={(media) => handleDownload(media)}
  isDarkMode={true}
/>
```

### GroupsView

Visualização de grupos com lista e detalhes.

```typescript
<GroupsView
  groups={groups}
  participants={participants}
  selectedGroup={selectedGroup}
  loading={loading}
  onSelectGroup={handleSelectGroup}
  onCreateGroup={handleCreateGroup}
  onEditGroup={handleEditGroup}
  onDeleteGroup={handleDeleteGroup}
  onArchiveGroup={handleArchiveGroup}
  isDarkMode={true}
/>
```

## Integração com MessageBubble

O componente `MessageBubble` foi estendido para suportar:

1. **Exibição de reações** - Mostra emojis de reação abaixo da mensagem
2. **Indicador de deletado** - Mostra "[Mensagem deletada]" para mensagens deletadas
3. **Indicador de encaminhado** - Mostra badge de encaminhado
4. **Menu de ações** - Acesso a todas as ações via `MessageActions`

## Fluxo de Dados

### Reações

```
MessageBubble
  ↓
MessageActions (click reaction)
  ↓
ReactionPicker (select emoji)
  ↓
useWhatsAppReactions.toggleReaction()
  ↓
POST /api/whatsapp/sessions/{id}/reactions
  ↓
Supabase (insert/delete)
  ↓
Trigger (update reaction_count)
  ↓
Realtime subscription
  ↓
MessageBubble (update)
```

### Encaminhamento

```
MessageBubble
  ↓
MessageActions (click forward)
  ↓
ForwardModal (select contacts)
  ↓
useWhatsAppForward.forwardMessage()
  ↓
POST /api/whatsapp/sessions/{id}/forward
  ↓
Supabase (insert forwards)
  ↓
Trigger (update forward_count)
  ↓
Toast notification
```

### Deleção

```
MessageBubble
  ↓
MessageActions (click delete)
  ↓
Confirmation dialog
  ↓
useWhatsAppDelete.deleteMessage()
  ↓
DELETE /api/whatsapp/sessions/{id}/delete
  ↓
Supabase (insert deletion, update message)
  ↓
MessageBubble (update is_deleted)
```

## Segurança

### Row Level Security (RLS)

Todas as tabelas possuem políticas RLS que garantem:

1. Usuários só podem ver dados da sua empresa
2. Usuários só podem modificar dados que pertencem à sua sessão
3. Super users têm acesso completo

### Validações

- Validação de tipos de mídia
- Validação de tamanho de arquivo
- Validação de permissões de grupo
- Validação de contatos válidos

## Performance

### Índices

- Índices compostos para queries frequentes
- Índices em colunas de filtro
- Índices em colunas de ordenação

### Cache

- Cache local de reações
- Cache local de grupos
- Cache local de mídia

### Paginação

- Suporte a paginação para mídia
- Suporte a paginação para grupos
- Suporte a paginação para participantes

## Realtime

### Subscriptions

- Reações em tempo real
- Grupos em tempo real
- Participantes em tempo real

### Triggers

- Atualização automática de contadores
- Atualização automática de status

## Próximos Passos

1. Integração com Baileys para sincronização de reações
2. Suporte a reações de grupo
3. Suporte a encaminhamento em massa
4. Suporte a agendamento de mensagens
5. Suporte a templates de mensagens

## Troubleshooting

### Reações não aparecem

1. Verificar se a sessão está ativa
2. Verificar se o messageId é válido
3. Verificar permissões RLS

### Upload de mídia falha

1. Verificar tamanho do arquivo
2. Verificar tipo de arquivo
3. Verificar espaço em storage

### Grupos não sincronizam

1. Verificar conexão com WhatsApp
2. Verificar permissões de grupo
3. Verificar se o grupo existe

## Referências

- [Baileys Documentation](https://github.com/WhiskeySockets/Baileys)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [React Hooks](https://react.dev/reference/react)
