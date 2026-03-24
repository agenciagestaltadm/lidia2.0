-- ============================================================
-- LIDIA 2.0 CRM - Kanban Enterprise Schema
-- ============================================================
-- Migration: 016_create_kanban_tables.sql
-- Description: Cria tabelas para sistema Kanban enterprise
-- com suporte a multi-tenant, RLS e auditoria
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE kanban_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE kanban_card_type AS ENUM ('TASK', 'BUG', 'FEATURE', 'EPIC', 'STORY');

-- ============================================================
-- TABELAS PRINCIPAIS
-- ============================================================

-- Boards (Quadros Kanban)
CREATE TABLE kanban_boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_archived BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{
        "allowCardCovers": true,
        "allowChecklists": true,
        "allowAttachments": true,
        "allowTimeTracking": false,
        "defaultCardTemplate": null
    }'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Colunas dos Boards
CREATE TABLE kanban_columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    color TEXT,
    wip_limit INTEGER, -- Work In Progress limit
    is_done_column BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards (Tarefas)
CREATE TABLE kanban_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    column_id UUID NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
    board_id UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    priority kanban_priority DEFAULT 'MEDIUM',
    card_type kanban_card_type DEFAULT 'TASK',
    due_date TIMESTAMPTZ,
    start_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_hours DECIMAL(6, 2),
    actual_hours DECIMAL(6, 2),
    cover_image_url TEXT,
    is_archived BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Etiquetas (Labels) por empresa
CREATE TABLE kanban_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relação Cards <-> Labels (N:M)
CREATE TABLE kanban_card_labels (
    card_id UUID NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
    label_id UUID NOT NULL REFERENCES kanban_labels(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (card_id, label_id)
);

-- Membros dos Boards
CREATE TABLE kanban_board_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES kanban_boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER')),
    permissions JSONB DEFAULT '{
        "canCreateCard": true,
        "canEditCard": true,
        "canDeleteCard": false,
        "canMoveCard": true,
        "canAssignMembers": true,
        "canAddComments": true,
        "canUploadAttachments": true,
        "canManageColumns": false,
        "canManageLabels": false
    }'::jsonb,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID REFERENCES auth.users(id),
    UNIQUE (board_id, user_id)
);

-- Atribuição de membros aos Cards (N:M)
CREATE TABLE kanban_card_members (
    card_id UUID NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (card_id, user_id)
);

-- Comentários nos Cards
CREATE TABLE kanban_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES kanban_comments(id) ON DELETE CASCADE, -- Para respostas
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Anexos (Attachments)
CREATE TABLE kanban_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    storage_bucket TEXT NOT NULL DEFAULT 'kanban-attachments',
    thumbnail_url TEXT,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklists
