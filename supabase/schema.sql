-- ============================================================
-- LIDIA 2.0 CRM - Supabase Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('SUPER_USER', 'CLIENT_ADMIN', 'CLIENT_MANAGER', 'CLIENT_AGENT', 'CLIENT_VIEWER');
CREATE TYPE channel_type AS ENUM ('WHATSAPP', 'EMAIL', 'SMS', 'OTHER');
CREATE TYPE channel_status AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR');
CREATE TYPE ticket_status AS ENUM ('OPEN', 'PENDING', 'CLOSED');
CREATE TYPE ticket_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- ============================================================
-- TABLES
-- ============================================================

-- Companies (Tenants)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    document TEXT,
    logo_url TEXT,
    plan_id UUID,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plans
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price DECIMAL(10, 2),
    limits JSONB DEFAULT '{"max_users": 1, "max_channels": 1, "max_bulk_messages_per_day": 100}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (extends Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'CLIENT_AGENT',
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_sign_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channels
CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type channel_type NOT NULL DEFAULT 'OTHER',
    name TEXT NOT NULL,
    credentials JSONB,
    status channel_status DEFAULT 'DISCONNECTED',
    last_error TEXT,
    last_connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    target_id UUID,
    target_type TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company_name TEXT,
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipelines
CREATE TABLE pipelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stages
CREATE TABLE stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deals
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    value DECIMAL(12, 2),
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    responsible_id UUID REFERENCES auth.users(id),
    expected_close_date DATE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets (Attendances)
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    status ticket_status DEFAULT 'OPEN',
    priority ticket_priority DEFAULT 'MEDIUM',
    responsible_id UUID REFERENCES auth.users(id),
    tags TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bulk Campaigns
CREATE TABLE bulk_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    segment JSONB,
    message_template TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ,
    status TEXT DEFAULT 'DRAFT',
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_channels_company_id ON channels(company_id);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_deals_company_id ON deals(company_id);
CREATE INDEX idx_deals_contact_id ON deals(contact_id);
CREATE INDEX idx_deals_stage_id ON deals(stage_id);
CREATE INDEX idx_tickets_company_id ON tickets(company_id);
CREATE INDEX idx_tickets_contact_id ON tickets(contact_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_campaigns ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Super users can manage all companies" ON companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'SUPER_USER'
        )
    );

CREATE POLICY "Users can view their own company" ON companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.company_id = companies.id
        )
    );

-- Profiles policies
CREATE POLICY "Super users can manage all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.user_id = auth.uid() 
            AND p.role = 'SUPER_USER'
        )
    );

CREATE POLICY "Users can view profiles in their company" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.user_id = auth.uid() 
            AND p.company_id = profiles.company_id
        )
    );

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (
        profiles.user_id = auth.uid()
    );

-- Channels policies
CREATE POLICY "Super users can manage all channels" ON channels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'SUPER_USER'
        )
    );

CREATE POLICY "Users can manage channels in their company" ON channels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.company_id = channels.company_id
        )
    );

-- Audit logs policies
CREATE POLICY "Super users can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'SUPER_USER'
        )
    );

CREATE POLICY "Users can view audit logs in their company" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.company_id = audit_logs.company_id
        )
    );

-- Contacts policies
CREATE POLICY "Users can manage contacts in their company" ON contacts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.company_id = contacts.company_id
        )
    );

-- Pipelines policies
CREATE POLICY "Users can manage pipelines in their company" ON pipelines
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.company_id = pipelines.company_id
        )
    );

-- Stages policies
CREATE POLICY "Users can manage stages in their company" ON stages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN pipelines pl ON pl.id = stages.pipeline_id
            WHERE p.user_id = auth.uid() 
            AND p.company_id = pl.company_id
        )
    );

-- Deals policies
CREATE POLICY "Users can manage deals in their company" ON deals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.company_id = deals.company_id
        )
    );

-- Tickets policies
CREATE POLICY "Users can manage tickets in their company" ON tickets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.company_id = tickets.company_id
        )
    );

-- Bulk campaigns policies
CREATE POLICY "Users can manage bulk campaigns in their company" ON bulk_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.company_id = bulk_campaigns.company_id
        )
    );

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stages_updated_at BEFORE UPDATE ON stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bulk_campaigns_updated_at BEFORE UPDATE ON bulk_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, role, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'CLIENT_AGENT'),
        NEW.raw_user_meta_data->>'full_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_action TEXT,
    p_actor_id UUID,
    p_company_id UUID DEFAULT NULL,
    p_target_id UUID DEFAULT NULL,
    p_target_type TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (action, actor_id, company_id, target_id, target_type, metadata)
    VALUES (p_action, p_actor_id, p_company_id, p_target_id, p_target_type, p_metadata)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert default plan
INSERT INTO plans (name, price, limits, is_active) VALUES
('Básico', 99.00, '{"max_users": 3, "max_channels": 2, "max_bulk_messages_per_day": 500}'::jsonb, true),
('Profissional', 199.00, '{"max_users": 10, "max_channels": 5, "max_bulk_messages_per_day": 2000}'::jsonb, true),
('Empresarial', 499.00, '{"max_users": 50, "max_channels": 20, "max_bulk_messages_per_day": 10000}'::jsonb, true);
