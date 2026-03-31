import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  BaileysEventMap,
  delay,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import type {
  WhatsAppSession,
  WhatsAppMessage,
  WhatsAppContact,
  BaileysMessage,
  BaileysContact,
} from '@/types/whatsapp';

// Mapa de sessões ativas em memória
const activeSessions = new Map<string, WASocket>();
const sessionCallbacks = new Map<string, {
  onQR?: (qr: string) => void;
  onConnection?: (status: string) => void;
  onMessage?: (message: WhatsAppMessage) => void;
  onContact?: (contact: WhatsAppContact) => void;
}>();

export class BaileysService {
  private sessionId: string;
  private companyId: string;
  private socket?: WASocket;

  constructor(sessionId: string, companyId: string) {
    this.sessionId = sessionId;
    this.companyId = companyId;
  }

  /**
   * Cria uma nova sessão WhatsApp
   */
  async createSession(name: string): Promise<WhatsAppSession> {
    console.log('[BaileysService] Criando sessão:', { name, companyId: this.companyId });
    const supabase = await createClient();

    const token = uuidv4();
    console.log('[BaileysService] Token gerado:', token);

    // Cria a sessão no banco de dados
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
      console.error('[BaileysService] Erro ao criar sessão no banco:', error);
      throw new Error(`Erro no banco de dados: ${error.message} (${error.code})`);
    }

