-- Migration: Add Bulk Campaigns tables
-- Date: 2026-03-23
-- Description: Creates tables for bulk messaging campaigns, recipients, and message queue
-- NOTE: This migration depends on 014_add_waba_tables.sql

-- ============================================================
-- 1. Create ENUM Types
-- ============================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
        CREATE TYPE campaign_status AS ENUM (
            'draft', 
            'scheduled', 
            'running', 
            'paused', 
            'completed', 
            'cancelled', 
            'failed'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recipient_status') THEN
        CREATE TYPE recipient_status AS ENUM (
            'pending', 
            'queued', 
            'sending', 
            'sent', 
            'delivered', 
            'read', 
            'failed'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_selection_mode') THEN
        CREATE TYPE contact_selection_mode AS ENUM ('all', 'manual', 'csv');
    END IF;
END $$;

-- ============================================================
-- 2. Drop existing tables if they exist (clean slate)
-- ============================================================
DROP TABLE IF EXISTS bulk_message_queue CASCADE;
DROP TABLE IF EXISTS bulk_campaign_recipients CASCADE;
DROP TABLE IF EXISTS bulk_campaigns CASCADE;
DROP VIEW IF EXISTS bulk_campaign_stats;

-- ============================================================
-- 3. Bulk Campaigns Table
-- ============================================================
CREATE TABLE bulk_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    waba_config_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Template or custom message
    template_id UUID,
    custom_message TEXT,
    template_variables JSONB DEFAULT '[]',
    
    -- Interval configuration (random between min and max)
    min_interval_seconds INTEGER NOT NULL DEFAULT 5 CHECK (min_interval_seconds >= 1),
    max_interval_seconds INTEGER NOT NULL DEFAULT 15 CHECK (max_interval_seconds >= min_interval_seconds),
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    
    -- Status
    status campaign_status NOT NULL DEFAULT 'draft',
    
    -- Statistics
    total_recipients INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    delivered_count INTEGER NOT NULL DEFAULT 0,
    read_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    
    -- Contact selection
    contact_selection_mode contact_selection_mode NOT NULL DEFAULT 'manual',
    selected_contact_ids UUID[],
    csv_file_url TEXT,
    csv_data JSONB,
    
    -- Error tracking
    last_error TEXT,
    error_details JSONB,
    
    -- Meta info
    created_by UUID REFERENCES auth.users(id),
    cancelled_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for bulk_campaigns
CREATE INDEX idx_bulk_campaigns_company_id ON bulk_campaigns(company_id);
CREATE INDEX idx_bulk_campaigns_status ON bulk_campaigns(status);
CREATE INDEX idx_bulk_campaigns_waba_config_id ON bulk_campaigns(waba_config_id);
CREATE INDEX idx_bulk_campaigns_created_by ON bulk_campaigns(created_by);
CREATE INDEX idx_bulk_campaigns_scheduled_at ON bulk_campaigns(scheduled_at) WHERE status = 'scheduled';

-- ============================================================
-- 4. Bulk Campaign Recipients Table
-- ============================================================
CREATE TABLE bulk_campaign_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES bulk_campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id),
    
    -- Recipient data (snapshot at time of sending)
    name VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    phone_normalized VARCHAR(50) NOT NULL,
    
    -- Custom variables for template
    template_variables JSONB DEFAULT '{}',
    
    -- Status tracking
    status recipient_status NOT NULL DEFAULT 'pending',
    error_message TEXT,
    error_code VARCHAR(100),
    
    -- Timestamps
    queued_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    
    -- Meta API response
    meta_message_id VARCHAR(255),
    meta_response JSONB,
    
    -- Retry tracking
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for bulk_campaign_recipients
CREATE INDEX idx_bulk_campaign_recipients_campaign_id ON bulk_campaign_recipients(campaign_id);
CREATE INDEX idx_bulk_campaign_recipients_status ON bulk_campaign_recipients(status);
CREATE INDEX idx_bulk_campaign_recipients_phone ON bulk_campaign_recipients(phone_normalized);
CREATE INDEX idx_bulk_campaign_recipients_meta_message_id ON bulk_campaign_recipients(meta_message_id);
CREATE INDEX idx_bulk_campaign_recipients_contact_id ON bulk_campaign_recipients(contact_id);

-- ============================================================
-- 5. Bulk Message Queue Table (for scheduling)
-- ============================================================
CREATE TABLE bulk_message_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES bulk_campaigns(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES bulk_campaign_recipients(id) ON DELETE CASCADE,
    
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    scheduled_for TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for bulk_message_queue
CREATE INDEX idx_bulk_message_queue_status ON bulk_message_queue(status);
CREATE INDEX idx_bulk_message_queue_scheduled ON bulk_message_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_bulk_message_queue_campaign ON bulk_message_queue(campaign_id);
CREATE INDEX idx_bulk_message_queue_recipient ON bulk_message_queue(recipient_id);

-- ============================================================
-- 6. Campaign Stats View
-- ============================================================
CREATE VIEW bulk_campaign_stats AS
SELECT 
    c.id as campaign_id,
    c.company_id,
    c.name,
    c.status,
    c.total_recipients,
    c.sent_count,
    c.delivered_count,
    c.read_count,
    c.failed_count,
    CASE 
        WHEN c.total_recipients > 0 THEN ROUND((c.sent_count::numeric / c.total_recipients) * 100, 2)
        ELSE 0
    END as send_rate,
    CASE 
        WHEN c.sent_count > 0 THEN ROUND((c.delivered_count::numeric / c.sent_count) * 100, 2)
        ELSE 0
    END as delivery_rate,
    CASE 
        WHEN c.delivered_count > 0 THEN ROUND((c.read_count::numeric / c.delivered_count) * 100, 2)
        ELSE 0
    END as read_rate,
    c.created_at,
    c.completed_at,
    EXTRACT(EPOCH FROM (c.completed_at - c.started_at))/60 as duration_minutes
FROM bulk_campaigns c;

-- ============================================================
-- 7. Enable RLS
-- ============================================================
ALTER TABLE bulk_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_message_queue ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. RLS Policies for bulk_campaigns
-- ============================================================

-- Users can view campaigns from their company
CREATE POLICY "Users can view company campaigns"
    ON bulk_campaigns FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR profiles.company_id = bulk_campaigns.company_id
            )
        )
    );

