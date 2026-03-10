// Types for WhatsLídia Chat Interface

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'image' | 'video' | 'document' | 'audio' | 'template' | 'sticker';
export type ConversationStatus = 'open' | 'pending' | 'resolved';
export type ContactSource = 'whatsapp' | 'instagram' | 'facebook' | 'email';

export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isRegistered: boolean;
  source: ContactSource;
  email?: string;
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  isFromMe: boolean;
  timestamp: Date;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    caption?: string;
    duration?: number; // For audio/video
    width?: number; // For images/videos
    height?: number;
    url?: string;
    thumbnail?: string;
    audioBlob?: Blob; // For audio messages
  };
  reactions?: {
    emoji: string;
    count: number;
    userReacted: boolean;
  }[];
  replyTo?: {
    messageId: string;
    content: string;
    sender: string;
  };
}

export interface Conversation {
  id: string;
  contact: Contact;
  status: ConversationStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  lastMessage?: {
    content: string;
    timestamp: Date;
    type: MessageType;
    isFromMe: boolean;
    status: MessageStatus;
  };
  unreadCount: number;
  assignedTo?: {
    id: string;
    name: string;
    avatar?: string;
  };
  tags: string[];
  channel: ContactSource;
  isTyping?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WABAStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: Date;
  recipientId: string;
}

export interface ChatTemplate {
  id: string;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  components: {
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    text?: string;
    format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    example?: {
      header_text?: string[];
      body_text?: string[][];
    };
    buttons?: {
      type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
      text: string;
      url?: string;
      phone_number?: string;
    }[];
  }[];
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

export interface InternalNote {
  id: string;
  conversationId: string;
  content: string;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  conversationId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: {
    id: string;
    name: string;
    avatar?: string;
  };
  dueDate?: Date;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface QuickReply {
  id: string;
  shortcut: string;
  message: string;
  category?: string;
  teamId?: string;
}

export interface ChatSettings {
  soundEnabled: boolean;
  desktopNotifications: boolean;
  enterToSend: boolean;
  messagePreview: boolean;
  readReceipts: boolean;
  theme: 'light' | 'dark' | 'system';
}

export type ChatView = 'conversations' | 'contacts' | 'notes' | 'tasks' | 'settings';

export interface FilterOptions {
  status?: ConversationStatus[];
  priority?: ('low' | 'medium' | 'high' | 'urgent')[];
  assignedTo?: string[];
  tags?: string[];
  channel?: ContactSource[];
  dateFrom?: Date;
  dateTo?: Date;
}
