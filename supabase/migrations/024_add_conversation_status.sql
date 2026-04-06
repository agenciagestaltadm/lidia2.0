-- Migration: Add conversation status tracking to WhatsApp contacts
-- Date: 2026-04-04
-- Description: Creates columns for managing conversation workflow (open, pending, resolved)

-- ============================================================
-- 1. Add conversation status columns to whatsapp_contacts
-- ============================================================

-- Add column for conversation status
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS conversation_status VARCHAR(20) DEFAULT 'pending' 
  CHECK (conversation_status IN ('open', 'pending', 'resolved'));

-- Add column to track when conversation was opened
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;

-- Add column to track when conversation was resolved
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Add column for unread message count
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Add column to indicate new messages since last view
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS has_new_messages BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 2. Create indexes for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_conversation_status 
ON whatsapp_contacts(conversation_status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_session_status 
ON whatsapp_contacts(session_id, conversation_status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_unread 
ON whatsapp_contacts(session_id, unread_count) 
WHERE unread_count > 0;

-- ============================================================
-- 3. Update existing contacts
-- ============================================================

-- Set all existing contacts to 'pending' if they don't have a status
UPDATE whatsapp_contacts 
SET conversation_status = 'pending' 
WHERE conversation_status IS NULL;

-- ============================================================
-- 4. Enable realtime for the table (se ainda não estiver habilitada)
-- ============================================================

DO $$
BEGIN
  -- Verifica se a tabela já está na publicação antes de adicionar
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'whatsapp_contacts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_contacts;
  END IF;
END
$$;

-- ============================================================
-- 5. Create function to update contact on new message
-- ============================================================

CREATE OR REPLACE FUNCTION update_contact_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process incoming messages
  IF NEW.direction = 'incoming' THEN
    -- Update contact: increment unread count and set has_new_messages
    UPDATE whatsapp_contacts
    SET 
      unread_count = unread_count + 1,
      has_new_messages = TRUE,
      -- If conversation was resolved, move it back to pending
      conversation_status = CASE 
        WHEN conversation_status = 'resolved' THEN 'pending'
        ELSE conversation_status
      END,
      updated_at = NOW()
    WHERE session_id = NEW.session_id
      AND phone = NEW.contact_phone;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update contact on new message
DROP TRIGGER IF EXISTS trigger_update_contact_on_message ON whatsapp_messages;
CREATE TRIGGER trigger_update_contact_on_message
  AFTER INSERT ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_on_new_message();

-- ============================================================
-- 6. Create function to reset unread count when conversation is opened
-- ============================================================

CREATE OR REPLACE FUNCTION reset_unread_on_open()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.conversation_status = 'open' AND OLD.conversation_status != 'open' THEN
    NEW.unread_count = 0;
    NEW.has_new_messages = FALSE;
    NEW.opened_at = NOW();
  END IF;
  
  IF NEW.conversation_status = 'resolved' AND OLD.conversation_status != 'resolved' THEN
    NEW.resolved_at = NOW();
    NEW.unread_count = 0;
    NEW.has_new_messages = FALSE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status changes
DROP TRIGGER IF EXISTS trigger_reset_unread_on_open ON whatsapp_contacts;
CREATE TRIGGER trigger_reset_unread_on_open
  BEFORE UPDATE ON whatsapp_contacts
  FOR EACH ROW
  EXECUTE FUNCTION reset_unread_on_open();
