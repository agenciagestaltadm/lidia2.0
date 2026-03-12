# Plano de Implementação - Sistema de Chat Corporativo Interno

## Fase 1: Backend e Banco de Dados

### 1.1 Migration do Supabase
- [ ] Criar arquivo `supabase/migrations/007_add_internal_chat_tables.sql`
- [ ] Definir ENUMs: `channel_access_type`, `message_type`, `user_status`
- [ ] Criar tabela `chat_channels`
- [ ] Criar tabela `chat_channel_members`
- [ ] Criar tabela `chat_messages`
- [ ] Criar tabela `chat_message_read_status`
- [ ] Criar tabela `chat_message_reactions`
- [ ] Criar tabela `chat_pinned_messages`
- [ ] Criar tabela `chat_user_status`
- [ ] Criar tabela `chat_typing_indicators`
- [ ] Criar tabela `chat_attachments`
- [ ] Criar índices otimizados
- [ ] Criar triggers de updated_at
- [ ] Configurar RLS para todas as tabelas

### 1.2 Tipos TypeScript
- [ ] Criar arquivo `src/types/internal-chat.ts`
- [ ] Definir tipos: `ChannelType`, `MessageType`, `UserStatus`
- [ ] Definir interface `ChatChannel`
- [ ] Definir interface `ChatChannelMember`
- [ ] Definir interface `ChatMessage`
- [ ] Definir interface `MessageMetadata`
- [ ] Definir interface `MessageReaction`
- [ ] Definir interface `ChatPinnedMessage`
- [ ] Definir interface `ChatUserStatus`
- [ ] Definir interface `ChatTypingIndicator`
- [ ] Definir interface `ChatAttachment`
- [ ] Definir interface `ChatSearchResult`
- [ ] Definir interface `ChatState`

### 1.3 API REST
- [ ] Criar `src/app/api/chat/channels/route.ts` (GET, POST)
- [ ] Criar `src/app/api/chat/channels/[id]/route.ts` (GET, PATCH, DELETE)
- [ ] Criar `src/app/api/chat/channels/[id]/members/route.ts` (GET, POST, DELETE)
- [ ] Criar `src/app/api/chat/channels/[id]/messages/route.ts` (GET, POST)
- [ ] Criar `src/app/api/chat/channels/[id]/pins/route.ts` (GET, POST, DELETE)
- [ ] Criar `src/app/api/chat/messages/[id]/route.ts` (PATCH, DELETE)
- [ ] Criar `src/app/api/chat/messages/[id]/reactions/route.ts` (POST, DELETE)
- [ ] Criar `src/app/api/chat/messages/[id]/read/route.ts` (POST)
- [ ] Criar `src/app/api/chat/direct/route.ts` (GET - lista conversas diretas)
- [ ] Criar `src/app/api/chat/direct/[userId]/route.ts` (GET mensagens)
- [ ] Criar `src/app/api/chat/search/route.ts` (GET busca)
- [ ] Criar `src/app/api/chat/upload/route.ts` (POST upload de arquivos)
- [ ] Criar `src/app/api/chat/users/status/route.ts` (GET, POST)

### 1.4 WebSocket Server
- [ ] Criar `src/lib/websocket/server.ts`
- [ ] Configurar Socket.IO ou ws
- [ ] Implementar autenticação JWT no handshake
- [ ] Implementar handlers de eventos do cliente
- [ ] Implementar broadcast de eventos
- [ ] Implementar rooms por canal
- [ ] Implementar rate limiting
- [ ] Implementar reconexão automática

### 1.5 Criptografia
- [ ] Criar `src/lib/chat/encryption.ts`
- [ ] Implementar geração de chaves AES-256-GCM
- [ ] Implementar função `encryptMessage()`
- [ ] Implementar função `decryptMessage()`
- [ ] Implementar armazenamento seguro de chaves
- [ ] Implementar rotação de chaves

### 1.6 Storage de Arquivos
- [ ] Configurar bucket `chat-attachments` no Supabase Storage
- [ ] Implementar políticas de acesso
- [ ] Implementar compressão de imagens
- [ ] Implementar geração de thumbnails

## Fase 2: Hooks e Estado

### 2.1 Hooks de Chat
- [ ] Criar `src/hooks/use-internal-chat.ts`
- [ ] Criar `src/hooks/use-chat-channels.ts`
- [ ] Criar `src/hooks/use-chat-messages.ts`
- [ ] Criar `src/hooks/use-websocket.ts`
- [ ] Criar `src/hooks/use-encryption.ts`
- [ ] Criar `src/hooks/use-chat-notifications.ts`
- [ ] Criar `src/hooks/use-user-status.ts`
- [ ] Criar `src/hooks/use-typing-indicator.ts`
- [ ] Criar `src/hooks/use-message-search.ts`