CREATE TABLE kanban_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES kanban_cards(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Checklist',
    "order" INTEGER NOT NULL DEFAULT 0,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens do Checklist
CREATE TABLE kanban_checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checklist_id UUID NOT NULL REFERENCES kanban_checklists(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    completed_by UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,
    assigned_to UUID REFERENCES auth.users(id),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Histórico de Atividades (Activity Log)
CREATE TABLE kanban_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    board_id UUID REFERENCES kanban_boards(id) ON DELETE CASCADE,
    card_id UUID REFERENCES kanban_cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action_type TEXT NOT NULL, -- 'CARD_CREATED', 'CARD_MOVED', 'CARD_UPDATED', etc.
    action_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favoritos (Bookmarks)
CREATE TABLE kanban_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    board_id UUID REFERENCES kanban_boards(id) ON DELETE CASCADE,
    card_id UUID REFERENCES kanban_cards(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (board_id IS NOT NULL OR card_id IS NOT NULL)
);

-- Templates de Cards
CREATE TABLE kanban_card_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_global BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================

-- Boards
CREATE INDEX idx_kanban_boards_company_id ON kanban_boards(company_id);
CREATE INDEX idx_kanban_boards_created_by ON kanban_boards(created_by);
CREATE INDEX idx_kanban_boards_is_archived ON kanban_boards(is_archived);

-- Colunas
CREATE INDEX idx_kanban_columns_board_id ON kanban_columns(board_id);
CREATE INDEX idx_kanban_columns_order ON kanban_columns("order");

-- Cards
CREATE INDEX idx_kanban_cards_column_id ON kanban_cards(column_id);
CREATE INDEX idx_kanban_cards_board_id ON kanban_cards(board_id);
CREATE INDEX idx_kanban_cards_company_id ON kanban_cards(company_id);
CREATE INDEX idx_kanban_cards_order ON kanban_cards("order");
CREATE INDEX idx_kanban_cards_due_date ON kanban_cards(due_date);
CREATE INDEX idx_kanban_cards_priority ON kanban_cards(priority);
CREATE INDEX idx_kanban_cards_is_archived ON kanban_cards(is_archived);
CREATE INDEX idx_kanban_cards_created_by ON kanban_cards(created_by);

-- Busca full-text em cards
CREATE INDEX idx_kanban_cards_search ON kanban_cards 
    USING gin(to_tsvector('portuguese', title || ' ' || COALESCE(description, '')));

-- Labels
CREATE INDEX idx_kanban_labels_company_id ON kanban_labels(company_id);

-- Card Labels
CREATE INDEX idx_kanban_card_labels_card_id ON kanban_card_labels(card_id);
CREATE INDEX idx_kanban_card_labels_label_id ON kanban_card_labels(label_id);

-- Board Members
CREATE INDEX idx_kanban_board_members_board_id ON kanban_board_members(board_id);
CREATE INDEX idx_kanban_board_members_user_id ON kanban_board_members(user_id);

-- Card Members
CREATE INDEX idx_kanban_card_members_card_id ON kanban_card_members(card_id);
CREATE INDEX idx_kanban_card_members_user_id ON kanban_card_members(user_id);

-- Comments
CREATE INDEX idx_kanban_comments_card_id ON kanban_comments(card_id);
CREATE INDEX idx_kanban_comments_user_id ON kanban_comments(user_id);
CREATE INDEX idx_kanban_comments_created_at ON kanban_comments(created_at DESC);

-- Attachments
CREATE INDEX idx_kanban_attachments_card_id ON kanban_attachments(card_id);

-- Checklists
CREATE INDEX idx_kanban_checklists_card_id ON kanban_checklists(card_id);

-- Checklist Items
CREATE INDEX idx_kanban_checklist_items_checklist_id ON kanban_checklist_items(checklist_id);

-- Activities
CREATE INDEX idx_kanban_activities_company_id ON kanban_activities(company_id);
CREATE INDEX idx_kanban_activities_board_id ON kanban_activities(board_id);
CREATE INDEX idx_kanban_activities_card_id ON kanban_activities(card_id);
CREATE INDEX idx_kanban_activities_user_id ON kanban_activities(user_id);
CREATE INDEX idx_kanban_activities_created_at ON kanban_activities(created_at DESC);

-- Bookmarks
CREATE INDEX idx_kanban_bookmarks_user_id ON kanban_bookmarks(user_id);

-- Templates
CREATE INDEX idx_kanban_card_templates_company_id ON kanban_card_templates(company_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_card_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_card_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_card_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLÍTICAS RLS - BOARDS
-- ============================================================

-- Super users podem gerenciar todos os boards
CREATE POLICY "Super users can manage all kanban boards" ON kanban_boards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'SUPER_USER'
        )
    );

-- Usuários podem ver boards da sua empresa (públicos ou onde são membros)
CREATE POLICY "Users can view boards in their company" ON kanban_boards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() 
            AND p.company_id = kanban_boards.company_id
        )
        AND (
            kanban_boards.is_public = true
            OR EXISTS (
                SELECT 1 FROM kanban_board_members bm
                WHERE bm.board_id = kanban_boards.id
                AND bm.user_id = auth.uid()
            )
            OR kanban_boards.created_by = auth.uid()
        )
    );

-- Admins podem criar boards na sua empresa
CREATE POLICY "Admins can create boards" ON kanban_boards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() 
            AND p.company_id = kanban_boards.company_id
            AND (p.role = 'CLIENT_ADMIN' OR p.role = 'SUPER_USER')
        )
    );

