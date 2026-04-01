import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers,
  makeCacheableSignalKeyStore,
  downloadMediaMessage,
  WAProto,
  useMultiFileAuthState as useAuthState,
} from '@whiskeysockets/baileys';
import type { WASocket, WAMessage, WAMessageKey, WAMessageUpdate, Contact, Chat } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';

// Diretório de sessões do WhatsApp
const WHATSAPP_SESSIONS_DIR = process.env.WHATSAPP_SESSIONS_DIR ||
  (process.env.VERCEL ? '/tmp/whatsapp-sessions' : path.join(process.cwd(), 'whatsapp-sessions'));

// Logger customizado silencioso
const baileysLogger = {
  level: 'silent',
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: (...args: any[]) => console.log('[Baileys WARN]', ...args),
  error: (...args: any[]) => console.error('[Baileys ERROR]', ...args),
  fatal: (...args: any[]) => console.error('[Baileys FATAL]', ...args),
  child: () => baileysLogger,
} as any;

import type {
  WhatsAppSession,
  WhatsAppMessage,
  WhatsAppContact,
  BaileysMessage,
  BaileysContact,
} from '@/types/whatsapp';

// ============================================================
// SISTEMA DE FILA DE PROCESSAMENTO DE MENSAGENS
// ============================================================

interface QueuedMessage {
  type: 'upsert' | 'update' | 'delete' | 'status_update';
  data: any;
  timestamp: number;
  priority: number;
}

class MessageQueue {
  private queue: QueuedMessage[] = [];
  private processing = false;
  private sessionId: string;
  private processingCount = 0;
  private maxConcurrent = 3; // Processa até 3 mensagens simultâneas
  private activeProcesses = 0;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  enqueue(item: QueuedMessage) {
    // Ordena por prioridade (menor número = maior prioridade)
    this.queue.push(item);
    this.queue.sort((a, b) => a.priority - b.priority);
    
    if (!this.processing) {
      this.process();
    }
  }

  private async process() {
    this.processing = true;
    
    while (this.queue.length > 0 || this.activeProcesses > 0) {
      // Processa até maxConcurrent mensagens simultâneas
      while (this.activeProcesses < this.maxConcurrent && this.queue.length > 0) {
        const item = this.queue.shift();
        if (item) {
          this.activeProcesses++;
          this.processItem(item).finally(() => {
            this.activeProcesses--;
          });
        }
      }
      
      // Aguarda um pouco antes de verificar novamente
      await new Promise(resolve => setImmediate(resolve));
    }
    
    this.processing = false;
  }

  private async processItem(item: QueuedMessage) {
    const service = messageQueueServices.get(this.sessionId);
    if (!service) return;

    try {
      switch (item.type) {
        case 'upsert':
          await service.handleIncomingMessage(item.data.msg, item.data.isHistorical);
          break;
        case 'update':
          await service.handleMessageStatusUpdate(item.data.update);
          break;
        case 'delete':
          await service.handleMessageDelete(item.data);
          break;
        case 'status_update':
          await service.processStatusUpdate(item.data);
          break;
      }
    } catch (error) {
      console.error(`[MessageQueue] Error processing ${item.type}:`, error);
    }
  }
}

// ============================================================
// MAPAS GLOBAIS
// ============================================================

const activeSessions = new Map<string, WASocket>();
const sessionCallbacks = new Map<string, {
  onQR?: (qr: string) => void;
  onConnection?: (status: string, phone?: string, pushName?: string) => void;
  onMessage?: (message: WhatsAppMessage) => void;
  onContact?: (contact: WhatsAppContact) => void;
}>();
const reconnectAttempts = new Map<string, number>();
const messageQueues = new Map<string, MessageQueue>();
const messageQueueServices = new Map<string, BaileysService>();
const MAX_RECONNECT_ATTEMPTS = 5;

// Store global para contatos e mensagens (em memória)
const contactsStore = new Map<string, Map<string, Contact>>();
const messagesStore = new Map<string, Map<string, WAMessage[]>>();
const chatsStore = new Map<string, Map<string, Chat>>();

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureSessionsDir() {
  try {
    await fs.access(WHATSAPP_SESSIONS_DIR);
  } catch {
    try {
      await fs.mkdir(WHATSAPP_SESSIONS_DIR, { recursive: true });
      console.log(`[BaileysService] Diretório de sessões criado: ${WHATSAPP_SESSIONS_DIR}`);
    } catch (error) {
      console.error(`[BaileysService] Erro ao criar diretório de sessões:`, error);
      if (WHATSAPP_SESSIONS_DIR !== '/tmp/whatsapp-sessions') {
        try {
          await fs.mkdir('/tmp/whatsapp-sessions', { recursive: true });
        } catch {}
      }
    }
  }
}

// ============================================================
// CLASSE PRINCIPAL
// ============================================================

export class BaileysService {
  private sessionId: string;
  private companyId: string;
  private socket?: WASocket;

  constructor(sessionId: string, companyId: string) {
    this.sessionId = sessionId;
    this.companyId = companyId;
    
    // Registra instância para uso pela fila
    if (sessionId) {
      messageQueueServices.set(sessionId, this);
      if (!messageQueues.has(sessionId)) {
        messageQueues.set(sessionId, new MessageQueue(sessionId));
      }
    }
  }

  async createSession(name: string): Promise<WhatsAppSession> {
    console.log('[BaileysService] Criando sessão:', { name, companyId: this.companyId });
    const supabase = await createClient();

    const token = uuidv4();

    const { data: session, error } = await supabase
      .from('whatsapp_sessions')
      .insert({
        company_id: this.companyId,
        name,
        token,
        status: 'creating',
      })
      .select()
      .single();

    if (error) {
      console.error('[BaileysService] Erro ao criar sessão:', error);
      throw new Error(`Erro no banco de dados: ${error.message} (${error.code})`);
    }

    console.log('[BaileysService] Sessão criada:', session.id);
    return session as WhatsAppSession;
  }