-- Users with canSendBulk permission can create campaigns
CREATE POLICY "Users with permission can create campaigns"
    ON bulk_campaigns FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR (
                    profiles.company_id = bulk_campaigns.company_id
                    AND (
                        profiles.role = 'CLIENT_ADMIN'
                        OR (profiles.permissions->>'canSendBulk')::boolean = true
                    )
                )
            )
        )
    );

-- Admins and creators can update campaigns
CREATE POLICY "Admins and creators can update campaigns"
    ON bulk_campaigns FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR (
                    profiles.company_id = bulk_campaigns.company_id
                    AND (
                        profiles.role = 'CLIENT_ADMIN'
                        OR bulk_campaigns.created_by = auth.uid()
                    )
                )
            )
        )
    );

-- Admins and creators can delete campaigns
CREATE POLICY "Admins and creators can delete campaigns"
    ON bulk_campaigns FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR (
                    profiles.company_id = bulk_campaigns.company_id
                    AND (
                        profiles.role = 'CLIENT_ADMIN'
                        OR bulk_campaigns.created_by = auth.uid()
                    )
                )
            )
        )
    );

-- ============================================================
-- 9. RLS Policies for bulk_campaign_recipients
-- ============================================================

-- Users can view recipients from their company's campaigns
CREATE POLICY "Users can view company campaign recipients"
    ON bulk_campaign_recipients FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM bulk_campaigns
            JOIN profiles ON profiles.company_id = bulk_campaigns.company_id
            WHERE bulk_campaign_recipients.campaign_id = bulk_campaigns.id
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
-- 10. RLS Policies for bulk_message_queue
-- ============================================================

