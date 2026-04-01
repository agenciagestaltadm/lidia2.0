-- Migration: WhatsApp Phase 3 Features
-- Date: 2026-04-01
-- Description: Adds webhooks, advanced search, conversation archiving, message scheduling, and backup system

-- ============================================================
-- 1. Webhooks Configuration Table
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    retry_policy JSONB DEFAULT '{"maxRetries": 3, "retryDelayMs": 5000}',
    headers JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_triggered_at TIMESTAMPTZ,
    UNIQUE(session_id, url)
);

-- Indexes for webhooks
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_session 
    ON whatsapp_webhooks(session_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_active 
    ON whatsapp_webhooks(session_id, is_active);

-- Enable RLS
ALTER TABLE whatsapp_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhooks
CREATE POLICY "Users can view webhooks for their sessions"
    ON whatsapp_webhooks FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_webhooks.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create webhooks in their sessions"
    ON whatsapp_webhooks FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_webhooks.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update webhooks in their sessions"
    ON whatsapp_webhooks FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_webhooks.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete webhooks in their sessions"
    ON whatsapp_webhooks FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_webhooks.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================
-- 2. Webhook Events History Table
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES whatsapp_webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'delivered', 'failed'
    http_status_code INTEGER,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for webhook events
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_events_webhook 
    ON whatsapp_webhook_events(webhook_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_events_status 
    ON whatsapp_webhook_events(webhook_id, status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_webhook_events_created 
    ON whatsapp_webhook_events(created_at DESC);

-- Enable RLS
ALTER TABLE whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook events
CREATE POLICY "Users can view webhook events for their webhooks"
    ON whatsapp_webhook_events FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_webhooks
            JOIN whatsapp_sessions ON whatsapp_webhooks.session_id = whatsapp_sessions.id
            WHERE whatsapp_webhooks.id = whatsapp_webhook_events.webhook_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================
-- 3. Message Search Index Table
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_message_search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
    search_text TEXT NOT NULL,
    message_type VARCHAR(50),
    contact_phone VARCHAR(20),
    is_from_me BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id)
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_whatsapp_search_text 
    ON whatsapp_message_search_index USING GIN(to_tsvector('portuguese', search_text));

CREATE INDEX IF NOT EXISTS idx_whatsapp_search_session 
    ON whatsapp_message_search_index(session_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_search_contact 
    ON whatsapp_message_search_index(session_id, contact_phone);

CREATE INDEX IF NOT EXISTS idx_whatsapp_search_type 
    ON whatsapp_message_search_index(session_id, message_type);

-- Enable RLS
ALTER TABLE whatsapp_message_search_index ENABLE ROW LEVEL SECURITY;

-- RLS Policies for search index
CREATE POLICY "Users can view search index for their sessions"
    ON whatsapp_message_search_index FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_message_search_index.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================
-- 4. Archived Conversations Table
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_archived_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    contact_phone VARCHAR(20) NOT NULL,
    contact_name VARCHAR(255),
    reason TEXT,
    archived_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, contact_phone)
);

-- Indexes for archived conversations
CREATE INDEX IF NOT EXISTS idx_whatsapp_archived_session 
    ON whatsapp_archived_conversations(session_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_archived_contact 
    ON whatsapp_archived_conversations(session_id, contact_phone);

CREATE INDEX IF NOT EXISTS idx_whatsapp_archived_date 
    ON whatsapp_archived_conversations(archived_at DESC);

-- Enable RLS
ALTER TABLE whatsapp_archived_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for archived conversations
CREATE POLICY "Users can view archived conversations for their sessions"
    ON whatsapp_archived_conversations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_archived_conversations.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can archive conversations in their sessions"
    ON whatsapp_archived_conversations FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_archived_conversations.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can unarchive conversations in their sessions"
    ON whatsapp_archived_conversations FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_archived_conversations.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================
-- 5. Scheduled Messages Table
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_scheduled_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    contact_phone VARCHAR(20) NOT NULL,
    contact_name VARCHAR(255),
    message TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(50), -- 'image', 'video', 'audio', 'document'
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for scheduled messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_session 
    ON whatsapp_scheduled_messages(session_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_status 
    ON whatsapp_scheduled_messages(session_id, status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_time 
    ON whatsapp_scheduled_messages(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_whatsapp_scheduled_pending 
    ON whatsapp_scheduled_messages(session_id, scheduled_at) 
    WHERE status = 'pending';

-- Enable RLS
ALTER TABLE whatsapp_scheduled_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled messages
CREATE POLICY "Users can view scheduled messages for their sessions"
    ON whatsapp_scheduled_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_scheduled_messages.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can schedule messages in their sessions"
    ON whatsapp_scheduled_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_scheduled_messages.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update scheduled messages in their sessions"
    ON whatsapp_scheduled_messages FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_scheduled_messages.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete scheduled messages in their sessions"
    ON whatsapp_scheduled_messages FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_scheduled_messages.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================
-- 6. Backups Table
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    backup_name VARCHAR(255) NOT NULL,
    backup_type VARCHAR(50) DEFAULT 'manual', -- 'manual', 'automatic'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    storage_path TEXT,
    storage_url TEXT,
    file_size BIGINT,
    checksum VARCHAR(64),
    include_messages BOOLEAN DEFAULT TRUE,
    include_media BOOLEAN DEFAULT TRUE,
    include_contacts BOOLEAN DEFAULT TRUE,
    date_from TIMESTAMPTZ,
    date_to TIMESTAMPTZ,
    message_count INTEGER,
    media_count INTEGER,
    contact_count INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for backups
CREATE INDEX IF NOT EXISTS idx_whatsapp_backups_session 
    ON whatsapp_backups(session_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_backups_status 
    ON whatsapp_backups(session_id, status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_backups_created 
    ON whatsapp_backups(created_at DESC);

-- Enable RLS
ALTER TABLE whatsapp_backups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for backups
CREATE POLICY "Users can view backups for their sessions"
    ON whatsapp_backups FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_backups.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create backups for their sessions"
    ON whatsapp_backups FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_backups.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update backups in their sessions"
    ON whatsapp_backups FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_backups.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete backups in their sessions"
    ON whatsapp_backups FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_backups.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================
-- 7. Trigger Functions for Phase 3 Features
-- ============================================================

-- Function to update search index when message is created
CREATE OR REPLACE FUNCTION update_message_search_index()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO whatsapp_message_search_index (
            session_id, message_id, search_text, message_type, contact_phone, is_from_me
        ) VALUES (
            NEW.session_id,
            NEW.id,
            COALESCE(NEW.message_text, '') || ' ' || COALESCE(NEW.caption, ''),
            NEW.message_type,
            NEW.contact_phone,
            NEW.is_from_me
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for search index
DROP TRIGGER IF EXISTS trigger_update_search_index ON whatsapp_messages;
CREATE TRIGGER trigger_update_search_index
    AFTER INSERT ON whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_search_index();

-- ============================================================
-- 8. Enable Realtime for Phase 3 Tables
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'whatsapp_webhooks'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_webhooks;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'whatsapp_webhook_events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_webhook_events;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'whatsapp_scheduled_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_scheduled_messages;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'whatsapp_backups'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_backups;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'whatsapp_archived_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_archived_conversations;
    END IF;
END $$;
