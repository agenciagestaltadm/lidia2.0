-- Migration: Add WhatsApp QR Code tables
-- Date: 2026-03-31
-- Description: Creates tables for WhatsApp QR Code integration using Baileys

-- ============================================================
-- 1. WhatsApp Sessions Table
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    status VARCHAR(50) DEFAULT 'creating' CHECK (status IN ('creating', 'waiting_qr', 'connecting', 'connected', 'active', 'disconnected', 'error')),
    phone_number VARCHAR(50),
    push_name VARCHAR(255),
    profile_picture TEXT,
    credentials JSONB,
    last_connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for whatsapp_sessions
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_company_id ON whatsapp_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_token ON whatsapp_sessions(token);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_sessions_updated_at
    BEFORE UPDATE ON whatsapp_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_sessions_updated_at();

-- ============================================================
-- 2. WhatsApp QR Codes Table
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    qr_code_data TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for whatsapp_qr_codes
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_codes_session_id ON whatsapp_qr_codes(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_qr_codes_expires_at ON whatsapp_qr_codes(expires_at);

-- ============================================================
-- 3. WhatsApp Contacts Table
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    phone VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    profile_picture TEXT,
    status VARCHAR(255),
    last_message_at TIMESTAMPTZ,
    is_group BOOLEAN DEFAULT FALSE,
    group_participants TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, phone)
);

-- Indexes for whatsapp_contacts
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_session_id ON whatsapp_contacts(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_phone ON whatsapp_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_last_message_at ON whatsapp_contacts(last_message_at);

-- Trigger for updated_at
CREATE TRIGGER update_whatsapp_contacts_updated_at
    BEFORE UPDATE ON whatsapp_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_sessions_updated_at();

-- ============================================================
-- 4. WhatsApp Messages Table
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES whatsapp_sessions(id) ON DELETE CASCADE,
    message_id VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    contact_name VARCHAR(255),
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'vcard')),
    direction VARCHAR(50) NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    media_url TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for whatsapp_messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_session_id ON whatsapp_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact_phone ON whatsapp_messages(contact_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_id ON whatsapp_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);

-- ============================================================
-- 5. Enable RLS on all tables
-- ============================================================
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 6. RLS Policies for whatsapp_sessions
-- ============================================================

-- Users can view sessions from their company
CREATE POLICY "Users can view company whatsapp sessions"
    ON whatsapp_sessions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR profiles.company_id = whatsapp_sessions.company_id
            )
        )
    );

-- Admins can insert sessions for their company
CREATE POLICY "Admins can insert company whatsapp sessions"
    ON whatsapp_sessions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR (profiles.company_id = whatsapp_sessions.company_id AND profiles.role IN ('CLIENT_ADMIN', 'CLIENT_MANAGER'))
            )
        )
    );

-- Admins can update sessions from their company
CREATE POLICY "Admins can update company whatsapp sessions"
    ON whatsapp_sessions FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR (profiles.company_id = whatsapp_sessions.company_id AND profiles.role IN ('CLIENT_ADMIN', 'CLIENT_MANAGER'))
            )
        )
    );

-- Admins can delete sessions from their company
CREATE POLICY "Admins can delete company whatsapp sessions"
    ON whatsapp_sessions FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR (profiles.company_id = whatsapp_sessions.company_id AND profiles.role IN ('CLIENT_ADMIN', 'CLIENT_MANAGER'))
            )
        )
    );

-- ============================================================
-- 7. RLS Policies for whatsapp_qr_codes
-- ============================================================

CREATE POLICY "Users can view company whatsapp qr codes"
    ON whatsapp_qr_codes FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            JOIN profiles ON profiles.company_id = whatsapp_sessions.company_id
            WHERE whatsapp_qr_codes.session_id = whatsapp_sessions.id
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can insert whatsapp qr codes"
    ON whatsapp_qr_codes FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            JOIN profiles ON profiles.company_id = whatsapp_sessions.company_id
            WHERE whatsapp_qr_codes.session_id = whatsapp_sessions.id
            AND profiles.user_id = auth.uid()
            AND profiles.role IN ('SUPER_USER', 'CLIENT_ADMIN', 'CLIENT_MANAGER')
        )
    );

-- ============================================================
-- 8. RLS Policies for whatsapp_contacts
-- ============================================================

CREATE POLICY "Users can view company whatsapp contacts"
    ON whatsapp_contacts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            JOIN profiles ON profiles.company_id = whatsapp_sessions.company_id
            WHERE whatsapp_contacts.session_id = whatsapp_sessions.id
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage whatsapp contacts"
    ON whatsapp_contacts FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            JOIN profiles ON profiles.company_id = whatsapp_sessions.company_id
            WHERE whatsapp_contacts.session_id = whatsapp_sessions.id
            AND profiles.user_id = auth.uid()
            AND profiles.role IN ('SUPER_USER', 'CLIENT_ADMIN', 'CLIENT_MANAGER')
        )
    );

-- ============================================================
-- 9. RLS Policies for whatsapp_messages
-- ============================================================

CREATE POLICY "Users can view company whatsapp messages"
    ON whatsapp_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            JOIN profiles ON profiles.company_id = whatsapp_sessions.company_id
            WHERE whatsapp_messages.session_id = whatsapp_sessions.id
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert whatsapp messages"
    ON whatsapp_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            JOIN profiles ON profiles.company_id = whatsapp_sessions.company_id
            WHERE whatsapp_messages.session_id = whatsapp_sessions.id
            AND profiles.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can update whatsapp messages"
    ON whatsapp_messages FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_sessions
            JOIN profiles ON profiles.company_id = whatsapp_sessions.company_id
            WHERE whatsapp_messages.session_id = whatsapp_sessions.id
            AND profiles.user_id = auth.uid()
        )
    );

-- ============================================================
-- 10. Realtime Subscriptions
-- ============================================================

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE whatsapp_contacts;
