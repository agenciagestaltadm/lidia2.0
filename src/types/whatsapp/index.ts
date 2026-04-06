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
  updated_at?: string;
  reaction_count?: number;
  is_deleted?: boolean;
  is_forwarded?: boolean;
  forward_count?: number;
  is_from_me?: boolean;
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
  conversation_status?: 'open' | 'pending' | 'resolved';
  opened_at?: string;
  resolved_at?: string;
  unread_count?: number;
  has_new_messages?: boolean;
  last_message?: WhatsAppMessage;
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

// ============================================================
// Phase 2 Types
// ============================================================

export interface WhatsAppMessageReaction {
  id: string;
  session_id: string;
  message_id: string;
  contact_phone: string;
  reaction_emoji: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessageForward {
  id: string;
  session_id: string;
  original_message_id: string;
  forwarded_to_phone: string;
  forwarded_at: string;
  created_at: string;
}

export interface WhatsAppMessageDeletion {
  id: string;
  session_id: string;
  message_id: string;
  deleted_by: string;
  deletion_type: 'user' | 'admin';
  reason?: string;
  deleted_at: string;
  created_at: string;
}

export interface WhatsAppGroup {
  id: string;
  session_id: string;
  group_jid: string;
  name: string;
  description?: string;
  profile_picture_url?: string;
  owner_phone?: string;
  participants_count: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppGroupParticipant {
  id: string;
  group_id: string;
  participant_phone: string;
  participant_name?: string;
  is_admin: boolean;
  joined_at: string;
  created_at: string;
}

export interface WhatsAppMedia {
  id: string;
  session_id: string;
  message_id?: string;
  media_type: 'image' | 'video' | 'audio' | 'document' | 'sticker';
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  storage_path: string;
  storage_url?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
  metadata?: Record<string, unknown>;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

// Tipos para eventos do Baileys
// Usando any para campos complexos do proto do WhatsApp
export interface BaileysMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
    participant?: string;
  };
  messageTimestamp: number;
  pushName?: string;
  message?: {
    conversation?: string;
    imageMessage?: {
      caption?: string;
      url?: string;
      fileLength?: string | number;
      [key: string]: any;
    };
    videoMessage?: {
      caption?: string;
      fileLength?: string | number;
      seconds?: number;
      [key: string]: any;
    };
    audioMessage?: {
      ptt?: boolean;
      seconds?: number;
      fileLength?: string | number;
      [key: string]: any;
    };
    documentMessage?: {
      fileName?: string;
      caption?: string;
      fileLength?: string | number;
      [key: string]: any;
    };
    extendedTextMessage?: {
      text?: string;
      contextInfo?: {
        isForwarded?: boolean;
        forwardingScore?: number;
        [key: string]: any;
      };
      [key: string]: any;
    };
    stickerMessage?: {
      [key: string]: any;
    };
    locationMessage?: {
      degreesLatitude?: number;
      degreesLongitude?: number;
      [key: string]: any;
    };
    contactMessage?: {
      vcard?: string;
      [key: string]: any;
    };
    pollCreationMessage?: {
      [key: string]: any;
    };
    protocolMessage?: {
      type?: number;
      key?: any;
      [key: string]: any;
    };
    [key: string]: any;
  };
  messageStubType?: number;
  messageStubParameters?: string[];
  [key: string]: any;
}

export interface BaileysContact {
  id: string;
  name?: string;
  notify?: string;
  verifiedName?: string;
  imgUrl?: string;
  status?: string;
  [key: string]: any;
}