### 2.2 Context Providers
- [ ] Criar `src/contexts/chat-context.tsx`
- [ ] Criar `src/contexts/websocket-context.tsx`
- [ ] Criar `src/contexts/notifications-context.tsx`

### 2.3 Gerenciamento de Estado
- [ ] Implementar reducer para chat state
- [ ] Implementar ações: LOAD_CHANNELS, SET_CURRENT_CHANNEL, etc
- [ ] Implementar middleware para persistência

## Fase 3: Componentes de UI

### 3.1 Layout Principal
- [ ] Criar `src/app/(dashboard)/app/atendimento/comunicacao/page.tsx`
- [ ] Criar `src/app/(dashboard)/app/atendimento/comunicacao/layout.tsx`
- [ ] Criar `InternalChatLayout.tsx`

### 3.2 Sidebar
- [ ] Criar `ChatSidebar.tsx`
- [ ] Criar `ChannelList.tsx`
- [ ] Criar `ChannelItem.tsx`
- [ ] Criar `DirectMessageList.tsx`
- [ ] Criar `DirectMessageItem.tsx`
- [ ] Criar `UserList.tsx`
- [ ] Criar `UserStatusIndicator.tsx`

### 3.3 Área de Chat
- [ ] Criar `ChatRoom.tsx`
- [ ] Criar `ChatHeader.tsx`
- [ ] Criar `PinnedMessages.tsx`
- [ ] Criar `MessageList.tsx`
- [ ] Criar `MessageBubble.tsx`
- [ ] Criar `MessageInput.tsx`
- [ ] Criar `TypingIndicator.tsx`

### 3.4 Funcionalidades de Mensagem
- [ ] Criar `MessageReactions.tsx`
- [ ] Criar `MessageReply.tsx`
- [ ] Criar `MessageMenu.tsx` (ações na mensagem)
- [ ] Criar `AttachmentPreview.tsx`
- [ ] Criar `AttachmentUploader.tsx`
- [ ] Criar `UserMention.tsx` (@usuario)
- [ ] Criar `EmojiPicker.tsx`

### 3.5 Busca e Filtros
- [ ] Criar `SearchMessages.tsx`
- [ ] Criar `SearchFilters.tsx`
- [ ] Criar `SearchResults.tsx`

### 3.6 Modais
- [ ] Criar `CreateChannelModal.tsx`
- [ ] Criar `ChannelSettingsModal.tsx`
- [ ] Criar `AddMemberModal.tsx`
- [ ] Criar `UserProfileModal.tsx`
- [ ] Criar `DeleteMessageModal.tsx`
- [ ] Criar `EditMessageModal.tsx`

### 3.7 Notificações
- [ ] Criar `ChatNotification.tsx`
- [ ] Criar `NotificationBadge.tsx`
- [ ] Implementar som de notificação
- [ ] Implementar notificações desktop

### 3.8 Estados Vazios e Loading
- [ ] Criar `ChatEmptyState.tsx`
- [ ] Criar `ChatSkeleton.tsx`
- [ ] Criar `MessageSkeleton.tsx`

## Fase 4: Funcionalidades Avançadas

### 4.1 Busca Avançada
- [ ] Implementar busca full-text no PostgreSQL
- [ ] Implementar filtros por data
- [ ] Implementar filtros por usuário
- [ ] Implementar filtros por tipo de mensagem
- [ ] Implementar highlight dos termos buscados

### 4.2 Mensagens Fixadas
- [ ] Implementar fixar/desafixar mensagens
- [ ] Mostrar mensagens fixadas no topo do canal
- [ ] Implementar limite de mensagens fixadas

### 4.3 Reações
- [ ] Implementar adicionar reação
- [ ] Implementar remover reação
- [ ] Mostrar contador de reações
- [ ] Tooltip com usuários que reagiram

### 4.4 Menções
- [ ] Implementar autocomplete de @usuario
- [ ] Destacar menções nas mensagens
- [ ] Notificar usuário mencionado

### 4.5 Anexos
- [ ] Suporte a imagens com preview
- [ ] Suporte a vídeos com player
- [ ] Suporte a áudio com waveform
- [ ] Suporte a documentos com download
- [ ] Arrastar e soltar arquivos