-- Admins e managers podem atualizar boards
CREATE POLICY "Admins and managers can update boards" ON kanban_boards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() 
            AND p.company_id = kanban_boards.company_id
            AND (p.role IN ('CLIENT_ADMIN', 'CLIENT_MANAGER', 'SUPER_USER'))
        )
        OR EXISTS (
            SELECT 1 FROM kanban_board_members bm
            WHERE bm.board_id = kanban_boards.id
            AND bm.user_id = auth.uid()
            AND bm.role IN ('ADMIN', 'MANAGER')
        )
    );

-- Apenas admins podem deletar boards
CREATE POLICY "Only admins can delete boards" ON kanban_boards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() 
            AND p.company_id = kanban_boards.company_id
            AND (p.role = 'CLIENT_ADMIN' OR p.role = 'SUPER_USER')
        )
    );

-- ============================================================
-- POLÍTICAS RLS - COLUMNS
-- ============================================================

CREATE POLICY "Super users can manage all columns" ON kanban_columns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'SUPER_USER'
        )
    );

CREATE POLICY "Users can view columns of accessible boards" ON kanban_columns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            WHERE b.id = kanban_columns.board_id
            AND (
                b.is_public = true
                OR EXISTS (
                    SELECT 1 FROM kanban_board_members bm
                    WHERE bm.board_id = b.id
                    AND bm.user_id = auth.uid()
                )
                OR b.created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Board admins can manage columns" ON kanban_columns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            JOIN kanban_board_members bm ON bm.board_id = b.id
            WHERE b.id = kanban_columns.board_id
            AND bm.user_id = auth.uid()
            AND bm.role IN ('ADMIN', 'MANAGER')
        )
        OR EXISTS (
            SELECT 1 FROM kanban_boards b
            JOIN profiles p ON p.company_id = b.company_id
            WHERE b.id = kanban_columns.board_id
            AND p.user_id = auth.uid()
            AND p.role IN ('CLIENT_ADMIN', 'SUPER_USER')
        )
    );

-- ============================================================
-- POLÍTICAS RLS - CARDS
-- ============================================================

CREATE POLICY "Super users can manage all cards" ON kanban_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'SUPER_USER'
        )
    );

CREATE POLICY "Users can view cards in their company" ON kanban_cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() 
            AND p.company_id = kanban_cards.company_id
        )
        AND EXISTS (
            SELECT 1 FROM kanban_boards b
            WHERE b.id = kanban_cards.board_id
            AND (
                b.is_public = true
                OR EXISTS (
                    SELECT 1 FROM kanban_board_members bm
                    WHERE bm.board_id = b.id
                    AND bm.user_id = auth.uid()
                )
                OR b.created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Board members can create cards" ON kanban_cards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            JOIN profiles p ON p.company_id = b.company_id
            WHERE b.id = kanban_cards.board_id
            AND p.user_id = auth.uid()
            AND p.company_id = kanban_cards.company_id
        )
        AND (
            EXISTS (
                SELECT 1 FROM kanban_board_members bm
                WHERE bm.board_id = kanban_cards.board_id
                AND bm.user_id = auth.uid()
                AND bm.permissions->>'canCreateCard' = 'true'
            )
            OR EXISTS (
                SELECT 1 FROM kanban_boards b
                WHERE b.id = kanban_cards.board_id
                AND b.created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Board members can update cards" ON kanban_cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() 
            AND p.company_id = kanban_cards.company_id
        )
        AND (
            EXISTS (
                SELECT 1 FROM kanban_board_members bm
                WHERE bm.board_id = kanban_cards.board_id
                AND bm.user_id = auth.uid()
                AND bm.permissions->>'canEditCard' = 'true'
            )
            OR EXISTS (
                SELECT 1 FROM kanban_card_members cm
                WHERE cm.card_id = kanban_cards.id
                AND cm.user_id = auth.uid()
            )
            OR kanban_cards.created_by = auth.uid()
            OR EXISTS (
                SELECT 1 FROM profiles p
                WHERE p.user_id = auth.uid()
                AND p.role IN ('CLIENT_ADMIN', 'CLIENT_MANAGER', 'SUPER_USER')
            )
        )
    );

CREATE POLICY "Board members can delete cards" ON kanban_cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM kanban_board_members bm
            WHERE bm.board_id = kanban_cards.board_id
            AND bm.user_id = auth.uid()
            AND bm.permissions->>'canDeleteCard' = 'true'
        )
        OR kanban_cards.created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid()
            AND p.company_id = kanban_cards.company_id
            AND p.role IN ('CLIENT_ADMIN', 'SUPER_USER')
        )
    );

