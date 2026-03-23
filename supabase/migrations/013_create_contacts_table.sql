-- Migration: Create contacts table for CRM
-- Date: 2026-03-23

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    avatar TEXT,
    company VARCHAR(255),
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'lead', 'client', 'prospect')),
    source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('manual', 'whatsapp', 'instagram', 'facebook', 'email', 'website')),
    last_contact_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_assigned_to ON contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags);

-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Super admins can do everything
CREATE POLICY "Super admins can do everything on contacts"
    ON contacts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- Users can view contacts from their company
CREATE POLICY "Users can view company contacts"
    ON contacts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (
                profiles.role = 'super_admin'
                OR profiles.company_id = contacts.company_id
            )
        )
    );

-- Users can insert contacts for their company
CREATE POLICY "Users can insert contacts for their company"
    ON contacts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (
                profiles.role = 'super_admin'
                OR profiles.company_id = company_id
            )
        )
    );

-- Users can update contacts from their company
CREATE POLICY "Users can update company contacts"
    ON contacts
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (
                profiles.role = 'super_admin'
                OR profiles.company_id = company_id
            )
        )
    );

-- Users can delete contacts from their company
CREATE POLICY "Users can delete company contacts"
    ON contacts
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (
                profiles.role = 'super_admin'
                OR profiles.company_id = company_id
            )
        )
    );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contacts_updated_at();

-- Insert sample data
INSERT INTO contacts (name, email, phone, company, tags, status, source, notes)
VALUES 
    ('João Silva', 'joao.silva@email.com', '(11) 99999-9999', 'Empresa ABC', ARRAY['Cliente', 'VIP'], 'client', 'manual', 'Cliente VIP desde 2024'),
    ('Maria Santos', 'maria.santos@email.com', '(11) 98888-8888', 'Empresa XYZ', ARRAY['Lead'], 'lead', 'whatsapp', 'Interessada em produtos premium'),
    ('Pedro Costa', 'pedro.costa@email.com', '(11) 97777-7777', 'Costa Ltda', ARRAY['Cliente'], 'client', 'manual', 'Cliente recorrente'),
    ('Ana Oliveira', 'ana.oliveira@email.com', '(11) 96666-6666', 'Oliveira Corp', ARRAY['Parceiro'], 'active', 'email', 'Parceiro estratégico')
ON CONFLICT DO NOTHING;
