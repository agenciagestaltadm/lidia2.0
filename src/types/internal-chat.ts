// ============================================================
// TIPOS DO SISTEMA DE CHAT CORPORATIVO INTERNO - LIDIA 2.0
// ============================================================

export type ChannelType = 'public' | 'private' | 'restricted';
export type MessageType = 'text' | 'image' | 'video' | 'document' | 'audio' | 'system';
export type UserStatus = 'online' | 'away' | 'busy' | 'offline';
export type ChannelMemberRole = 'admin' | 'member';

// ============================================================
// INTERFACES PRINCIPAIS
// ============================================================

export interface ChatChannel {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  type: ChannelType;
  createdBy: string;
  isGeneral: boolean;
  isActive: boolean;
  avatarUrl?: string;
  memberCount: number;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  // Campos calculados/joined
  unreadCount?: number;
  isMuted?: boolean;
  lastReadAt?: string;
  myRole?: ChannelMemberRole;
}

export interface ChatChannelMember {
  id: string;
  channelId: string;
  userId: string;
  user?: ChatUser;
  role: ChannelMemberRole;
  joinedAt: string;
  lastReadAt?: string;
  isMuted: boolean;
  notificationCount: number;
}

export interface ChatUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role?: string;
  status?: UserStatus;
  lastSeenAt?: string;
  customStatus?: string;
  isActive?: boolean;
}

export interface ChatMessage {
  id: string;
  channelId?: string;
  directRecipientId?: string;
  senderId: string;
  sender?: ChatUser;
  companyId: string;
  type: MessageType;
  content: string;
  contentEncrypted?: string;
  iv?: string;
  metadata?: MessageMetadata;
  replyToId?: string;
  replyTo?: ReplyToInfo;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  // Campos calculados/joined
  reactions?: MessageReaction[];
  readBy?: string[];
  isPinned?: boolean;
  attachments?: ChatAttachment[];
}

export interface MessageMetadata {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  duration?: number;
  width?: number;
  height?: number;
  url?: string;
  thumbnailUrl?: string;
}

export interface ReplyToInfo {
  id: string;
  content: string;
  senderName: string;
  senderId: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  userReacted: boolean;
  users?: string[];
}

export interface ChatPinnedMessage {
  id: string;
  channelId: string;
  messageId: string;
  message?: ChatMessage;
  pinnedBy: string;
  pinnedAt: string;
}

export interface ChatUserStatus {
  userId: string;
  companyId: string;
  status: UserStatus;
  lastSeenAt: string;
  customStatus?: string;
  updatedAt: string;
}

export interface ChatTypingIndicator {
  channelId?: string;
  directRecipientId?: string;
  userId: string;
  user?: Pick<ChatUser, 'name' | 'avatar'>;
  startedAt: string;
  expiresAt: string;
}

export interface ChatAttachment {
  id: string;
  messageId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  createdAt: string;
}

// ============================================================
// TIPOS PARA ESTADO E OPERAÇÕES
// ============================================================

export interface ChatState {
  // Canais
  channels: ChatChannel[];
  currentChannel: ChatChannel | null;
  
  // Mensagens
  messages: ChatMessage[];
  pinnedMessages: ChatPinnedMessage[];
  hasMoreMessages: boolean;
  isLoadingMessages: boolean;
  
  // Usuários
  onlineUsers: ChatUserStatus[];
  typingUsers: ChatTypingIndicator[];
  
