-- Migration: Add WABA Messages and Conversations Tables
-- Date: 2026-04-09
-- Description: Creates tables for WABA conversations, messages, and contacts with realtime support

-- ============================================================
-- 1. WABA Contacts Table
-- ============================================================
CREATE TABLE IF NOT EXISTS waba_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    phone VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    profile_picture TEXT,
    whatsapp_id VARCHAR(255),
    source VARCHAR(50) DEFAULT 'whatsapp_official',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, phone)
);

-- Indexes for waba_contacts
CREATE INDEX IF NOT EXISTS idx_waba_contacts_company_id ON waba_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_waba_contacts_phone ON waba_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_waba_contacts_whatsapp_id ON waba_contacts(whatsapp_id);

-- Trigger for updated_at
CREATE TRIGGER update_waba_contacts_updated_at
    BEFORE UPDATE ON waba_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_waba_configs_updated_at();

-- ============================================================
-- 2. WABA Conversations Table
-- ============================================================
CREATE TABLE IF NOT EXISTS waba_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    waba_connection_id UUID REFERENCES waba_connections(id) ON DELETE SET NULL,
    contact_id UUID NOT NULL REFERENCES waba_contacts(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'resolved')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    unread_count INTEGER DEFAULT 0,
    last_message_id UUID,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for waba_conversations
CREATE INDEX IF NOT EXISTS idx_waba_conversations_company_id ON waba_conversations(company_id);
CREATE INDEX IF NOT EXISTS idx_waba_conversations_status ON waba_conversations(status);
CREATE INDEX IF NOT EXISTS idx_waba_conversations_contact_id ON waba_conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_waba_conversations_connection_id ON waba_conversations(waba_connection_id);
CREATE INDEX IF NOT EXISTS idx_waba_conversations_assigned_to ON waba_conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_waba_conversations_updated_at ON waba_conversations(updated_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_waba_conversations_updated_at
    BEFORE UPDATE ON waba_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_waba_configs_updated_at();

-- ============================================================
-- 3. WABA Messages Table
-- ============================================================
CREATE TABLE IF NOT EXISTS waba_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES waba_conversations(id) ON DELETE CASCADE,
    waba_connection_id UUID REFERENCES waba_connections(id) ON DELETE SET NULL,
    direction VARCHAR(50) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type VARCHAR(50) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'template')),
    content TEXT,
    media_url TEXT,
    media_caption TEXT,
    external_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for waba_messages
CREATE INDEX IF NOT EXISTS idx_waba_messages_conversation_id ON waba_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_waba_messages_external_id ON waba_messages(external_id);
CREATE INDEX IF NOT EXISTS idx_waba_messages_status ON waba_messages(status);
CREATE INDEX IF NOT EXISTS idx_waba_messages_created_at ON waba_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waba_messages_direction ON waba_messages(direction);

-- ============================================================
-- 4. Enable RLS on all tables
-- ============================================================
ALTER TABLE waba_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE waba_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waba_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. RLS Policies for waba_contacts
-- ============================================================

CREATE POLICY "Users can view company waba contacts"
    ON waba_contacts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR profiles.company_id = waba_contacts.company_id
            )
        )
    );

CREATE POLICY "Users can insert company waba contacts"
    ON waba_contacts FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR profiles.company_id = waba_contacts.company_id
            )
        )
    );

CREATE POLICY "Users can update company waba contacts"
    ON waba_contacts FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR profiles.company_id = waba_contacts.company_id
            )
        )
    );

-- ============================================================
-- 6. RLS Policies for waba_conversations
-- ============================================================

CREATE POLICY "Users can view company waba conversations"
    ON waba_conversations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR profiles.company_id = waba_conversations.company_id
            )
        )
    );

CREATE POLICY "Users can insert company waba conversations"
    ON waba_conversations FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR profiles.company_id = waba_conversations.company_id
            )
        )
    );

CREATE POLICY "Users can update company waba conversations"
    ON waba_conversations FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR profiles.company_id = waba_conversations.company_id
            )
        )
    );

-- ============================================================
-- 7. RLS Policies for waba_messages
-- ============================================================

CREATE POLICY "Users can view company waba messages"
    ON waba_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM waba_conversations
            JOIN profiles ON profiles.company_id = waba_conversations.company_id
            WHERE waba_messages.conversation_id = waba_conversations.id
            AND profiles.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'SUPER_USER'
        )
    );

CREATE POLICY "Users can insert company waba messages"
    ON waba_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM waba_conversations
            JOIN profiles ON profiles.company_id = waba_conversations.company_id
            WHERE waba_messages.conversation_id = waba_conversations.id
            AND profiles.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'SUPER_USER'
        )
    );

CREATE POLICY "Users can update company waba messages"
    ON waba_messages FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM waba_conversations
            JOIN profiles ON profiles.company_id = waba_conversations.company_id
            WHERE waba_messages.conversation_id = waba_conversations.id
            AND profiles.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'SUPER_USER'
        )
    );

-- ============================================================
-- 8. Function to update conversation last_message and unread_count
-- ============================================================
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Update last_message_id and increment unread_count for inbound messages
    UPDATE waba_conversations
    SET 
        last_message_id = NEW.id,
        unread_count = CASE 
            WHEN NEW.direction = 'inbound' THEN unread_count + 1
            ELSE unread_count
        END,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_new_message
    AFTER INSERT ON waba_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_new_message();

-- ============================================================
-- 9. Enable Realtime
-- ============================================================

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE waba_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE waba_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE waba_contacts;

-- ============================================================
-- 10. Comments for documentation
-- ============================================================
COMMENT ON TABLE waba_contacts IS 'Stores WhatsApp contacts for WABA integration';
COMMENT ON TABLE waba_conversations IS 'Stores conversations for WABA integration';
COMMENT ON TABLE waba_messages IS 'Stores messages for WABA integration';