  async startSession(
    onQR?: (qr: string) => void,
    onConnection?: (status: string, phone?: string, pushName?: string) => void
  ): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from('whatsapp_sessions')
      .update({ status: 'waiting_qr' })
      .eq('id', this.sessionId);

    await ensureSessionsDir();

    const authPath = path.join(WHATSAPP_SESSIONS_DIR, this.sessionId);
    
    try {
      await fs.mkdir(authPath, { recursive: true });
    } catch (mkdirError) {
      console.error(`[BaileysService] Erro ao criar diretório:`, mkdirError);
      throw new Error('Não foi possível criar diretório de sessão');
    }
    
    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    console.log('[BaileysService] Criando socket @whiskeysockets/baileys v7...');

    // Configuração otimizada do socket
    this.socket = makeWASocket({
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
      },
      logger: baileysLogger,
      browser: Browsers.ubuntu('Chrome'),
      connectTimeoutMs: 120000,
      keepAliveIntervalMs: 15000, // Reduzido de 30s para 15s para detecção rápida
      markOnlineOnConnect: true,   // Mostra como online ao conectar
      syncFullHistory: true,       // Sincroniza histórico completo
      generateHighQualityLinkPreview: true,
      defaultQueryTimeoutMs: 60000,
      emitOwnEvents: true,         // Recebe eventos de mensagens enviadas
      // Configurações de retry
      retryRequestDelayMs: 250,
      maxMsgRetryCount: 5,
      fireInitQueries: true,
    });

    // Armazena sessão ativa
    activeSessions.set(this.sessionId, this.socket);
    sessionCallbacks.set(this.sessionId, { onQR, onConnection });

    // ============================================================
    // EVENTO: connection.update
    // ============================================================
    this.socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr, receivedPendingNotifications } = update;
      
      console.log('[BaileysService] connection.update:', {
        connection,
        hasQR: !!qr,
        receivedPendingNotifications,
        lastDisconnectStatus: (lastDisconnect?.error as Boom)?.output?.statusCode,
      });

      // QR code gerado
      if (qr && onQR) {
        try {
          console.log('[BaileysService] QR code gerado! Comprimento:', qr.length);
          onQR(qr);

          await supabase.from('whatsapp_qr_codes').insert({
            session_id: this.sessionId,
            qr_code_data: qr,
            expires_at: new Date(Date.now() + 60 * 1000).toISOString(),
          });
        } catch (error) {
          console.error('[BaileysService] Error in QR callback:', error);
        }
      }

      // Notificações pendentes recebidas (sincronização completa)
      if (receivedPendingNotifications) {
        console.log('[BaileysService] Sincronização de histórico completa');
      }

      // Conexão fechada
      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const errorMessage = lastDisconnect?.error?.message || 'Unknown error';
        const attempts = reconnectAttempts.get(this.sessionId) || 0;
        
        console.log('[BaileysService] Connection closed:', { statusCode, attempts, error: errorMessage });

        if (statusCode === DisconnectReason.loggedOut) {
          console.log('[BaileysService] Logged out, not reconnecting');
          reconnectAttempts.delete(this.sessionId);
          activeSessions.delete(this.sessionId);
          messageQueues.delete(this.sessionId);
          messageQueueServices.delete(this.sessionId);
          
          // Limpa stores em memória
          contactsStore.delete(this.sessionId);
          messagesStore.delete(this.sessionId);
          chatsStore.delete(this.sessionId);
          
          await supabase
            .from('whatsapp_sessions')
            .update({ status: 'disconnected', updated_at: new Date().toISOString() })
            .eq('id', this.sessionId);

          onConnection?.('disconnected');
          return;
        }

        if (attempts >= MAX_RECONNECT_ATTEMPTS) {
          console.error('[BaileysService] Max reconnection attempts reached');
          reconnectAttempts.delete(this.sessionId);
          activeSessions.delete(this.sessionId);
          messageQueues.delete(this.sessionId);
          messageQueueServices.delete(this.sessionId);
          
          // Limpa stores em memória
          contactsStore.delete(this.sessionId);
          messagesStore.delete(this.sessionId);
          chatsStore.delete(this.sessionId);
          
          await BaileysService.clearSessionAuth(this.sessionId);
          onConnection?.('error', undefined, `Falha após ${MAX_RECONNECT_ATTEMPTS} tentativas`);
          
          await supabase
            .from('whatsapp_sessions')
            .update({ status: 'error', updated_at: new Date().toISOString() })
            .eq('id', this.sessionId);
          
          return;
        }

        onConnection?.('retrying' as any, undefined, `Reconectando... Tentativa ${attempts + 1}/${MAX_RECONNECT_ATTEMPTS}`);
        reconnectAttempts.set(this.sessionId, attempts + 1);
        
        if (errorMessage.includes('Connection Failure') || statusCode === 405) {
          console.warn('[BaileysService] Connection Failure (405), clearing auth...');
          await BaileysService.clearSessionAuth(this.sessionId);
        }
        
        const retryDelay = Math.min((attempts + 1) * 3000, 15000);
        console.log(`[BaileysService] Reconnecting in ${retryDelay / 1000}s...`);
        await delay(retryDelay);
        await this.startSession(onQR, onConnection);
      }

      // Conexão aberta
      if (connection === 'open') {
        const user = this.socket?.user;
        reconnectAttempts.delete(this.sessionId);
        
        console.log('[BaileysService] Connection opened!', {
          userId: user?.id,
          userName: user?.name,
        });

        await supabase
          .from('whatsapp_sessions')
          .update({
            status: 'active',
            phone_number: user?.id?.split(':')[0],
            push_name: user?.name,
            last_connected_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', this.sessionId);

        onConnection?.('active', user?.id?.split(':')[0], user?.name);
      }
    });

    // ============================================================
    // EVENTO: creds.update
    // ============================================================
    this.socket.ev.on('creds.update', saveCreds);

    // ============================================================
    // EVENTO: messages.upsert - Mensagens novas e histórico
    // ============================================================
    this.socket.ev.on('messages.upsert', async (m) => {
      const queue = messageQueues.get(this.sessionId);
      if (!queue) return;

      console.log(`[BaileysService] messages.upsert: ${m.messages.length} mensagens (tipo: ${m.type})`);

      const isHistorical = m.type === 'append';

      // Inicializa stores da sessão se não existirem
      if (!messagesStore.has(this.sessionId)) {
        messagesStore.set(this.sessionId, new Map());
      }
      const sessionMessages = messagesStore.get(this.sessionId)!;

      for (const msg of m.messages) {
        const jid = msg.key.remoteJid;
        if (jid) {
          // Armazena mensagem em memória
          if (!sessionMessages.has(jid)) {
            sessionMessages.set(jid, []);
          }
          const chatMessages = sessionMessages.get(jid)!;
          
          // Evita duplicatas
          const exists = chatMessages.some(m => m.key.id === msg.key.id);
          if (!exists) {
            chatMessages.push(msg);
            // Mantém apenas últimas 100 mensagens por chat
            if (chatMessages.length > 100) {
              chatMessages.shift();
            }
          }
        }

        queue.enqueue({
          type: 'upsert',
          data: { msg, isHistorical },
          timestamp: Date.now(),
          priority: isHistorical ? 2 : 1, // Mensagens novas têm prioridade
        });
      }
    });

    // ============================================================
    // EVENTO: messages.update - Atualizações de status
    // ============================================================
    this.socket.ev.on('messages.update', async (updates) => {
      const queue = messageQueues.get(this.sessionId);
      if (!queue) return;

      console.log(`[BaileysService] messages.update: ${updates.length} atualizações`);

      for (const update of updates) {
        queue.enqueue({
          type: 'update',
          data: { update },
          timestamp: Date.now(),
          priority: 3, // Baixa prioridade
        });
      }
    });

    // ============================================================
    // EVENTO: messages.delete - Mensagens deletadas
    // ============================================================
    this.socket.ev.on('messages.delete', async (item) => {
      const queue = messageQueues.get(this.sessionId);
      if (!queue) return;

      console.log(`[BaileysService] messages.delete:`, item);

      if ('keys' in item && Array.isArray(item.keys)) {
        for (const key of item.keys) {
          queue.enqueue({
            type: 'delete',
            data: { key, all: false },
            timestamp: Date.now(),
            priority: 1,
          });
        }
      } else if ('jid' in item && item.all) {
        queue.enqueue({
          type: 'delete',
          data: { jid: item.jid, all: true },
          timestamp: Date.now(),
          priority: 1,
        });
      }
    });

    // ============================================================
    // EVENTO: contacts.upsert - Novos contatos
    // ============================================================
    this.socket.ev.on('contacts.upsert', async (contacts) => {
      console.log(`[BaileysService] contacts.upsert: ${contacts.length} contatos`);
      
      // Inicializa store da sessão se não existir
      if (!contactsStore.has(this.sessionId)) {
        contactsStore.set(this.sessionId, new Map());
      }
      const sessionContacts = contactsStore.get(this.sessionId)!;
      
      for (const contact of contacts) {
        // Armazena em memória
        sessionContacts.set(contact.id, contact as Contact);
        await this.handleContactUpdate(contact as BaileysContact);
      }
    });

    // ============================================================
    // EVENTO: contacts.update - Atualizações de contatos
    // ============================================================
    this.socket.ev.on('contacts.update', async (contacts) => {
      console.log(`[BaileysService] contacts.update: ${contacts.length} atualizações`);
      for (const contact of contacts) {
        await this.handleContactUpdate(contact as BaileysContact);
      }
    });

    // ============================================================
    // EVENTO: groups.upsert - Novos grupos
    // ============================================================
    this.socket.ev.on('groups.upsert', async (groups) => {
      console.log(`[BaileysService] groups.upsert: ${groups.length} grupos`);
      for (const group of groups) {
        await this.handleGroupUpdate(group);
      }
    });

    // ============================================================
    // EVENTO: groups.update - Atualizações de grupos
    // ============================================================
    this.socket.ev.on('groups.update', async (updates) => {
      console.log(`[BaileysService] groups.update: ${updates.length} atualizações`);
      for (const update of updates) {
        await this.handleGroupUpdate(update);
      }
    });

    // ============================================================
    // EVENTO: group-participants.update - Participantes de grupos
    // ============================================================
    this.socket.ev.on('group-participants.update', async (update) => {
      console.log(`[BaileysService] group-participants.update:`, {
        id: update.id,
        participants: update.participants,
        action: update.action,
      });
      await this.handleGroupParticipantsUpdate(update);
    });

    // ============================================================
    // EVENTO: presence.update - Presença (online/typing)
    // ============================================================
    this.socket.ev.on('presence.update', async (update) => {
      await this.handlePresenceUpdate(update);
    });

    // ============================================================
    // EVENTO: chats.upsert - Novos chats
    // ============================================================
    this.socket.ev.on('chats.upsert', async (chats) => {
      console.log(`[BaileysService] chats.upsert: ${chats.length} chats`);
      for (const chat of chats) {
        await this.handleChatUpdate(chat);
      }
    });

    // ============================================================
    // EVENTO: chats.update - Atualizações de chats
    // ============================================================
    this.socket.ev.on('chats.update', async (updates) => {
      for (const update of updates) {
        await this.handleChatUpdate(update);
      }
    });
  }

  // ============================================================
  // PROCESSAMENTO DE MENSAGENS ENTRANTES
  // ============================================================

  async handleIncomingMessage(msg: BaileysMessage, isHistorical = false): Promise<void> {
    const supabase = await createClient();

    try {
      const phone = msg.key.remoteJid.split('@')[0];
      const isGroup = msg.key.remoteJid.includes('@g.us');
      const isFromMe = msg.key.fromMe;

      // Ignora mensagens de status
      if (msg.key.remoteJid === 'status@broadcast') {
        return;
      }

      // Extrai conteúdo
      let content = '';
      let type: WhatsAppMessage['type'] = 'text';
      let mediaUrl: string | null = null;
      let metadata: Record<string, any> = {};

      if (msg.message?.conversation) {
        content = msg.message.conversation;
      } else if (msg.message?.extendedTextMessage?.text) {
        content = msg.message.extendedTextMessage.text;
        
        // Verifica se é mensagem encaminhada
        if (msg.message.extendedTextMessage.contextInfo?.isForwarded) {
          metadata.isForwarded = true;
          metadata.forwardScore = msg.message.extendedTextMessage.contextInfo.forwardingScore;
        }
      } else if (msg.message?.imageMessage) {
        content = msg.message.imageMessage.caption || '[Imagem]';
        type = 'image';
        metadata.mediaSize = msg.message.imageMessage.fileLength;
      } else if (msg.message?.videoMessage) {
        content = msg.message.videoMessage.caption || '[Vídeo]';
        type = 'video';
        metadata.mediaSize = msg.message.videoMessage.fileLength;
        metadata.duration = msg.message.videoMessage.seconds;
      } else if (msg.message?.audioMessage) {
        content = msg.message.audioMessage.ptt ? '[Nota de voz]' : '[Áudio]';
        type = 'audio';
        metadata.duration = msg.message.audioMessage.seconds;
        metadata.isPtt = msg.message.audioMessage.ptt;
      } else if (msg.message?.documentMessage) {
        content = msg.message.documentMessage.caption || `[Documento: ${msg.message.documentMessage.fileName}]`;
        type = 'document';
        metadata.fileName = msg.message.documentMessage.fileName;
        metadata.mediaSize = msg.message.documentMessage.fileLength;
      } else if (msg.message?.stickerMessage) {
        content = '[Sticker]';
        type = 'sticker';
      } else if (msg.message?.locationMessage) {
        content = '[Localização]';
        type = 'location';
        metadata.latitude = msg.message.locationMessage.degreesLatitude;
        metadata.longitude = msg.message.locationMessage.degreesLongitude;
      } else if (msg.message?.contactMessage) {
        content = '[Contato]';
        type = 'vcard';
        metadata.vcard = msg.message.contactMessage.vcard;
      } else if (msg.message?.pollCreationMessage) {
        content = '[Enquete]';
        type = 'text';
        metadata.isPoll = true;
      }

      // Verifica se mensagem já existe
      const { data: existingMessage } = await supabase
        .from('whatsapp_messages')
        .select('id')
        .eq('session_id', this.sessionId)
        .eq('message_id', msg.key.id)
        .maybeSingle();

      if (existingMessage) {
        console.log(`[BaileysService] Mensagem ${msg.key.id} já existe, ignorando`);
        return;
      }

      // Salva mensagem no banco
      const { data: savedMessage, error: insertError } = await supabase
        .from('whatsapp_messages')
        .insert({
          session_id: this.sessionId,
          message_id: msg.key.id,
          contact_phone: phone,
          contact_name: msg.pushName,
          content,
          type,
          direction: isFromMe ? 'outgoing' : 'incoming',
          status: isFromMe ? 'sent' : 'delivered',
          timestamp: new Date(msg.messageTimestamp * 1000).toISOString(),
          metadata: Object.keys(metadata).length > 0 ? metadata : null,
          is_from_me: isFromMe,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[BaileysService] Erro ao salvar mensagem:', insertError);
        return;
      }

      console.log(`[BaileysService] Mensagem salva: ${savedMessage.id} (${type})`);

      // Atualiza ou cria contato
      await this.upsertContact(phone, msg.pushName, isGroup, new Date(msg.messageTimestamp * 1000));

      // Notifica callback
      const callbacks = sessionCallbacks.get(this.sessionId);
      if (callbacks?.onMessage && savedMessage) {
        callbacks.onMessage(savedMessage as WhatsAppMessage);
      }

      // Baixa mídia em background (não bloqueia)
      if (['image', 'video', 'audio', 'document'].includes(type)) {
        this.downloadAndSaveMedia(msg, msg.key.id).catch(error => {
          console.error('[BaileysService] Erro ao baixar mídia:', error);
        });
      }
    } catch (error) {
      console.error('[BaileysService] Erro ao processar mensagem:', error);
    }
  }

  // ============================================================
  // ATUALIZAÇÃO DE STATUS DE MENSAGEM
  // ============================================================

  async handleMessageStatusUpdate(update: any): Promise<void> {
    const supabase = await createClient();

    try {
      const messageId = update.key?.id;
      const status = update.update?.status;

      if (!messageId || status === undefined) return;

      // Mapeia status do Baileys
      let mappedStatus: string | null = null;
      switch (status) {
        case 0: // ERROR
          mappedStatus = 'failed';
          break;
        case 1: // PENDING
          mappedStatus = 'pending';
          break;
        case 2: // SERVER_ACK
        case 3: // DELIVERY_ACK
          mappedStatus = 'delivered';
          break;
        case 4: // READ
        case 5: // PLAYED
          mappedStatus = 'read';
          break;
        default:
          return;
      }

      if (!mappedStatus) return;

      const { data: existingMessage } = await supabase
        .from('whatsapp_messages')
        .select('id, status')
        .eq('session_id', this.sessionId)
        .eq('message_id', messageId)
        .maybeSingle();

      if (existingMessage && existingMessage.status !== mappedStatus) {
        await supabase
          .from('whatsapp_messages')
          .update({
            status: mappedStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingMessage.id);

        console.log(`[BaileysService] Status atualizado: ${messageId} -> ${mappedStatus}`);
      }
    } catch (error) {
      console.error('[BaileysService] Erro ao atualizar status:', error);
    }
  }

  // ============================================================
  // DELEÇÃO DE MENSAGEM
  // ============================================================

  async handleMessageDelete(data: { key?: WAMessageKey; jid?: string; all: boolean }): Promise<void> {
    const supabase = await createClient();

    try {
      if (data.all && data.jid) {
        // Marca todas as mensagens do chat como deletadas
        const phone = data.jid.split('@')[0];
        await supabase
          .from('whatsapp_messages')
          .update({ is_deleted: true, updated_at: new Date().toISOString() })
          .eq('session_id', this.sessionId)
          .eq('contact_phone', phone);
        
        console.log(`[BaileysService] Todas as mensagens de ${phone} marcadas como deletadas`);
      } else if (data.key?.id) {
        // Marca mensagem específica como deletada
        const { data: existingMessage } = await supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('session_id', this.sessionId)
          .eq('message_id', data.key.id)
          .maybeSingle();

        if (existingMessage) {
          await supabase
            .from('whatsapp_messages')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', existingMessage.id);
          
          console.log(`[BaileysService] Mensagem ${data.key.id} marcada como deletada`);
        }
      }
    } catch (error) {
      console.error('[BaileysService] Erro ao processar deleção:', error);
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  private async upsertContact(phone: string, pushName?: string, isGroup = false, lastMessageAt?: Date): Promise<void> {
    const supabase = await createClient();

    try {
      const { data: existingContact } = await supabase
        .from('whatsapp_contacts')
        .select('id, name')
        .eq('session_id', this.sessionId)
        .eq('phone', phone)
        .maybeSingle();

      const contactData = {
        name: pushName || existingContact?.name || phone,
        last_message_at: lastMessageAt?.toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingContact) {
        await supabase
          .from('whatsapp_contacts')
          .update(contactData)
          .eq('id', existingContact.id);
      } else {
        await supabase.from('whatsapp_contacts').insert({
          session_id: this.sessionId,
          phone,
          is_group: isGroup,
          ...contactData,
        });
        console.log(`[BaileysService] Novo contato criado: ${phone}`);
      }
    } catch (error) {
      console.error('[BaileysService] Erro ao atualizar contato:', error);
    }
  }

  private async handleContactUpdate(contact: BaileysContact): Promise<void> {
    const supabase = await createClient();

    try {
      const phone = contact.id.split('@')[0];
      const isGroup = contact.id.includes('@g.us');

      const { data: existingContact } = await supabase
        .from('whatsapp_contacts')
        .select('id')
        .eq('session_id', this.sessionId)
        .eq('phone', phone)
        .maybeSingle();

      const contactData = {
        name: contact.name || contact.verifiedName || contact.notify || phone,
        status: contact.status,
        profile_picture: contact.imgUrl,
        updated_at: new Date().toISOString(),
      };

      if (existingContact) {
        await supabase
          .from('whatsapp_contacts')
          .update(contactData)
          .eq('id', existingContact.id);
      } else {
        await supabase.from('whatsapp_contacts').insert({
          session_id: this.sessionId,
          phone,
          ...contactData,
          is_group: isGroup,
        });
      }
    } catch (error) {
      console.error('[BaileysService] Erro ao processar contato:', error);
    }
  }

  private async handleGroupUpdate(group: any): Promise<void> {
    // Implementação para grupos
    console.log(`[BaileysService] Processando grupo:`, group.id);
  }

  private async handleGroupParticipantsUpdate(update: { id: string; participants: any[]; action: string; author?: string; authorPn?: string }): Promise<void> {
    const participantIds = update.participants.map((p: any) => typeof p === 'string' ? p : p.id);
    console.log(`[BaileysService] Grupo ${update.id}: ${update.action} ${participantIds.length} participantes`);
  }

  private async handlePresenceUpdate(update: { id: string; presences: any }): Promise<void> {
    // Atualiza presença em tempo real se necessário
    // console.log(`[BaileysService] Presença atualizada:`, update.id);
  }

  private async handleChatUpdate(chat: any): Promise<void> {
    // Processa atualizações de chat (arquivamento, fix, etc)
    if (chat.archived !== undefined || chat.pinned !== undefined) {
      console.log(`[BaileysService] Chat update:`, { archived: chat.archived, pinned: chat.pinned });
    }
  }

  async processStatusUpdate(data: any): Promise<void> {
    // Processa atualizações de status
    console.log('[BaileysService] Status update:', data);
  }

  private async downloadAndSaveMedia(msg: BaileysMessage, messageId: string): Promise<void> {
    if (!this.socket) return;

    try {
      const type = msg.message?.imageMessage ? 'image' :
                   msg.message?.videoMessage ? 'video' :
                   msg.message?.audioMessage ? 'audio' :
                   msg.message?.documentMessage ? 'document' : null;

      if (!type) return;

      console.log(`[BaileysService] Baixando mídia ${type} para mensagem ${messageId}`);

      const buffer = await downloadMediaMessage(
        msg as any,
        'buffer',
        {},
        { logger: baileysLogger, reuploadRequest: this.socket.updateMediaMessage }
      );

      if (!buffer) {
        console.log(`[BaileysService] Mídia não disponível para download`);
        return;
      }

      const base64 = Buffer.from(buffer).toString('base64');
      const mimeType = type === 'image' ? 'image/jpeg' :
                       type === 'video' ? 'video/mp4' :
                       type === 'audio' ? 'audio/ogg; codecs=opus' :
                       'application/octet-stream';

      const mediaData = `data:${mimeType};base64,${base64}`;

      const supabase = await createClient();
      await supabase
        .from('whatsapp_messages')
        .update({ media_url: mediaData, updated_at: new Date().toISOString() })
        .eq('message_id', messageId)
        .eq('session_id', this.sessionId);

      console.log(`[BaileysService] Mídia ${type} salva para mensagem ${messageId}`);
    } catch (error) {
      console.error('[BaileysService] Erro ao baixar mídia:', error);
    }
  }

  // ============================================================
  // RESTAURAÇÃO DE SESSÃO
  // ============================================================

  async restoreSession(): Promise<boolean> {
    const existingSocket = activeSessions.get(this.sessionId);
    if (existingSocket) {
      this.socket = existingSocket;
      return true;
    }

    const supabase = await createClient();
    
    const { data: session } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', this.sessionId)
      .eq('company_id', this.companyId)
      .single();

    if (!session || session.status !== 'active') {
      return false;
    }

    const authPath = path.join(WHATSAPP_SESSIONS_DIR, this.sessionId);
    
    try {
      await fs.access(authPath);
    } catch {
      return false;
    }

    try {
      const { state, saveCreds } = await useMultiFileAuthState(authPath);
      
      this.socket = makeWASocket({
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, baileysLogger),
        },
        logger: baileysLogger,
        browser: Browsers.ubuntu('Chrome'),
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 15000,
        markOnlineOnConnect: true,
        syncFullHistory: false, // Não sincroniza histórico na restauração
        generateHighQualityLinkPreview: true,
        defaultQueryTimeoutMs: 60000,
        emitOwnEvents: true,
      });

      activeSessions.set(this.sessionId, this.socket);
      messageQueueServices.set(this.sessionId, this);
      if (!messageQueues.has(this.sessionId)) {
        messageQueues.set(this.sessionId, new MessageQueue(this.sessionId));
      }

      // Reconfigura todos os eventos
      this.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          if (statusCode === DisconnectReason.loggedOut) {
            activeSessions.delete(this.sessionId);
            sessionCallbacks.delete(this.sessionId);
            messageQueues.delete(this.sessionId);
            messageQueueServices.delete(this.sessionId);
            
            await supabase
              .from('whatsapp_sessions')
              .update({ status: 'disconnected', updated_at: new Date().toISOString() })
              .eq('id', this.sessionId);
          }
        }
      });

      this.socket.ev.on('creds.update', saveCreds);
      this.socket.ev.on('messages.upsert', async (m) => {
        const queue = messageQueues.get(this.sessionId);
        if (queue) {
          for (const msg of m.messages) {
            queue.enqueue({
              type: 'upsert',
              data: { msg, isHistorical: false },
              timestamp: Date.now(),
              priority: 1,
            });
          }
        }
      });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 30000);

        this.socket?.ev.on('connection.update', (update) => {
          if (update.connection === 'open') {
            clearTimeout(timeout);
            resolve(true);
          } else if (update.connection === 'close') {
            clearTimeout(timeout);
            resolve(false);
          }
        });
      });
    } catch (error) {
      console.error('[BaileysService] Erro ao restaurar sessão:', error);
      return false;
    }
  }

  // ============================================================
  // ENVIO DE MENSAGENS
  // ============================================================

  async sendMessage(phone: string, message: string): Promise<WhatsAppMessage | null> {
    if (!this.socket) {
      const activeSocket = activeSessions.get(this.sessionId);
      if (activeSocket) {
        this.socket = activeSocket;
      } else {
        const restored = await this.restoreSession();
        if (!restored) throw new Error('Sessão não iniciada');
      }
    }

    const supabase = await createClient();
    const formattedPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

    if (!this.socket) throw new Error('Sessão não iniciada');

    const result = await this.socket.sendMessage(formattedPhone, { text: message });

    if (!result?.key) throw new Error('Falha ao enviar mensagem');

    const { data: savedMessage } = await supabase
      .from('whatsapp_messages')
      .insert({
        session_id: this.sessionId,
        message_id: result.key.id,
        contact_phone: phone.replace('@s.whatsapp.net', '').replace('@g.us', ''),
        content: message,
        type: 'text',
        direction: 'outgoing',
        status: 'sent',
        timestamp: new Date().toISOString(),
        is_from_me: true,
      })
      .select()
      .single();

    return savedMessage as WhatsAppMessage | null;
  }

  async sendMediaMessage(
    phone: string,
    mediaBuffer: Buffer,
    mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker',
    caption?: string,
    fileName?: string
  ): Promise<WhatsAppMessage | null> {
    if (!this.socket) {
      const activeSocket = activeSessions.get(this.sessionId);
      if (activeSocket) {
        this.socket = activeSocket;
      } else {
        const restored = await this.restoreSession();
        if (!restored) throw new Error('Sessão não iniciada');
      }
    }

    const supabase = await createClient();
    const formattedPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

    if (!this.socket) throw new Error('Sessão não iniciada');

    let messageContent: any = {};

    switch (mediaType) {
      case 'image':
        messageContent = { image: mediaBuffer, caption: caption || '' };
        break;
      case 'video':
        messageContent = { video: mediaBuffer, caption: caption || '' };
        break;
      case 'audio':
        messageContent = { audio: mediaBuffer, ptt: true };
        break;
      case 'document':
        messageContent = { document: mediaBuffer, fileName: fileName || 'documento', caption: caption || '' };
        break;
      case 'sticker':
        messageContent = { sticker: mediaBuffer };
        break;
    }

    const result = await this.socket.sendMessage(formattedPhone, messageContent);

    if (!result?.key) throw new Error('Falha ao enviar mídia');

    const { data: savedMessage } = await supabase
      .from('whatsapp_messages')
      .insert({
        session_id: this.sessionId,
        message_id: result.key.id,
        contact_phone: phone.replace('@s.whatsapp.net', '').replace('@g.us', ''),
        content: caption || `[${mediaType.toUpperCase()}]`,
        type: mediaType,
        direction: 'outgoing',
        status: 'sent',
        timestamp: new Date().toISOString(),
        metadata: { fileName: fileName || null, mediaSize: mediaBuffer.length },
        is_from_me: true,
      })
      .select()
      .single();

    return savedMessage as WhatsAppMessage | null;
  }

  async syncContacts(): Promise<WhatsAppContact[]> {
    if (!this.socket) {
      const activeSocket = activeSessions.get(this.sessionId);
      if (activeSocket) {
        this.socket = activeSocket;
      } else {
        const restored = await this.restoreSession();
        if (!restored) throw new Error('Sessão não iniciada');
      }
    }

    if (!this.socket) throw new Error('Sessão não iniciada');

    const supabase = await createClient();
    const syncedContacts: WhatsAppContact[] = [];

    try {
      // Retorna contatos existentes do banco
      // Os contatos são sincronizados automaticamente via events do Baileys
      const { data: contacts, error } = await supabase
        .from('whatsapp_contacts')
        .select('*')
        .eq('session_id', this.sessionId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      console.log(`[BaileysService] Retornados ${contacts?.length || 0} contatos`);
      return (contacts || []) as WhatsAppContact[];
    } catch (error) {
      console.error('[BaileysService] Erro ao buscar contatos:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    const supabase = await createClient();

    if (this.socket) {
      try {
        await this.socket.logout();
        this.socket.end(undefined);
      } catch (error) {
        console.log('[BaileysService] Error during logout:', error);
      }
    }

    activeSessions.delete(this.sessionId);
    sessionCallbacks.delete(this.sessionId);
    messageQueues.delete(this.sessionId);
    messageQueueServices.delete(this.sessionId);

    await supabase
      .from('whatsapp_sessions')
      .update({ status: 'disconnected', updated_at: new Date().toISOString() })
      .eq('id', this.sessionId);
  }

  static getSession(sessionId: string): WASocket | undefined {
    return activeSessions.get(sessionId);
  }

  static isSessionActive(sessionId: string): boolean {
    return activeSessions.has(sessionId);
  }

  static async listSessions(companyId: string): Promise<WhatsAppSession[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as WhatsAppSession[];
  }

  static async getSessionById(sessionId: string, companyId: string): Promise<WhatsAppSession | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('company_id', companyId)
      .single();

    if (error) return null;
    return data as WhatsAppSession;
  }

  static async clearSessionAuth(sessionId: string): Promise<void> {
    try {
      const sessionPath = path.join(WHATSAPP_SESSIONS_DIR, sessionId);
      await fs.rm(sessionPath, { recursive: true, force: true });
      console.log(`[BaileysService] Auth cleared for session: ${sessionId}`);
    } catch (error) {
      console.log(`[BaileysService] No auth to clear for session: ${sessionId}`);
    }
  }

  static async deleteSession(sessionId: string, companyId: string): Promise<void> {
    const supabase = await createClient();

    const socket = activeSessions.get(sessionId);
    if (socket) {
      try {
        await socket.logout();
        socket.end(undefined);
      } catch (error) {
        console.log('[BaileysService] Error during logout:', error);
      }
      activeSessions.delete(sessionId);
      sessionCallbacks.delete(sessionId);
      messageQueues.delete(sessionId);
      messageQueueServices.delete(sessionId);
    }

    await this.clearSessionAuth(sessionId);

    await supabase
      .from('whatsapp_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('company_id', companyId);
  }

  // ============================================================
  // BUSCA DIRETA DO WHATSAPP (PARA CARREGAMENTO RÁPIDO)
  // ============================================================

  /**
   * Busca contatos diretamente do WhatsApp (não do Supabase)
   * Retorna imediatamente para exibição na UI
   */
  async fetchContactsFromWhatsApp(): Promise<WhatsAppContact[]> {
    if (!this.socket) {
      const activeSocket = activeSessions.get(this.sessionId);
      if (activeSocket) {
        this.socket = activeSocket;
      } else {
        const restored = await this.restoreSession();
        if (!restored) throw new Error('Sessão não iniciada');
      }
    }

    if (!this.socket) throw new Error('Sessão não iniciada');

    try {
      // Busca contatos do store em memória
      const sessionContacts = contactsStore.get(this.sessionId);
      
      if (!sessionContacts || sessionContacts.size === 0) {
        console.log('[BaileysService] Nenhum contato em memória, retornando array vazio');
        return [];
      }

      // Converte para array de contatos
      const contactsArray: WhatsAppContact[] = Array.from(sessionContacts.values()).map((contact) => {
        const phone = contact.id.split('@')[0];
        const isGroup = contact.id.includes('@g.us');
        
        return {
          id: `${this.sessionId}-${phone}`,
          session_id: this.sessionId,
          phone: phone,
          name: contact.name || (contact as any).verifiedName || (contact as any).notify || phone,
          profile_picture: (contact as any).imgUrl || null,
          status: (contact as any).status || null,
          last_message_at: undefined,
          is_group: isGroup,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      // Ordena por nome
      contactsArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      console.log(`[BaileysService] Retornados ${contactsArray.length} contatos do WhatsApp`);
      return contactsArray;
    } catch (error) {
      console.error('[BaileysService] Erro ao buscar contatos do WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Salva contatos no Supabase em background
   * Não bloqueia a UI
   */
  async saveContactsToSupabase(contacts: WhatsAppContact[]): Promise<void> {
    const supabase = await createClient();

    try {
      for (const contact of contacts) {
        const { data: existing } = await supabase
          .from('whatsapp_contacts')
          .select('id')
          .eq('session_id', this.sessionId)
          .eq('phone', contact.phone)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('whatsapp_contacts')
            .update({
              name: contact.name,
              profile_picture: contact.profile_picture,
              status: contact.status,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('whatsapp_contacts').insert({
            session_id: this.sessionId,
            phone: contact.phone,
            name: contact.name,
            profile_picture: contact.profile_picture,
            status: contact.status,
            is_group: contact.is_group,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }

      console.log(`[BaileysService] ${contacts.length} contatos salvos no Supabase`);
    } catch (error) {
      console.error('[BaileysService] Erro ao salvar contatos no Supabase:', error);
      // Não propaga o erro - é background
    }
  }

  /**
   * Busca mensagens diretamente do WhatsApp para um contato específico
   * Retorna imediatamente para exibição na UI
   */
  async fetchMessagesFromWhatsApp(phone: string, limit: number = 50): Promise<WhatsAppMessage[]> {
    if (!this.socket) {
      const activeSocket = activeSessions.get(this.sessionId);
      if (activeSocket) {
        this.socket = activeSocket;
      } else {
        const restored = await this.restoreSession();
        if (!restored) throw new Error('Sessão não iniciada');
      }
    }

    if (!this.socket) throw new Error('Sessão não iniciada');

    try {
      const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
      
      // Busca mensagens do store em memória
      const sessionMessages = messagesStore.get(this.sessionId);
      const messages = sessionMessages?.get(jid);
      
      if (!messages || messages.length === 0) {
        console.log(`[BaileysService] Nenhuma mensagem em memória para ${phone}`);
        return [];
      }

      // Converte para array e ordena por timestamp
      const messagesArray: WhatsAppMessage[] = messages
        .slice(-limit) // Pega as últimas 'limit' mensagens
        .map((msg) => {
          const isFromMe = msg.key.fromMe;
          const msgPhone = (msg.key.remoteJid || '').split('@')[0];
          
          // Extrai conteúdo
          let content = '';
          let type: WhatsAppMessage['type'] = 'text';
          
          if (msg.message?.conversation) {
            content = msg.message.conversation;
          } else if (msg.message?.extendedTextMessage?.text) {
            content = msg.message.extendedTextMessage.text;
          } else if (msg.message?.imageMessage) {
            content = msg.message.imageMessage.caption || '[Imagem]';
            type = 'image';
          } else if (msg.message?.videoMessage) {
            content = msg.message.videoMessage.caption || '[Vídeo]';
            type = 'video';
          } else if (msg.message?.audioMessage) {
            content = msg.message.audioMessage.ptt ? '[Nota de voz]' : '[Áudio]';
            type = 'audio';
          } else if (msg.message?.documentMessage) {
            content = `[Documento: ${msg.message.documentMessage.fileName}]`;
            type = 'document';
          } else if (msg.message?.stickerMessage) {
            content = '[Sticker]';
            type = 'sticker';
          }

          return {
            id: `${this.sessionId}-${msg.key.id}`,
            session_id: this.sessionId,
            message_id: msg.key.id || '',
            contact_phone: msgPhone,
            contact_name: (msg as any).pushName || undefined,
            content,
            type,
            direction: isFromMe ? 'outgoing' : 'incoming',
            status: isFromMe ? 'sent' : 'delivered',
            timestamp: new Date(((msg as any).messageTimestamp || 0) * 1000).toISOString(),
            is_from_me: isFromMe || undefined,
            created_at: new Date().toISOString(),
          };
        });

      // Ordena por timestamp (mais antigas primeiro)
      messagesArray.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      console.log(`[BaileysService] Retornadas ${messagesArray.length} mensagens do WhatsApp para ${phone}`);
      return messagesArray;
    } catch (error) {
      console.error('[BaileysService] Erro ao buscar mensagens do WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Salva mensagens no Supabase em background
   * Não bloqueia a UI
   */
  async saveMessagesToSupabase(messages: WhatsAppMessage[]): Promise<void> {
    const supabase = await createClient();

    try {
      for (const message of messages) {
        const { data: existing } = await supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('session_id', this.sessionId)
          .eq('message_id', message.message_id)
          .maybeSingle();

        if (!existing) {
          await supabase.from('whatsapp_messages').insert({
            session_id: message.session_id,
            message_id: message.message_id,
            contact_phone: message.contact_phone,
            contact_name: message.contact_name,
            content: message.content,
            type: message.type,
            direction: message.direction,
            status: message.status,
            timestamp: message.timestamp,
            is_from_me: message.is_from_me,
            created_at: message.created_at,
          });
        }
      }

      console.log(`[BaileysService] ${messages.length} mensagens salvas no Supabase`);
    } catch (error) {
      console.error('[BaileysService] Erro ao salvar mensagens no Supabase:', error);
      // Não propaga o erro - é background
    }
  }
}

export default BaileysService;