-- Only system (via service role) can manage queue
CREATE POLICY "Only service role can manage queue"
    ON bulk_message_queue FOR ALL
    TO service_role
    USING (true);

-- Users can view queue for their campaigns
CREATE POLICY "Users can view company queue"
    ON bulk_message_queue FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM bulk_campaigns
            JOIN profiles ON profiles.company_id = bulk_campaigns.company_id
            WHERE bulk_message_queue.campaign_id = bulk_campaigns.id
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
-- 11. Triggers for updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_bulk_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bulk_campaigns_updated_at
    BEFORE UPDATE ON bulk_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_bulk_tables_updated_at();

CREATE TRIGGER update_bulk_campaign_recipients_updated_at
    BEFORE UPDATE ON bulk_campaign_recipients
    FOR EACH ROW
    EXECUTE FUNCTION update_bulk_tables_updated_at();

-- ============================================================
-- 12. Function to update campaign stats
-- ============================================================
CREATE OR REPLACE FUNCTION update_campaign_stats(p_campaign_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE bulk_campaigns
    SET 
        sent_count = (
            SELECT COUNT(*) FROM bulk_campaign_recipients 
            WHERE campaign_id = p_campaign_id AND status IN ('sent', 'delivered', 'read')
        ),
        delivered_count = (
            SELECT COUNT(*) FROM bulk_campaign_recipients 
            WHERE campaign_id = p_campaign_id AND status IN ('delivered', 'read')
        ),
        read_count = (
            SELECT COUNT(*) FROM bulk_campaign_recipients 
            WHERE campaign_id = p_campaign_id AND status = 'read'
        ),
        failed_count = (
            SELECT COUNT(*) FROM bulk_campaign_recipients 
            WHERE campaign_id = p_campaign_id AND status = 'failed'
        ),
        updated_at = NOW()
    WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 13. Function to cancel campaign
-- ============================================================
CREATE OR REPLACE FUNCTION cancel_campaign(
    p_campaign_id UUID,
    p_cancelled_by UUID
)
RETURNS boolean AS $$
BEGIN
    UPDATE bulk_campaigns
    SET 
        status = 'cancelled',
        cancelled_at = NOW(),
        cancelled_by = p_cancelled_by,
        updated_at = NOW()
    WHERE id = p_campaign_id
    AND status IN ('draft', 'scheduled', 'running', 'paused');
    
    -- Cancel pending queue items
    UPDATE bulk_message_queue
    SET status = 'cancelled'
    WHERE campaign_id = p_campaign_id
    AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 14. Add Foreign Keys (after tables are created)
-- ============================================================
-- Note: These will only work if migration 014 was executed first
DO $$
BEGIN
    -- Add foreign key to waba_configs if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'waba_configs') THEN
        ALTER TABLE bulk_campaigns 
        ADD CONSTRAINT fk_bulk_campaigns_waba_config 
        FOREIGN KEY (waba_config_id) REFERENCES waba_configs(id) ON DELETE CASCADE;
    END IF;
    
    -- Add foreign key to waba_templates if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'waba_templates') THEN
        ALTER TABLE bulk_campaigns 
        ADD CONSTRAINT fk_bulk_campaigns_template 
        FOREIGN KEY (template_id) REFERENCES waba_templates(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================
-- 15. Comments
-- ============================================================
COMMENT ON TABLE bulk_campaigns IS 'Stores bulk messaging campaigns';
COMMENT ON TABLE bulk_campaign_recipients IS 'Stores individual recipients for each campaign';
COMMENT ON TABLE bulk_message_queue IS 'Queue for scheduled message sending';
