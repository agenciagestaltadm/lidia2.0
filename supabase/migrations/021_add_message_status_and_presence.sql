-- Adicionar coluna de status detalhado para mensagens
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS status_details JSONB DEFAULT '{"sent_at": null, "delivered_at": null, "read_at": null}';

-- Adicionar coluna de reações
ALTER TABLE whatsapp_messages 
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';

-- Adicionar coluna de presença para contatos
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS presence_status VARCHAR DEFAULT 'unavailable' CHECK (presence_status IN ('available', 'unavailable', 'composing', 'recording'));

-- Adicionar coluna de última atividade
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP;

-- Adicionar coluna de digitação
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS is_typing BOOLEAN DEFAULT FALSE;

-- Criar tabela de reações
CREATE TABLE IF NOT EXISTS whatsapp_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
  contact_phone VARCHAR NOT NULL,
  emoji VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, contact_phone, emoji)
);

-- Criar tabela de presença
CREATE TABLE IF NOT EXISTS whatsapp_presence_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
  contact_phone VARCHAR NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('available', 'unavailable', 'composing', 'recording')),
  timestamp TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (session_id, contact_phone) REFERENCES whatsapp_contacts(session_id, phone)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON whatsapp_message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_contact ON whatsapp_message_reactions(contact_phone);
CREATE INDEX IF NOT EXISTS idx_presence_log_session ON whatsapp_presence_log(session_id);
CREATE INDEX IF NOT EXISTS idx_presence_log_contact ON whatsapp_presence_log(contact_phone);
CREATE INDEX IF NOT EXISTS idx_contacts_presence ON whatsapp_contacts(presence_status);
CREATE INDEX IF NOT EXISTS idx_contacts_typing ON whatsapp_contacts(is_typing);

-- Criar função para atualizar last_seen_at
CREATE OR REPLACE FUNCTION update_contact_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_contacts 
  SET last_seen_at = NOW()
  WHERE phone = NEW.contact_phone AND session_id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar last_seen_at
DROP TRIGGER IF EXISTS trigger_update_contact_last_seen ON whatsapp_messages;
CREATE TRIGGER trigger_update_contact_last_seen
AFTER INSERT ON whatsapp_messages
FOR EACH ROW
EXECUTE FUNCTION update_contact_last_seen();

-- Criar função para limpar presença expirada
CREATE OR REPLACE FUNCTION cleanup_expired_presence()
RETURNS void AS $$
BEGIN
  UPDATE whatsapp_contacts 
  SET is_typing = FALSE, presence_status = 'unavailable'
  WHERE is_typing = TRUE AND updated_at < NOW() - INTERVAL '5 seconds';
END;
$$ LANGUAGE plpgsql;
