-- Migração para otimização de performance do WhatsApp
-- Adiciona índices e colunas para melhorar queries

-- Adicionar colunas para cache e metadados de mídia
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS media_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);

-- Índices para performance de mensagens
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_session_contact 
ON whatsapp_messages(session_id, contact_phone, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp 
ON whatsapp_messages(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction 
ON whatsapp_messages(direction);

-- Índices para performance de contatos
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_session_lastmsg 
ON whatsapp_contacts(session_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone 
ON whatsapp_contacts(phone);

-- Índices para sessões
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_company_status 
ON whatsapp_sessions(company_id, status);

-- Função para atualizar last_message_at automaticamente
CREATE OR REPLACE FUNCTION update_contact_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_contacts
  SET last_message_at = NEW.timestamp,
      updated_at = NOW()
  WHERE session_id = NEW.session_id
    AND phone = NEW.contact_phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar last_message_at quando uma mensagem é inserida
DROP TRIGGER IF EXISTS trigger_update_contact_last_message ON whatsapp_messages;
CREATE TRIGGER trigger_update_contact_last_message
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_last_message();

-- Função para limpar mensagens antigas (manter apenas últimas 1000 por conversa)
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM whatsapp_messages
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY session_id, contact_phone 
               ORDER BY timestamp DESC
             ) as rn
      FROM whatsapp_messages
    ) ranked
    WHERE rn > 1000
  );
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON COLUMN whatsapp_messages.media_type IS 'Tipo de mídia: image, video, audio, document, sticker';
COMMENT ON COLUMN whatsapp_messages.file_name IS 'Nome original do arquivo';
COMMENT ON COLUMN whatsapp_messages.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN whatsapp_messages.mime_type IS 'MIME type do arquivo';