### 4.6 Status Online
- [ ] Atualizar status em tempo real
- [ ] Mostrar "visto por último"
- [ ] Custom status message

### 4.7 Indicador de Digitação
- [ ] Detectar digitação no input
- [ ] Enviar evento via WebSocket
- [ ] Mostrar "Usuário está digitando..."
- [ ] Timeout de 30 segundos

### 4.8 Criptografia End-to-End
- [ ] Gerar chaves no cliente
- [ ] Trocar chaves públicas
- [ ] Criptografar antes de enviar
- [ ] Descriptografar ao receber

## Fase 5: Integrações

### 5.1 Integração com Sistema de Permissões
- [ ] Verificar `canViewAttendances` para acesso
- [ ] Verificar role para ações administrativas
- [ ] Filtrar canais por permissões
- [ ] Restringir ações no backend

### 5.2 Integração com Supabase Realtime
- [ ] Configurar subscriptions para mensagens
- [ ] Configurar subscriptions para reações
- [ ] Configurar subscriptions para status
- [ ] Configurar subscriptions para membros

### 5.3 Integração com Página de Atendimento
- [ ] Adicionar aba "Comunicação Interna" no `AtendimentoTabs`
- [ ] Atualizar layout existente
- [ ] Compartilhar estado quando necessário

### 5.4 Integração com Notificações do Sistema
- [ ] Integrar com sistema de notificações existente
- [ ] Incrementar badge na sidebar
- [ ] Notificações push quando minimizado

## Fase 6: Painel Administrativo

### 6.1 Gerenciamento de Canais
- [ ] Criar lista de todos os canais
- [ ] Criar/Editar/Excluir canais
- [ ] Gerenciar membros dos canais
- [ ] Configurar permissões de canal

### 6.2 Gerenciamento de Usuários
- [ ] Ver status de todos os usuários
- [ ] Adicionar/remover usuários de canais
- [ ] Definir administradores de canal

### 6.3 Auditoria
- [ ] Log de mensagens excluídas
- [ ] Log de edições
- [ ] Log de ações administrativas

## Fase 7: Testes

### 7.1 Testes Unitários
- [ ] Testar hooks de chat
- [ ] Testar funções de criptografia
- [ ] Testar componentes de UI

### 7.2 Testes de Integração
- [ ] Testar fluxo de mensagens
- [ ] Testar WebSocket
- [ ] Testar upload de arquivos

### 7.3 Testes E2E
- [ ] Testar cenário de envio de mensagem
- [ ] Testar cenário de criação de canal
- [ ] Testar cenário de busca

## Fase 8: Otimização e Deploy

### 8.1 Performance
- [ ] Implementar virtualização da lista de mensagens
- [ ] Otimizar re-renderizações
- [ ] Implementar lazy loading de anexos
- [ ] Configurar cache com TanStack Query

### 8.2 Responsividade
- [ ] Adaptar layout para mobile
- [ ] Implementar swipe para voltar
- [ ] Otimizar input para mobile
- [ ] Testar em diferentes tamanhos

### 8.3 Acessibilidade
- [ ] Adicionar ARIA labels
- [ ] Suporte a navegação por teclado
- [ ] Contraste adequado
- [ ] Screen reader friendly

### 8.4 Deploy
- [ ] Executar migrations
- [ ] Configurar variáveis de ambiente
- [ ] Configurar WebSocket em produção
- [ ] Testar em ambiente de staging

## Dependências a Instalar

```bash
# WebSocket
npm install socket.io-client

# Criptografia
npm install crypto-js
npm install -D @types/crypto-js

# Emojis
npm install emoji-picker-react

# Data/hora
npm install date-fns

# Virtualização
npm install react-window
npm install -D @types/react-window

# Som
npm install use-sound

# Query e Estado
npm install @tanstack/react-query
npm install zustand

# Formulários
npm install react-hook-form
npm install @hookform/resolvers
npm install zod
```

## Checklist de Aceitação

- [ ] Usuário pode ver lista de canais
- [ ] Usuário pode criar novo canal (se tiver permissão)
- [ ] Usuário pode enviar mensagem de texto
- [ ] Usuário pode enviar anexos
- [ ] Mensagens aparecem em tempo real
- [ ] Indicador de status online funciona
- [ ] Busca de mensagens funciona
- [ ] Reações às mensagens funcionam
- [ ] Menções com @ funcionam
- [ ] Notificações sonoras funcionam
- [ ] Design responsivo funciona
- [ ] Criptografia está ativa
- [ ] Permissões são respeitadas
- [ ] Painel administrativo funciona