-- ============================================================
-- POLÍTICAS RLS - LABELS
-- ============================================================

CREATE POLICY "Super users can manage all labels" ON kanban_labels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'SUPER_USER'
        )
    );

CREATE POLICY "Users can view labels in their company" ON kanban_labels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() 
            AND p.company_id = kanban_labels.company_id
        )
    );

CREATE POLICY "Admins can manage labels" ON kanban_labels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() 
            AND p.company_id = kanban_labels.company_id
            AND (p.role IN ('CLIENT_ADMIN', 'CLIENT_MANAGER', 'SUPER_USER'))
        )
    );

-- ============================================================
-- POLÍTICAS RLS - COMMENTS
-- ============================================================

CREATE POLICY "Users can view comments of accessible cards" ON kanban_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kanban_cards c
            JOIN kanban_boards b ON b.id = c.board_id
            WHERE c.id = kanban_comments.card_id
            AND (
                b.is_public = true
                OR EXISTS (
                    SELECT 1 FROM kanban_board_members bm
                    WHERE bm.board_id = b.id
                    AND bm.user_id = auth.uid()
                )
                OR b.created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Board members can create comments" ON kanban_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM kanban_cards c
            JOIN kanban_boards b ON b.id = c.board_id
            WHERE c.id = kanban_comments.card_id
            AND (
                EXISTS (
                    SELECT 1 FROM kanban_board_members bm
                    WHERE bm.board_id = b.id
                    AND bm.user_id = auth.uid()
                    AND bm.permissions->>'canAddComments' = 'true'
                )
                OR b.created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update own comments" ON kanban_comments
    FOR UPDATE USING (
        kanban_comments.user_id = auth.uid()
        AND kanban_comments.created_at > NOW() - INTERVAL '24 hours'
    );

CREATE POLICY "Users can delete own comments" ON kanban_comments
    FOR DELETE USING (
        kanban_comments.user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM kanban_cards c
            JOIN kanban_boards b ON b.id = c.board_id
            JOIN profiles p ON p.company_id = b.company_id
            WHERE c.id = kanban_comments.card_id
            AND p.user_id = auth.uid()
            AND p.role IN ('CLIENT_ADMIN', 'SUPER_USER')
        )
    );

-- ============================================================
-- POLÍTICAS RLS - ATTACHMENTS
-- ============================================================

CREATE POLICY "Users can view attachments of accessible cards" ON kanban_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kanban_cards c
            JOIN kanban_boards b ON b.id = c.board_id
            WHERE c.id = kanban_attachments.card_id
            AND (
                b.is_public = true
                OR EXISTS (
                    SELECT 1 FROM kanban_board_members bm
                    WHERE bm.board_id = b.id
                    AND bm.user_id = auth.uid()
                )
                OR b.created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Board members can upload attachments" ON kanban_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM kanban_cards c
            JOIN kanban_boards b ON b.id = c.board_id
            WHERE c.id = kanban_attachments.card_id
            AND (
                EXISTS (
                    SELECT 1 FROM kanban_board_members bm
                    WHERE bm.board_id = b.id
                    AND bm.user_id = auth.uid()
                    AND bm.permissions->>'canUploadAttachments' = 'true'
                )
                OR b.created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Uploaders can delete own attachments" ON kanban_attachments
    FOR DELETE USING (
        kanban_attachments.uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM kanban_cards c
            JOIN kanban_boards b ON b.id = c.board_id
            JOIN profiles p ON p.company_id = b.company_id
            WHERE c.id = kanban_attachments.card_id
            AND p.user_id = auth.uid()
            AND p.role IN ('CLIENT_ADMIN', 'SUPER_USER')
        )
    );

-- ============================================================
-- POLÍTICAS RLS - BOARD MEMBERS
-- ============================================================

CREATE POLICY "Users can view board members of accessible boards" ON kanban_board_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            WHERE b.id = kanban_board_members.board_id
            AND (
                b.is_public = true
                OR EXISTS (
                    SELECT 1 FROM kanban_board_members bm
                    WHERE bm.board_id = b.id
                    AND bm.user_id = auth.uid()
                )
                OR b.created_by = auth.uid()
            )
        )
    );