  // Diretas (DMs como pseudo-canais)
  directConversations: DirectConversation[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  sidebarOpen: boolean;
  
  // Busca
  searchQuery: string;
  searchResults: ChatSearchResult | null;
  isSearching: boolean;
}

export interface DirectConversation {
  userId: string;
  user: ChatUser;
  lastMessage?: ChatMessage;
  unreadCount: number;
  isMuted: boolean;
  updatedAt: string;
}

export interface ChatSearchResult {
  messages: ChatMessage[];
  channels: ChatChannel[];
  users: ChatUser[];
  totalCount: number;
}

export interface ChatSearchFilters {
  channelId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  messageType?: MessageType;
}

// ============================================================
// TIPOS PARA REQUISIÇÕES E RESPOSTAS DA API
// ============================================================

export interface CreateChannelRequest {
  name: string;
  description?: string;
  type: ChannelType;
  memberIds?: string[];
}

export interface UpdateChannelRequest {
  name?: string;
  description?: string;
  type?: ChannelType;
  isActive?: boolean;
}

export interface SendMessageRequest {
  channelId?: string;
  recipientId?: string;
  content: string;
  type?: MessageType;
  metadata?: MessageMetadata;
  replyToId?: string;
  attachments?: File[];
}

export interface UpdateMessageRequest {
  content: string;
}

export interface AddReactionRequest {
  emoji: string;
}

export interface MarkAsReadRequest {
  messageIds: string[];
}

export interface JoinChannelRequest {
  userId?: string; // Se não informado, usa o usuário atual
}

export interface InviteToChannelRequest {
  userIds: string[];
}

export interface UpdateMemberRoleRequest {
  role: ChannelMemberRole;
}

export interface SearchMessagesRequest {
  query: string;
  channelId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

// ============================================================
// TIPOS PARA WEBSOCKET EVENTS
// ============================================================

// Eventos do servidor -> cliente
export interface ServerToClientEvents {
  'message:new': (message: ChatMessage) => void;
  'message:updated': (message: ChatMessage) => void;
  'message:deleted': (data: { messageId: string; channelId?: string }) => void;
  'message:reaction': (data: { messageId: string; reactions: MessageReaction[] }) => void;
  'message:read': (data: { messageId: string; userId: string; readAt: string }) => void;
  'typing:start': (data: ChatTypingIndicator) => void;
  'typing:stop': (data: { channelId?: string; userId: string }) => void;
  'user:status': (data: ChatUserStatus) => void;
  'channel:member_joined': (data: { channelId: string; member: ChatChannelMember }) => void;
  'channel:member_left': (data: { channelId: string; userId: string }) => void;
  'channel:member_role_changed': (data: { channelId: string; userId: string; role: ChannelMemberRole }) => void;
  'channel:message_pinned': (data: ChatPinnedMessage) => void;
  'channel:message_unpinned': (data: { channelId: string; messageId: string }) => void;
  'channel:updated': (channel: ChatChannel) => void;
  'error': (error: { code: string; message: string }) => void;
}

// Eventos do cliente -> servidor
export interface ClientToServerEvents {
  'auth': (token: string) => void;
  'channel:join': (channelId: string) => void;
  'channel:leave': (channelId: string) => void;
  'message:send': (data: SendMessageRequest) => void;
  'message:edit': (data: { messageId: string; content: string }) => void;
  'message:delete': (messageId: string) => void;
  'message:react': (data: { messageId: string; emoji: string }) => void;
  'message:unreact': (data: { messageId: string; emoji: string }) => void;
  'message:read': (data: { messageId: string }) => void;
  'typing:start': (data: { channelId?: string; recipientId?: string }) => void;
  'typing:stop': (data: { channelId?: string; recipientId?: string }) => void;
  'user:status_update': (status: UserStatus, customStatus?: string) => void;
  'direct:subscribe': (userId: string) => void;
  'direct:unsubscribe': (userId: string) => void;
}

// ============================================================
// TIPOS PARA NOTIFICAÇÕES
// ============================================================

export interface ChatNotification {
  id: string;
  type: 'message' | 'mention' | 'reaction' | 'system';
  title: string;
  body: string;
  channelId?: string;
  messageId?: string;
  senderId?: string;
  sender?: ChatUser;
  createdAt: string;
  read: boolean;
}

export interface ChatNotificationSettings {
  soundEnabled: boolean;
  desktopNotifications: boolean;
  showPreview: boolean;
  mutedChannels: string[];
  mutedUsers: string[];
  mentionNotifications: boolean;
  allMessagesNotifications: boolean;
}

// ============================================================
// TIPOS PARA PAINEL ADMINISTRATIVO
// ============================================================

export interface ChatAdminStats {
  totalChannels: number;
  totalMessages: number;
  activeUsersToday: number;
  totalFiles: number;
  storageUsed: number;
}

export interface ChatAuditLog {
  id: string;
  action: 'message_delete' | 'message_edit' | 'channel_create' | 'channel_delete' | 'member_add' | 'member_remove' | 'member_role_change';
  actorId: string;
  actor?: ChatUser;
  targetId: string;
  targetType: 'message' | 'channel' | 'member';
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ============================================================
// UTILITÁRIOS DE TIPO
// ============================================================

export type ChatEvent = 
  | { type: 'message:new'; payload: ChatMessage }
  | { type: 'message:updated'; payload: ChatMessage }
  | { type: 'message:deleted'; payload: { messageId: string } }
  | { type: 'typing:start'; payload: ChatTypingIndicator }
  | { type: 'typing:stop'; payload: { userId: string } }
  | { type: 'user:status'; payload: ChatUserStatus };

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface ChatError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
