// Tipos para Sistema WhatsApp QR Code

export type WhatsAppSessionStatus = 
  | 'creating'
  | 'waiting_qr'
  | 'connecting'
  | 'connected'
  | 'active'
  | 'disconnected'
  | 'error';

export type WhatsAppMessageStatus = 
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export type WhatsAppMessageDirection = 'incoming' | 'outgoing';

export type WhatsAppMessageType = 
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'sticker'
  | 'location'
  | 'vcard';

export interface WhatsAppSession {
  id: string;
  company_id: string;
  name: string;
  token: string;
  status: WhatsAppSessionStatus;
  phone_number?: string;
  push_name?: string;
  profile_picture?: string;
  credentials?: Record<string, unknown>;
  last_connected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  session_id: string;
  message_id: string;
  contact_phone: string;
  contact_name?: string;
  content: string;
  type: WhatsAppMessageType;
  direction: WhatsAppMessageDirection;
  status: WhatsAppMessageStatus;
  media_url?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  created_at: string;
}

export interface WhatsAppContact {
  id: string;
  session_id: string;
  phone: string;
  name: string;
  profile_picture?: string;
  status?: string;
  last_message_at?: string;
  is_group: boolean;
  group_participants?: string[];
  created_at: string;
  updated_at: string;
}

export interface WhatsAppQRCode {
  id: string;
  session_id: string;
  qr_code_data: string;
  expires_at: string;
  created_at: string;
}

export interface CreateSessionInput {
  name: string;
}

export interface SendMessageInput {
  phone: string;
  message: string;
  type?: WhatsAppMessageType;
}

export interface WhatsAppConnectionState {
  connection: 'close' | 'connecting' | 'open';
  qr?: string;
  receivedPendingNotifications?: boolean;
}

export interface Conversation {
  contact: WhatsAppContact;
  lastMessage?: WhatsAppMessage;
  unreadCount: number;
}

// Tipos para eventos do Baileys
export interface BaileysMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  messageTimestamp: number;
  pushName?: string;
  message?: {
    conversation?: string;
    imageMessage?: {
      caption?: string;
      url?: string;
    };
    videoMessage?: {
      caption?: string;
    };
    audioMessage?: {};
    documentMessage?: {
      fileName?: string;
    };
    extendedTextMessage?: {
      text?: string;
    };
    stickerMessage?: {};
    locationMessage?: {};
    contactMessage?: {};
  };
}

export interface BaileysContact {
  id: string;
  name?: string;
  notify?: string;
  verifiedName?: string;
  imgUrl?: string;
  status?: string;
}