CREATE POLICY "Board admins can manage members" ON kanban_board_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            JOIN kanban_board_members bm ON bm.board_id = b.id
            WHERE b.id = kanban_board_members.board_id
            AND bm.user_id = auth.uid()
            AND bm.role IN ('ADMIN')
        )
        OR EXISTS (
            SELECT 1 FROM kanban_boards b
            JOIN profiles p ON p.company_id = b.company_id
            WHERE b.id = kanban_board_members.board_id
            AND p.user_id = auth.uid()
            AND p.role IN ('CLIENT_ADMIN', 'SUPER_USER')
        )
    );

-- ============================================================
-- POLÍTICAS RLS - ACTIVITIES
-- ============================================================

CREATE POLICY "Super users can view all activities" ON kanban_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.user_id = auth.uid() 
            AND profiles.role = 'SUPER_USER'
        )
    );

CREATE POLICY "Users can view activities in their company" ON kanban_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() 
            AND p.company_id = kanban_activities.company_id
        )
    );

-- ============================================================
-- TRIGGERS PARA ATUALIZAÇÃO DE TIMESTAMPS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kanban_boards_updated_at
    BEFORE UPDATE ON kanban_boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_columns_updated_at
    BEFORE UPDATE ON kanban_columns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_cards_updated_at
    BEFORE UPDATE ON kanban_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_labels_updated_at
    BEFORE UPDATE ON kanban_labels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_comments_updated_at
    BEFORE UPDATE ON kanban_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_checklists_updated_at
    BEFORE UPDATE ON kanban_checklists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kanban_checklist_items_updated_at
    BEFORE UPDATE ON kanban_checklist_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNÇÃO DE LOG DE ATIVIDADES
-- ============================================================