    console.log('[BaileysService] Sessão criada com sucesso:', session.id);
    return session as WhatsAppSession;
  }

  /**
   * Inicia uma sessão WhatsApp e retorna o QR code
   */
  async startSession(
    onQR?: (qr: string) => void,
    onConnection?: (status: string, phone?: string, pushName?: string) => void
  ): Promise<void> {
    const supabase = await createClient();

    // Atualiza status para aguardando QR
    await supabase
      .from('whatsapp_sessions')
      .update({ status: 'waiting_qr' })
      .eq('id', this.sessionId);

    // Configura o estado de autenticação
    const { state, saveCreds } = await useMultiFileAuthState(
      `./whatsapp-sessions/${this.sessionId}`
    );

    // Cria o socket do WhatsApp
    this.socket = makeWASocket({
      printQRInTerminal: false,
      auth: state,
      browser: ['Lidia 2.0', 'Chrome', '1.0'],
    });

    // Armazena a sessão ativa
    activeSessions.set(this.sessionId, this.socket);
    sessionCallbacks.set(this.sessionId, { onQR, onConnection });

    // Evento de atualização de conexão
    this.socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // QR code gerado
      if (qr && onQR) {
        onQR(qr);

        // Salva QR code no banco
        await supabase.from('whatsapp_qr_codes').insert({
          session_id: this.sessionId,
          qr_code_data: qr,
          expires_at: new Date(Date.now() + 60 * 1000).toISOString(), // 1 minuto
        });
      }

      // Conexão fechada
      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        if (shouldReconnect) {
          // Reconecta automaticamente
          await this.startSession(onQR, onConnection);
        } else {
          // Deslogado, atualiza status
          await supabase
            .from('whatsapp_sessions')
            .update({
              status: 'disconnected',
              updated_at: new Date().toISOString(),
            })
            .eq('id', this.sessionId);

          if (onConnection) {
            onConnection('disconnected');
          }
        }
      }

      // Conexão aberta
      if (connection === 'open') {
        const user = this.socket?.user;

        // Atualiza status e informações do usuário
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

        if (onConnection && user) {
          onConnection('active', user.id.split(':')[0], user.name);
        }
      }
    });

    // Evento de atualização de credenciais
    this.socket.ev.on('creds.update', saveCreds);

    // Evento de mensagens
    this.socket.ev.on('messages.upsert', async (m) => {
      if (m.type === 'notify') {
        for (const msg of m.messages) {
          await this.handleIncomingMessage(msg as BaileysMessage);
        }
      }
    });

    // Evento de contatos
    this.socket.ev.on('contacts.upsert', async (contacts) => {
      for (const contact of contacts) {
        await this.handleContactUpdate(contact as BaileysContact);
      }
    });

    this.socket.ev.on('contacts.update', async (contacts) => {
      for (const contact of contacts) {
        await this.handleContactUpdate(contact as BaileysContact);
      }
    });
  }

  /**
   * Processa mensagem recebida
   */
  private async handleIncomingMessage(msg: BaileysMessage): Promise<void> {
    const supabase = await createClient();

    // Extrai informações da mensagem
    const phone = msg.key.remoteJid.split('@')[0];
    const isGroup = msg.key.remoteJid.includes('@g.us');
    const isFromMe = msg.key.fromMe;

    // Extrai conteúdo da mensagem
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
      content = '[Áudio]';
      type = 'audio';
    } else if (msg.message?.documentMessage) {
      content = `[Documento: ${msg.message.documentMessage.fileName || 'arquivo'}]`;
      type = 'document';
    } else if (msg.message?.stickerMessage) {
      content = '[Sticker]';
      type = 'sticker';
    }

    // Salva mensagem no banco
    const { data: message } = await supabase
      .from('whatsapp_messages')
      .insert({
        session_id: this.sessionId,
        message_id: msg.key.id,
        contact_phone: phone,
        contact_name: msg.pushName,
        content,
        type,
        direction: isFromMe ? 'outgoing' : 'incoming',
        status: 'delivered',
        timestamp: new Date(msg.messageTimestamp * 1000).toISOString(),
      })
      .select()
      .single();

    // Atualiza ou cria contato
    const { data: existingContact } = await supabase
      .from('whatsapp_contacts')
      .select()
      .eq('session_id', this.sessionId)
      .eq('phone', phone)
      .single();

    if (existingContact) {
      await supabase
        .from('whatsapp_contacts')
        .update({
          name: msg.pushName || existingContact.name,
          last_message_at: new Date(msg.messageTimestamp * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingContact.id);
    } else {
      await supabase.from('whatsapp_contacts').insert({
        session_id: this.sessionId,
        phone,
        name: msg.pushName || phone,
        is_group: isGroup,
        last_message_at: new Date(msg.messageTimestamp * 1000).toISOString(),
      });
    }

    // Notifica callback
    const callbacks = sessionCallbacks.get(this.sessionId);
    if (callbacks?.onMessage && message) {
      callbacks.onMessage(message as WhatsAppMessage);
    }
  }

  /**
   * Processa atualização de contato
   */
  private async handleContactUpdate(contact: BaileysContact): Promise<void> {
    const supabase = await createClient();

    const phone = contact.id.split('@')[0];
    const isGroup = contact.id.includes('@g.us');

    // Verifica se contato existe
    const { data: existingContact } = await supabase
      .from('whatsapp_contacts')
      .select()
      .eq('session_id', this.sessionId)
      .eq('phone', phone)
      .single();

    if (existingContact) {
      await supabase
        .from('whatsapp_contacts')
        .update({
          name:
            contact.name ||
            contact.verifiedName ||
            contact.notify ||
            existingContact.name,
          status: contact.status,
          profile_picture: contact.imgUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingContact.id);
    } else {
      await supabase.from('whatsapp_contacts').insert({
        session_id: this.sessionId,
        phone,
        name: contact.name || contact.verifiedName || contact.notify || phone,
        status: contact.status,
        profile_picture: contact.imgUrl,
        is_group: isGroup,
      });
    }

    // Notifica callback
    const callbacks = sessionCallbacks.get(this.sessionId);
    if (callbacks?.onContact) {
      const { data: newContact } = await supabase
        .from('whatsapp_contacts')
        .select()
        .eq('session_id', this.sessionId)
        .eq('phone', phone)
        .single();

      if (newContact) {
        callbacks.onContact(newContact as WhatsAppContact);
      }
    }
  }

  /**
   * Envia uma mensagem de texto
   */
  async sendMessage(phone: string, message: string): Promise<WhatsAppMessage | null> {
    if (!this.socket) {
      throw new Error('Sessão não iniciada');
    }

    const supabase = await createClient();

    // Formata o número de telefone
    const formattedPhone = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;

    // Envia a mensagem
    const result = await this.socket.sendMessage(formattedPhone, { text: message });

    if (!result || !result.key) {
      throw new Error('Falha ao enviar mensagem');
    }

    // Salva no banco
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
      })
      .select()
      .single();

    return savedMessage as WhatsAppMessage | null;
  }

  /**
   * Desconecta a sessão
   */
  async disconnect(): Promise<void> {
    const supabase = await createClient();

    // Desconecta o socket
    if (this.socket) {
      await this.socket.logout();
      this.socket.end(undefined);
    }

    // Remove da memória
    activeSessions.delete(this.sessionId);
    sessionCallbacks.delete(this.sessionId);

    // Atualiza status no banco
    await supabase
      .from('whatsapp_sessions')
      .update({
        status: 'disconnected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', this.sessionId);
  }

  /**
   * Obtém a sessão ativa
   */
  static getSession(sessionId: string): WASocket | undefined {
    return activeSessions.get(sessionId);
  }

  /**
   * Verifica se uma sessão está ativa
   */
  static isSessionActive(sessionId: string): boolean {
    return activeSessions.has(sessionId);
  }

  /**
   * Lista todas as sessões de uma empresa
   */
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

  /**
   * Obtém uma sessão pelo ID
   */
  static async getSessionById(
    sessionId: string,
    companyId: string
  ): Promise<WhatsAppSession | null> {
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

  /**
   * Exclui uma sessão
   */
  static async deleteSession(sessionId: string, companyId: string): Promise<void> {
    const supabase = await createClient();

    // Desconecta se estiver ativa
    const socket = activeSessions.get(sessionId);
    if (socket) {
      await socket.logout();
      socket.end(undefined);
      activeSessions.delete(sessionId);
      sessionCallbacks.delete(sessionId);
    }

    // Exclui do banco
    await supabase
      .from('whatsapp_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('company_id', companyId);
  }
}

export default BaileysService;
