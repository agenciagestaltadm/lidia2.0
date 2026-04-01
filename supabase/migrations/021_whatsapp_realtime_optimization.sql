-- Migration: Otimização para Sistema WhatsApp Event-Driven
-- Cria índices e triggers para melhor performance do Realtime

-- ============================================================
-- Índices para otimizar queries de mensagens
-- ============================================================

-- Índice composto para queries de mensagens por sessão e contato
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_session_contact 
ON whatsapp_messages(session_id, contact_phone);

-- Índice para ordenação por timestamp (mais recentes primeiro)
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_session_timestamp 
ON whatsapp_messages(session_id, contact_phone, timestamp DESC);

-- Índice para busca por message_id (para deduplicação)
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_id 
ON whatsapp_messages(session_id, message_id);

-- Índice para filtro por data de criação
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at 
ON whatsapp_messages(session_id, created_at DESC);

-- Índice para status de leitura
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status 
ON whatsapp_messages(session_id, status);

-- ============================================================
-- Índices para contatos
-- ============================================================

-- Índice para busca de contatos por telefone
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone 
ON whatsapp_contacts(session_id, phone);

-- Índice para ordenação por última mensagem
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_last_message 
ON whatsapp_contacts(session_id, last_message_at DESC);

-- Índice para filtro de grupos
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_is_group 
ON whatsapp_contacts(session_id, is_group);

-- ============================================================
-- Colunas adicionais para controle de mensagens
-- ============================================================

-- Adiciona coluna is_from_me se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_messages' 
        AND column_name = 'is_from_me'
    ) THEN
        ALTER TABLE whatsapp_messages ADD COLUMN is_from_me BOOLEAN DEFAULT false;
        CREATE INDEX idx_whatsapp_messages_is_from_me ON whatsapp_messages(session_id, is_from_me);
    END IF;
END $$;

-- ============================================================
-- Trigger para atualizar updated_at automaticamente
-- ============================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para whatsapp_messages
DROP TRIGGER IF EXISTS update_whatsapp_messages_updated_at ON whatsapp_messages;
CREATE TRIGGER update_whatsapp_messages_updated_at
    BEFORE UPDATE ON whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para whatsapp_contacts
DROP TRIGGER IF EXISTS update_whatsapp_contacts_updated_at ON whatsapp_contacts;
CREATE TRIGGER update_whatsapp_contacts_updated_at
    BEFORE UPDATE ON whatsapp_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Função para broadcast via Realtime
-- ============================================================

-- Função para notificar sobre novas mensagens
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'whatsapp_messages_channel',
        json_build_object(
            'event', 'INSERT',
            'table', TG_TABLE_NAME,
            'record', row_to_json(NEW)
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para notificar novas mensagens
DROP TRIGGER IF EXISTS trigger_notify_new_message ON whatsapp_messages;
CREATE TRIGGER trigger_notify_new_message
    AFTER INSERT ON whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_message();

-- ============================================================
-- Comentários
-- ============================================================

COMMENT ON TABLE whatsapp_messages IS 'Mensagens do WhatsApp - otimizado para Realtime';
COMMENT ON TABLE whatsapp_contacts IS 'Contatos do WhatsApp - otimizado para queries frequentes';