CREATE OR REPLACE FUNCTION log_kanban_activity(
    p_company_id UUID,
    p_board_id UUID,
    p_card_id UUID,
    p_user_id UUID,
    p_action_type TEXT,
    p_action_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    INSERT INTO kanban_activities (
        company_id,
        board_id,
        card_id,
        user_id,
        action_type,
        action_data
    ) VALUES (
        p_company_id,
        p_board_id,
        p_card_id,
        p_user_id,
        p_action_type,
        p_action_data
    )
    RETURNING id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNÇÃO PARA REORDENAR CARDS
-- ============================================================

CREATE OR REPLACE FUNCTION reorder_kanban_cards(
    p_card_id UUID,
    p_new_column_id UUID,
    p_new_order INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_old_column_id UUID;
    v_old_order INTEGER;
    v_board_id UUID;
    v_company_id UUID;
BEGIN
    -- Obter informações atuais do card
    SELECT column_id, "order", board_id, company_id
    INTO v_old_column_id, v_old_order, v_board_id, v_company_id
    FROM kanban_cards
    WHERE id = p_card_id;
    
    IF v_old_column_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Atualizar posição do card
    UPDATE kanban_cards
    SET 
        column_id = p_new_column_id,
        "order" = p_new_order,
        updated_at = NOW()
    WHERE id = p_card_id;
    
    -- Reordenar outros cards na coluna antiga
    IF v_old_column_id != p_new_column_id THEN
        UPDATE kanban_cards
        SET "order" = "order" - 1
        WHERE column_id = v_old_column_id
        AND "order" > v_old_order;
        
        -- Reordenar outros cards na nova coluna
        UPDATE kanban_cards
        SET "order" = "order" + 1
        WHERE column_id = p_new_column_id
        AND "order" >= p_new_order
        AND id != p_card_id;
    ELSE
        -- Mesma coluna, apenas reordenar
        IF p_new_order > v_old_order THEN
            UPDATE kanban_cards
            SET "order" = "order" - 1
            WHERE column_id = p_new_column_id
            AND "order" > v_old_order
            AND "order" <= p_new_order
            AND id != p_card_id;
        ELSIF p_new_order < v_old_order THEN
            UPDATE kanban_cards
            SET "order" = "order" + 1
            WHERE column_id = p_new_column_id
            AND "order" >= p_new_order
            AND "order" < v_old_order
            AND id != p_card_id;
        END IF;
    END IF;
    
    -- Log da atividade
    PERFORM log_kanban_activity(
        v_company_id,
        v_board_id,
        p_card_id,
        auth.uid(),
        'CARD_MOVED',
        jsonb_build_object(
            'old_column_id', v_old_column_id,
            'new_column_id', p_new_column_id,
            'old_order', v_old_order,
            'new_order', p_new_order
        )
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNÇÃO PARA CALCULAR PROGRESSO DO CHECKLIST
-- ============================================================

CREATE OR REPLACE FUNCTION get_checklist_progress(p_card_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_total_items INTEGER;
    v_completed_items INTEGER;
    v_progress DECIMAL(5,2);
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE is_completed = true)
    INTO v_total_items, v_completed_items
    FROM kanban_checklist_items
    WHERE checklist_id IN (
        SELECT id FROM kanban_checklists WHERE card_id = p_card_id
    );
    
    IF v_total_items = 0 THEN
        v_progress := 0;
    ELSE
        v_progress := (v_completed_items::DECIMAL / v_total_items::DECIMAL) * 100;
    END IF;
    
    RETURN jsonb_build_object(
        'total', v_total_items,
        'completed', v_completed_items,
        'progress', v_progress
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VIEW PARA DASHBOARD DE MÉTRICAS
-- ============================================================

CREATE OR REPLACE VIEW kanban_board_metrics AS
SELECT 
    b.id AS board_id,
    b.company_id,
    COUNT(DISTINCT c.id) AS total_cards,
    COUNT(DISTINCT c.id) FILTER (WHERE c.is_archived = false) AS active_cards,
    COUNT(DISTINCT c.id) FILTER (WHERE c.completed_at IS NOT NULL) AS completed_cards,
    COUNT(DISTINCT c.id) FILTER (WHERE c.due_date < NOW() AND c.completed_at IS NULL) AS overdue_cards,
    COUNT(DISTINCT bm.user_id) AS total_members,
    COUNT(DISTINCT col.id) AS total_columns,
    AVG(c.actual_hours) FILTER (WHERE c.actual_hours IS NOT NULL) AS avg_actual_hours,
    COUNT(DISTINCT c.id) FILTER (WHERE c.priority = 'HIGH' OR c.priority = 'URGENT') AS high_priority_cards
FROM kanban_boards b
LEFT JOIN kanban_columns col ON col.board_id = b.id
LEFT JOIN kanban_cards c ON c.column_id = col.id
LEFT JOIN kanban_board_members bm ON bm.board_id = b.id
WHERE b.is_archived = false
GROUP BY b.id, b.company_id;

-- ============================================================
-- COMENTÁRIOS FINAL
-- ============================================================

COMMENT ON TABLE kanban_boards IS 'Quadros Kanban por empresa';
COMMENT ON TABLE kanban_columns IS 'Colunas dos quadros Kanban';
COMMENT ON TABLE kanban_cards IS 'Cards/Tarefas do Kanban';
COMMENT ON TABLE kanban_labels IS 'Etiquetas coloridas para categorização';
COMMENT ON TABLE kanban_comments IS 'Comentários nos cards';
COMMENT ON TABLE kanban_attachments IS 'Arquivos anexados aos cards';
COMMENT ON TABLE kanban_checklists IS 'Checklists dentro dos cards';
COMMENT ON TABLE kanban_activities IS 'Log de atividades para auditoria';
