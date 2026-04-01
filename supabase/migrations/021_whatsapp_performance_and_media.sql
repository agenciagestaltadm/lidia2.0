-- Migration: WhatsApp Performance Improvements and Media Support
-- Date: 2026-04-01
-- Description: Adds performance indexes and media support for WhatsApp tables

-- ============================================================
-- 1. Additional Performance Indexes for whatsapp_messages
-- ============================================================

-- Composite index for conversation queries (session + contact + timestamp)
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation 
    ON whatsapp_messages(session_id, contact_phone, timestamp DESC);

-- Index for unread messages queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_unread 
    ON whatsapp_messages(session_id, contact_phone, direction, status) 
    WHERE direction = 'incoming' AND status != 'read';

-- Index for media messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_media 
    ON whatsapp_messages(session_id, type) 
    WHERE type IN ('image', 'video', 'audio', 'document');

-- Index for failed messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_failed 
    ON whatsapp_messages(session_id, status) 
    WHERE status = 'failed';

-- ============================================================
-- 2. Additional Performance Indexes for whatsapp_contacts
-- ============================================================

-- Index for active conversations (contacts with recent messages)
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_active 
    ON whatsapp_contacts(session_id, last_message_at DESC NULLS LAST);

-- Index for group chats
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_groups 
    ON whatsapp_contacts(session_id, is_group) 
    WHERE is_group = TRUE;

-- ============================================================
-- 3. Media Storage Support
-- ============================================================

-- Add media_metadata column for storing additional media information
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_messages' 
        AND column_name = 'media_metadata'
    ) THEN
        ALTER TABLE whatsapp_messages 
        ADD COLUMN media_metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- Add thumbnail_url for media previews
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_messages' 
        AND column_name = 'thumbnail_url'
    ) THEN
        ALTER TABLE whatsapp_messages 
        ADD COLUMN thumbnail_url TEXT;
    END IF;
END $$;

-- Add file_size for media storage tracking
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_messages' 
        AND column_name = 'file_size'
    ) THEN
        ALTER TABLE whatsapp_messages 
        ADD COLUMN file_size BIGINT;
    END IF;
END $$;

-- Add mime_type for media type detection
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_messages' 
        AND column_name = 'mime_type'
    ) THEN
        ALTER TABLE whatsapp_messages 
        ADD COLUMN mime_type VARCHAR(100);
    END IF;
END $$;

-- ============================================================
-- 4. Message Search Support
-- ============================================================

-- Add search vector for full-text search on messages
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_messages' 
        AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE whatsapp_messages 
        ADD COLUMN search_vector tsvector;
    END IF;
END $$;

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_search 
    ON whatsapp_messages USING GIN(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_whatsapp_messages_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('portuguese', COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector
DROP TRIGGER IF EXISTS trigger_update_whatsapp_messages_search_vector ON whatsapp_messages;
CREATE TRIGGER trigger_update_whatsapp_messages_search_vector
    BEFORE INSERT OR UPDATE OF content ON whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_messages_search_vector();

-- ============================================================
-- 5. Conversation Summary Support
-- ============================================================

-- Add unread_count tracking to contacts
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_contacts' 
        AND column_name = 'unread_count'
    ) THEN
        ALTER TABLE whatsapp_contacts 
        ADD COLUMN unread_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add last_message_preview for conversation list
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_contacts' 
        AND column_name = 'last_message_preview'
    ) THEN
        ALTER TABLE whatsapp_contacts 
        ADD COLUMN last_message_preview TEXT;
    END IF;
END $$;

-- Function to update contact summary on new message
CREATE OR REPLACE FUNCTION update_whatsapp_contact_summary()
RETURNS TRIGGER AS $$
BEGIN
    -- Update contact's last_message_at and preview
    UPDATE whatsapp_contacts
    SET 
        last_message_at = NEW.timestamp,
        last_message_preview = LEFT(NEW.content, 100),
        unread_count = CASE 
            WHEN NEW.direction = 'incoming' THEN unread_count + 1
            ELSE unread_count
        END,
        updated_at = NOW()
    WHERE session_id = NEW.session_id 
    AND phone = NEW.contact_phone;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update contact summary on new message
DROP TRIGGER IF EXISTS trigger_update_whatsapp_contact_summary ON whatsapp_messages;
CREATE TRIGGER trigger_update_whatsapp_contact_summary
    AFTER INSERT ON whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_contact_summary();

-- ============================================================
-- 6. Realtime Subscriptions (with safety checks)
-- ============================================================

-- Enable realtime for messages (only if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'whatsapp_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;
    END IF;
END $$;

-- Enable realtime for sessions (only if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'whatsapp_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_sessions;
    END IF;
END $$;

-- Enable realtime for contacts (only if not already enabled)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'whatsapp_contacts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_contacts;
    END IF;
END $$;

-- ============================================================
-- 7. Cleanup and Maintenance Functions
-- ============================================================

-- Function to clean up old messages (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM whatsapp_messages
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND status IN ('sent', 'delivered', 'read');
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation statistics
CREATE OR REPLACE FUNCTION get_whatsapp_conversation_stats(p_session_id UUID, p_contact_phone VARCHAR)
RETURNS TABLE (
    total_messages BIGINT,
    incoming_messages BIGINT,
    outgoing_messages BIGINT,
    media_messages BIGINT,
    last_message_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE direction = 'incoming') as incoming_messages,
        COUNT(*) FILTER (WHERE direction = 'outgoing') as outgoing_messages,
        COUNT(*) FILTER (WHERE type != 'text') as media_messages,
        MAX(timestamp) as last_message_at
    FROM whatsapp_messages
    WHERE session_id = p_session_id
    AND contact_phone = p_contact_phone;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. Performance Monitoring
-- ============================================================

-- Create table for query performance logs (optional)
CREATE TABLE IF NOT EXISTS whatsapp_query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_type VARCHAR(100) NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    rows_affected INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance analysis
CREATE INDEX IF NOT EXISTS idx_whatsapp_query_logs_created_at 
    ON whatsapp_query_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_query_logs_query_type 
    ON whatsapp_query_logs(query_type);

-- Enable RLS on query logs
ALTER TABLE whatsapp_query_logs ENABLE ROW LEVEL SECURITY;

-- Only super users can view query logs
CREATE POLICY "Super users can view query logs"
    ON whatsapp_query_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'SUPER_USER'
        )
    );
