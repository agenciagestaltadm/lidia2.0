-- Migration: WhatsApp Phase 2 Features
-- Date: 2026-04-01
-- Description: Adds message reactions, forwarding, deletion, group management, and media handling

-- ============================================================
-- 1. Message Reactions Table
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
    contact_phone VARCHAR(20) NOT NULL,
    reaction_emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for reactions
CREATE INDEX IF NOT EXISTS idx_whatsapp_reactions_message 
    ON whatsapp_message_reactions(message_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_reactions_session 
    ON whatsapp_message_reactions(session_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_reactions_contact 
    ON whatsapp_message_reactions(session_id, contact_phone);

-- Unique constraint to prevent duplicate reactions from same contact
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_reactions_unique 
    ON whatsapp_message_reactions(message_id, contact_phone, reaction_emoji);

-- Enable RLS
ALTER TABLE whatsapp_message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reactions
CREATE POLICY "Users can view reactions for their sessions"
    ON whatsapp_message_reactions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_message_reactions.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can add reactions to messages in their sessions"
    ON whatsapp_message_reactions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_message_reactions.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete reactions from their sessions"
    ON whatsapp_message_reactions FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_message_reactions.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================
-- 2. Message Forwarding History Table
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_message_forwards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    original_message_id UUID NOT NULL REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
    forwarded_to_phone VARCHAR(20) NOT NULL,
    forwarded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for forwards
CREATE INDEX IF NOT EXISTS idx_whatsapp_forwards_original 
    ON whatsapp_message_forwards(original_message_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_forwards_session 
    ON whatsapp_message_forwards(session_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_forwards_timestamp 
    ON whatsapp_message_forwards(forwarded_at DESC);

-- Enable RLS
ALTER TABLE whatsapp_message_forwards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forwards
CREATE POLICY "Users can view forwards for their sessions"
    ON whatsapp_message_forwards FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_message_forwards.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create forwards in their sessions"
    ON whatsapp_message_forwards FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_message_forwards.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================
-- 3. Message Deletion History Table
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_message_deletions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
    deleted_by VARCHAR(20) NOT NULL,
    deletion_type VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user' or 'admin'
    reason TEXT,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for deletions
CREATE INDEX IF NOT EXISTS idx_whatsapp_deletions_message 
    ON whatsapp_message_deletions(message_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_deletions_session 
    ON whatsapp_message_deletions(session_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_deletions_timestamp 
    ON whatsapp_message_deletions(deleted_at DESC);

-- Enable RLS
ALTER TABLE whatsapp_message_deletions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deletions
CREATE POLICY "Users can view deletions for their sessions"
    ON whatsapp_message_deletions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_message_deletions.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can record deletions in their sessions"
    ON whatsapp_message_deletions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_message_deletions.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================
-- 4. WhatsApp Groups Table
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    group_jid VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    profile_picture_url TEXT,
    owner_phone VARCHAR(20),
    participants_count INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, group_jid)
);

-- Indexes for groups
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_session 
    ON whatsapp_groups(session_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_archived 
    ON whatsapp_groups(session_id, is_archived);

-- Enable RLS
ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
CREATE POLICY "Users can view groups for their sessions"
    ON whatsapp_groups FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_groups.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create groups in their sessions"
    ON whatsapp_groups FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_groups.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update groups in their sessions"
    ON whatsapp_groups FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_groups.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================
-- 5. Group Participants Table
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_group_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES whatsapp_groups(id) ON DELETE CASCADE,
    participant_phone VARCHAR(20) NOT NULL,
    participant_name VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, participant_phone)
);

-- Indexes for participants
CREATE INDEX IF NOT EXISTS idx_whatsapp_participants_group 
    ON whatsapp_group_participants(group_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_participants_admin 
    ON whatsapp_group_participants(group_id, is_admin);

-- Enable RLS
ALTER TABLE whatsapp_group_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for participants
CREATE POLICY "Users can view participants for their groups"
    ON whatsapp_group_participants FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_groups
            JOIN whatsapp_sessions ON whatsapp_groups.session_id = whatsapp_sessions.id
            WHERE whatsapp_groups.id = whatsapp_group_participants.group_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage participants in their groups"
    ON whatsapp_group_participants FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM whatsapp_groups
            JOIN whatsapp_sessions ON whatsapp_groups.session_id = whatsapp_sessions.id
            WHERE whatsapp_groups.id = whatsapp_group_participants.group_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================
-- 6. Media Storage Table
-- ============================================================

CREATE TABLE IF NOT EXISTS whatsapp_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    message_id UUID REFERENCES whatsapp_messages(id) ON DELETE SET NULL,
    media_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio', 'document', 'sticker'
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    storage_path TEXT NOT NULL,
    storage_url TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER, -- for audio/video
    width INTEGER, -- for images/videos
    height INTEGER, -- for images/videos
    metadata JSONB DEFAULT '{}',
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for media
CREATE INDEX IF NOT EXISTS idx_whatsapp_media_session 
    ON whatsapp_media(session_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_media_message 
    ON whatsapp_media(message_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_media_type 
    ON whatsapp_media(session_id, media_type);

CREATE INDEX IF NOT EXISTS idx_whatsapp_media_uploaded 
    ON whatsapp_media(uploaded_at DESC);

-- Enable RLS
ALTER TABLE whatsapp_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media
CREATE POLICY "Users can view media for their sessions"
    ON whatsapp_media FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_media.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can upload media to their sessions"
    ON whatsapp_media FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            WHERE whatsapp_sessions.id = whatsapp_media.session_id
            AND whatsapp_sessions.company_id = (
                SELECT company_id FROM profiles WHERE user_id = auth.uid()
            )
        )
    );

-- ============================================================
-- 7. Add columns to whatsapp_messages for Phase 2 features
-- ============================================================

-- Add reaction_count column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_messages' 
        AND column_name = 'reaction_count'
    ) THEN
        ALTER TABLE whatsapp_messages 
        ADD COLUMN reaction_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add is_deleted column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_messages' 
        AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE whatsapp_messages 
        ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add is_forwarded column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_messages' 
        AND column_name = 'is_forwarded'
    ) THEN
        ALTER TABLE whatsapp_messages 
        ADD COLUMN is_forwarded BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add forward_count column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'whatsapp_messages' 
        AND column_name = 'forward_count'
    ) THEN
        ALTER TABLE whatsapp_messages 
        ADD COLUMN forward_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- ============================================================
-- 8. Trigger Functions for Phase 2 Features
-- ============================================================

-- Function to update reaction count
CREATE OR REPLACE FUNCTION update_message_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE whatsapp_messages
        SET reaction_count = reaction_count + 1
        WHERE id = NEW.message_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE whatsapp_messages
        SET reaction_count = GREATEST(reaction_count - 1, 0)
        WHERE id = OLD.message_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reaction count
DROP TRIGGER IF EXISTS trigger_update_reaction_count ON whatsapp_message_reactions;
CREATE TRIGGER trigger_update_reaction_count
    AFTER INSERT OR DELETE ON whatsapp_message_reactions
    FOR EACH ROW
    EXECUTE FUNCTION update_message_reaction_count();

-- Function to update forward count
CREATE OR REPLACE FUNCTION update_message_forward_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE whatsapp_messages
        SET forward_count = forward_count + 1,
            is_forwarded = TRUE
        WHERE id = NEW.original_message_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for forward count
DROP TRIGGER IF EXISTS trigger_update_forward_count ON whatsapp_message_forwards;
CREATE TRIGGER trigger_update_forward_count
    AFTER INSERT ON whatsapp_message_forwards
    FOR EACH ROW
    EXECUTE FUNCTION update_message_forward_count();

-- ============================================================
-- 9. Enable Realtime for Phase 2 Tables
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'whatsapp_message_reactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_message_reactions;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'whatsapp_groups'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_groups;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'whatsapp_group_participants'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_group_participants;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'whatsapp_media'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_media;
    END IF;
END $$;
