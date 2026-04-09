-- Migration: Add WABA Webhook Fields and Tables
-- Date: 2026-04-09
-- Description: Adds webhook configuration fields, waba_connections table, and webhook logs

-- ============================================================
-- 1. Add new columns to existing waba_configs table
-- ============================================================
ALTER TABLE waba_configs 
ADD COLUMN IF NOT EXISTS api_version VARCHAR(10) DEFAULT 'v18.0',
ADD COLUMN IF NOT EXISTS webhook_events JSONB DEFAULT '["messages", "message_template_status_update", "account_alerts"]',
ADD COLUMN IF NOT EXISTS verify_token TEXT,
ADD COLUMN IF NOT EXISTS account_uuid UUID DEFAULT gen_random_uuid();

-- Create index for account_uuid
CREATE INDEX IF NOT EXISTS idx_waba_configs_account_uuid ON waba_configs(account_uuid);

-- ============================================================
-- 2. Create waba_connections table for multiple connections
-- ============================================================
CREATE TABLE IF NOT EXISTS waba_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    waba_config_id UUID REFERENCES waba_configs(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    phone_number_id VARCHAR(255) NOT NULL,
    business_account_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    api_version VARCHAR(10) DEFAULT 'v18.0',
    webhook_url TEXT,
    webhook_verify_token TEXT,
    webhook_events JSONB DEFAULT '["messages", "message_template_status_update", "account_alerts"]',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error', 'disconnected')),
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for waba_connections
CREATE INDEX IF NOT EXISTS idx_waba_connections_company_id ON waba_connections(company_id);
CREATE INDEX IF NOT EXISTS idx_waba_connections_status ON waba_connections(status);
CREATE INDEX IF NOT EXISTS idx_waba_connections_phone_number_id ON waba_connections(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_waba_connections_waba_config_id ON waba_connections(waba_config_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_waba_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_waba_connections_updated_at
    BEFORE UPDATE ON waba_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_waba_connections_updated_at();

-- ============================================================
-- 3. Create waba_webhook_logs table
-- ============================================================
CREATE TABLE IF NOT EXISTS waba_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    connection_id UUID REFERENCES waba_connections(id) ON DELETE CASCADE,
    waba_config_id UUID REFERENCES waba_configs(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'success' CHECK (status IN ('success', 'error', 'pending')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for waba_webhook_logs
CREATE INDEX IF NOT EXISTS idx_waba_webhook_logs_connection_id ON waba_webhook_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_waba_webhook_logs_event_type ON waba_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_waba_webhook_logs_created_at ON waba_webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_waba_webhook_logs_status ON waba_webhook_logs(status);

-- ============================================================
-- 4. Enable RLS on new tables
-- ============================================================
ALTER TABLE waba_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE waba_webhook_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. RLS Policies for waba_connections
-- ============================================================

-- Users can view connections from their company
CREATE POLICY "Users can view company waba connections"
    ON waba_connections FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR profiles.company_id = waba_connections.company_id
            )
        )
    );

-- Admins can insert connections for their company
CREATE POLICY "Admins can insert company waba connections"
    ON waba_connections FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR (profiles.company_id = waba_connections.company_id AND profiles.role = 'CLIENT_ADMIN')
            )
        )
    );

-- Admins can update connections from their company
CREATE POLICY "Admins can update company waba connections"
    ON waba_connections FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR (profiles.company_id = waba_connections.company_id AND profiles.role = 'CLIENT_ADMIN')
            )
        )
    );

-- Admins can delete connections from their company
CREATE POLICY "Admins can delete company waba connections"
    ON waba_connections FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR (profiles.company_id = waba_connections.company_id AND profiles.role = 'CLIENT_ADMIN')
            )
        )
    );

-- ============================================================
-- 6. RLS Policies for waba_webhook_logs
-- ============================================================

-- Users can view webhook logs from their company's connections
CREATE POLICY "Users can view company webhook logs"
    ON waba_webhook_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM waba_connections
            JOIN profiles ON profiles.company_id = waba_connections.company_id
            WHERE waba_webhook_logs.connection_id = waba_connections.id
            AND profiles.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'SUPER_USER'
        )
    );

-- System can insert webhook logs (via service role or triggers)
CREATE POLICY "System can insert webhook logs"
    ON waba_webhook_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================================
-- 7. Function to generate verify token
-- ============================================================
CREATE OR REPLACE FUNCTION generate_waba_verify_token()
RETURNS TEXT AS $$
DECLARE
    token TEXT;
BEGIN
    -- Generate a random 32-character alphanumeric token
    token := encode(gen_random_bytes(24), 'base64');
    -- Remove special characters and limit to 32 chars
    token := regexp_replace(token, '[^a-zA-Z0-9]', '', 'g');
    token := substring(token, 1, 32);
    RETURN token;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 8. Function to process webhook and create log
-- ============================================================
CREATE OR REPLACE FUNCTION log_waba_webhook_event(
    p_connection_id UUID,
    p_event_type VARCHAR,
    p_payload JSONB,
    p_status VARCHAR DEFAULT 'success',
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO waba_webhook_logs (
        connection_id,
        event_type,
        payload,
        status,
        error_message
    ) VALUES (
        p_connection_id,
        p_event_type,
        p_payload,
        p_status,
        p_error_message
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. Comments for documentation
-- ============================================================
COMMENT ON TABLE waba_connections IS 'Stores multiple WhatsApp Business API connections per company';
COMMENT ON TABLE waba_webhook_logs IS 'Logs all incoming webhook events from Meta WhatsApp API';
COMMENT ON COLUMN waba_configs.verify_token IS 'Token used to verify webhook authenticity with Meta';
COMMENT ON COLUMN waba_configs.webhook_events IS 'JSON array of subscribed webhook events';
COMMENT ON COLUMN waba_configs.account_uuid IS 'Unique identifier for webhook URL generation';
