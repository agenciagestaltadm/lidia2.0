-- Migration: Add WABA (WhatsApp Business API) tables
-- Date: 2026-03-23
-- Description: Creates tables for WABA configurations, templates, and integration with Meta API

-- ============================================================
-- 1. WABA Configurations Table
-- ============================================================
CREATE TABLE IF NOT EXISTS waba_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone_number_id VARCHAR(255) NOT NULL,
    business_account_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    webhook_url TEXT,
    webhook_verify_token TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error', 'disconnected')),
    last_sync_at TIMESTAMPTZ,
    last_error TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for waba_configs
CREATE INDEX IF NOT EXISTS idx_waba_configs_company_id ON waba_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_waba_configs_status ON waba_configs(status);
CREATE INDEX IF NOT EXISTS idx_waba_configs_phone_number_id ON waba_configs(phone_number_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_waba_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_waba_configs_updated_at
    BEFORE UPDATE ON waba_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_waba_configs_updated_at();

-- ============================================================
-- 2. WABA Templates Table
-- ============================================================
CREATE TABLE IF NOT EXISTS waba_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waba_config_id UUID NOT NULL REFERENCES waba_configs(id) ON DELETE CASCADE,
    template_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('MARKETING', 'UTILITY', 'AUTHENTICATION')),
    language VARCHAR(10) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'FLAGGED', 'DISABLED')),
    content JSONB NOT NULL DEFAULT '{}',
    components JSONB DEFAULT '[]',
    parameter_format VARCHAR(20) DEFAULT 'POSITIONAL' CHECK (parameter_format IN ('POSITIONAL', 'NAMED')),
    reason TEXT,
    quality_score VARCHAR(20),
    meta_created_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(waba_config_id, template_id)
);

-- Indexes for waba_templates
CREATE INDEX IF NOT EXISTS idx_waba_templates_waba_config_id ON waba_templates(waba_config_id);
CREATE INDEX IF NOT EXISTS idx_waba_templates_status ON waba_templates(status);
CREATE INDEX IF NOT EXISTS idx_waba_templates_category ON waba_templates(category);
CREATE INDEX IF NOT EXISTS idx_waba_templates_name ON waba_templates(name);

-- Trigger for updated_at
CREATE TRIGGER update_waba_templates_updated_at
    BEFORE UPDATE ON waba_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_waba_configs_updated_at();

-- ============================================================
-- 3. Enable RLS on all WABA tables
-- ============================================================
ALTER TABLE waba_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE waba_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS Policies for waba_configs
-- ============================================================

-- Users can view WABA configs from their company
CREATE POLICY "Users can view company waba configs"
    ON waba_configs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR profiles.company_id = waba_configs.company_id
            )
        )
    );

-- Admins can insert WABA configs for their company
CREATE POLICY "Admins can insert company waba configs"
    ON waba_configs FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR (profiles.company_id = waba_configs.company_id AND profiles.role = 'CLIENT_ADMIN')
            )
        )
    );

-- Admins can update WABA configs from their company
CREATE POLICY "Admins can update company waba configs"
    ON waba_configs FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR (profiles.company_id = waba_configs.company_id AND profiles.role = 'CLIENT_ADMIN')
            )
        )
    );

-- Admins can delete WABA configs from their company
CREATE POLICY "Admins can delete company waba configs"
    ON waba_configs FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR (profiles.company_id = waba_configs.company_id AND profiles.role = 'CLIENT_ADMIN')
            )
        )
    );

-- ============================================================
-- 5. RLS Policies for waba_templates
-- ============================================================

-- Users can view templates from their company's WABA configs
CREATE POLICY "Users can view company waba templates"
    ON waba_templates FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM waba_configs
            JOIN profiles ON profiles.company_id = waba_configs.company_id
            WHERE waba_templates.waba_config_id = waba_configs.id
            AND profiles.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'SUPER_USER'
        )
    );

-- Admins can manage templates for their company's WABA configs
CREATE POLICY "Admins can manage company waba templates"
    ON waba_templates FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM waba_configs
            JOIN profiles ON profiles.company_id = waba_configs.company_id
            WHERE waba_templates.waba_config_id = waba_configs.id
            AND profiles.user_id = auth.uid()
            AND profiles.role = 'CLIENT_ADMIN'
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'SUPER_USER'
        )
    );

-- ============================================================
-- 6. Function to sync templates (to be called by admin or cron)
-- ============================================================
CREATE OR REPLACE FUNCTION sync_waba_templates(
    p_waba_config_id UUID,
    p_templates JSONB
)
RETURNS void AS $$
BEGIN
    -- Delete templates that are no longer in Meta
    DELETE FROM waba_templates
    WHERE waba_config_id = p_waba_config_id
    AND template_id NOT IN (
        SELECT (template->>'id')::text
        FROM jsonb_array_elements(p_templates) AS template
    );
    
    -- Insert or update templates
    INSERT INTO waba_templates (
        waba_config_id,
        template_id,
        name,
        category,
        language,
        status,
        content,
        components,
        parameter_format,
        reason,
        quality_score,
        meta_created_at
    )
    SELECT
        p_waba_config_id,
        template->>'id',
        template->>'name',
        UPPER(template->>'category'),
        template->>'language',
        UPPER(template->>'status'),
        template,
        COALESCE(template->'components', '[]'),
        COALESCE(template->>'parameter_format', 'POSITIONAL'),
        template->>'reason',
        template->>'quality_score',
        (template->>'created_at')::TIMESTAMPTZ
    FROM jsonb_array_elements(p_templates) AS template
    ON CONFLICT (waba_config_id, template_id)
    DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        language = EXCLUDED.language,
        status = EXCLUDED.status,
        content = EXCLUDED.content,
        components = EXCLUDED.components,
        parameter_format = EXCLUDED.parameter_format,
        reason = EXCLUDED.reason,
        quality_score = EXCLUDED.quality_score,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. Comment for documentation
-- ============================================================
COMMENT ON TABLE waba_configs IS 'Stores WhatsApp Business API configurations for each company';
COMMENT ON TABLE waba_templates IS 'Stores message templates synced from Meta WhatsApp Business API';
