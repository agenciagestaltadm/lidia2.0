-- Migration: Add WhatsApp Performance Indexes
-- Date: 2026-04-01
-- Description: Adds indexes and optimizations for WhatsApp message and contact queries

-- ============================================================
-- 1. Composite Indexes for Message Queries
-- ============================================================

-- Index para queries de mensagens por sessão e contato com timestamp
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_session_contact_timestamp 
ON whatsapp_messages(session_id, contact_phone, timestamp DESC);

-- Index para queries de mensagens por sessão com timestamp
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_session_timestamp 
ON whatsapp_messages(session_id, timestamp DESC);

-- Index para queries de mensagens por tipo
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_type 
ON whatsapp_messages(type);

-- Index para queries de mensagens por status
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status 
ON whatsapp_messages(status);

-- ============================================================
-- 2. Composite Indexes for Contact Queries
-- ============================================================

-- Index para queries de contatos por sessão com última mensagem
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_session_lastmsg 
ON whatsapp_contacts(session_id, last_message_at DESC);

-- Index para queries de contatos por sessão e nome
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_session_name 
ON whatsapp_contacts(session_id, name);

-- Index para queries de contatos por sessão e telefone
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_session_phone 
ON whatsapp_contacts(session_id, phone);

-- ============================================================
-- 3. Partial Indexes for Common Filters
-- ============================================================

-- Index para mensagens não lidas
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_unread 
ON whatsapp_messages(session_id, contact_phone) 
WHERE status != 'read';

-- Index para contatos com grupos
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_groups 
ON whatsapp_contacts(session_id) 
WHERE is_group = true;

-- ============================================================
-- 4. Add Columns for Better Performance
-- ============================================================

-- Adiciona coluna para cache de contagem de mensagens não lidas
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Adiciona coluna para cache de última mensagem
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS last_message_preview TEXT;

-- Adiciona coluna para indicar se contato está ativo
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================
-- 5. Create Materialized View for Performance
-- ============================================================

-- View para estatísticas de conversas
CREATE OR REPLACE VIEW whatsapp_conversation_stats AS
SELECT 
  wc.id as contact_id,
  wc.session_id,
  wc.phone,
  wc.name,
  COUNT(wm.id) as total_messages,
  COUNT(CASE WHEN wm.direction = 'incoming' THEN 1 END) as incoming_messages,
  COUNT(CASE WHEN wm.direction = 'outgoing' THEN 1 END) as outgoing_messages,
  COUNT(CASE WHEN wm.status != 'read' THEN 1 END) as unread_messages,
  MAX(wm.timestamp) as last_message_at,
  wc.created_at
FROM whatsapp_contacts wc
LEFT JOIN whatsapp_messages wm ON wc.id = wm.contact_phone AND wc.session_id = wm.session_id
GROUP BY wc.id, wc.session_id, wc.phone, wc.name, wc.created_at;

-- ============================================================
-- 6. Create Function for Updating Contact Stats
-- ============================================================

CREATE OR REPLACE FUNCTION update_contact_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE whatsapp_contacts
  SET 
    unread_count = (
      SELECT COUNT(*) FROM whatsapp_messages 
      WHERE contact_phone = NEW.contact_phone 
      AND session_id = NEW.session_id 
      AND status != 'read'
    ),
    last_message_preview = NEW.content,
    last_message_at = NEW.timestamp
  WHERE phone = NEW.contact_phone AND session_id = NEW.session_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar stats quando nova mensagem é inserida
CREATE TRIGGER update_contact_stats_on_message_insert
AFTER INSERT ON whatsapp_messages
FOR EACH ROW
EXECUTE FUNCTION update_contact_stats();

-- ============================================================
-- 7. Add JSONB Indexes for Metadata
-- ============================================================

-- Index para queries em metadata
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_metadata 
ON whatsapp_messages USING GIN (metadata);

-- ============================================================
-- 8. Analyze Tables for Query Optimization
-- ============================================================

ANALYZE whatsapp_messages;
ANALYZE whatsapp_contacts;
ANALYZE whatsapp_sessions;
