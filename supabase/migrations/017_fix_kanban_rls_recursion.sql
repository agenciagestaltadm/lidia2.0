-- ============================================================
-- FIX: Corrigir recursão infinita nas políticas RLS do Kanban
-- ============================================================
-- Migration: 017_fix_kanban_rls_recursion.sql
-- Description: Corrige políticas RLS que causam recursão infinita
--              ao consultar kanban_board_members dentro de políticas
-- ============================================================

-- ============================================================
-- FIX POLÍTICAS - kanban_boards
-- ============================================================

-- A política de INSERT já está correta (não tem recursão)
-- Mas vamos adicionar uma política para permitir que o criador gerencie seu próprio board

DROP POLICY IF EXISTS "Board creator can manage their boards" ON kanban_boards;

CREATE POLICY "Board creator can manage their boards" ON kanban_boards
    FOR ALL USING (
        kanban_boards.created_by = auth.uid()
    );

-- ============================================================
-- FIX POLÍTICAS - kanban_board_members (RECURSÃO PRINCIPAL)
-- ============================================================

DROP POLICY IF EXISTS "Users can view board members of accessible boards" ON kanban_board_members;
DROP POLICY IF EXISTS "Board admins can manage members" ON kanban_board_members;
DROP POLICY IF EXISTS "Users can view board members" ON kanban_board_members;
DROP POLICY IF EXISTS "Board creator can add themselves" ON kanban_board_members;

-- Política 1: Usuários podem ver membros de boards onde são o criador
CREATE POLICY "Users can view board members as creator" ON kanban_board_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            WHERE b.id = kanban_board_members.board_id
            AND b.created_by = auth.uid()
        )
    );

-- Política 2: Usuários podem ver seus próprios registros de membro
CREATE POLICY "Users can view own board membership" ON kanban_board_members
    FOR SELECT USING (
        kanban_board_members.user_id = auth.uid()
    );

-- Política 3: Board creator pode gerenciar membros (INSERT/UPDATE/DELETE)
CREATE POLICY "Board creator can manage members" ON kanban_board_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            WHERE b.id = kanban_board_members.board_id
            AND b.created_by = auth.uid()
        )
    );

-- Política 4: Admins da empresa podem gerenciar membros
CREATE POLICY "Company admins can manage board members" ON kanban_board_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            JOIN profiles p ON p.company_id = b.company_id
            WHERE b.id = kanban_board_members.board_id
            AND p.user_id = auth.uid()
            AND p.role IN ('CLIENT_ADMIN', 'SUPER_USER')
        )
    );

-- ============================================================
-- FIX POLÍTICAS - kanban_columns (RECURSÃO)
-- ============================================================

DROP POLICY IF EXISTS "Users can view columns of accessible boards" ON kanban_columns;
DROP POLICY IF EXISTS "Board admins can manage columns" ON kanban_columns;

-- Política 1: Criador do board pode ver colunas
CREATE POLICY "Board creator can view columns" ON kanban_columns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            WHERE b.id = kanban_columns.board_id
            AND b.created_by = auth.uid()
        )
    );

-- Política 2: Board creator pode gerenciar colunas
CREATE POLICY "Board creator can manage columns" ON kanban_columns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            WHERE b.id = kanban_columns.board_id
            AND b.created_by = auth.uid()
        )
    );

-- Política 3: Admins da empresa podem gerenciar colunas
CREATE POLICY "Company admins can manage columns" ON kanban_columns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            JOIN profiles p ON p.company_id = b.company_id
            WHERE b.id = kanban_columns.board_id
            AND p.user_id = auth.uid()
            AND p.role IN ('CLIENT_ADMIN', 'SUPER_USER')
        )
    );

-- ============================================================
-- FIX POLÍTICAS - kanban_cards (RECURSÃO)
-- ============================================================

DROP POLICY IF EXISTS "Users can view cards of accessible boards" ON kanban_cards;
DROP POLICY IF EXISTS "Board members can view cards" ON kanban_cards;
DROP POLICY IF EXISTS "Board members can create cards" ON kanban_cards;

-- Política 1: Criador do board pode ver cards
CREATE POLICY "Board creator can view cards" ON kanban_cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            WHERE b.id = kanban_cards.board_id
            AND b.created_by = auth.uid()
        )
    );

-- Política 2: Criador do card pode ver
CREATE POLICY "Card creator can view" ON kanban_cards
    FOR SELECT USING (
        kanban_cards.created_by = auth.uid()
    );

-- Política 3: Criador do board pode criar/editar/deletar cards
CREATE POLICY "Board creator can manage cards" ON kanban_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            WHERE b.id = kanban_cards.board_id
            AND b.created_by = auth.uid()
        )
    );

-- Política 4: Admins da empresa podem gerenciar cards
CREATE POLICY "Company admins can manage cards" ON kanban_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            JOIN profiles p ON p.company_id = b.company_id
            WHERE b.id = kanban_cards.board_id
            AND p.user_id = auth.uid()
            AND p.role IN ('CLIENT_ADMIN', 'SUPER_USER')
        )
    );

-- ============================================================
-- FIX POLÍTICAS - kanban_comments (RECURSÃO)
-- ============================================================

DROP POLICY IF EXISTS "Users can view comments of accessible boards" ON kanban_comments;
DROP POLICY IF EXISTS "Board members can create comments" ON kanban_comments;

-- Política 1: Criador do board pode ver comentários
CREATE POLICY "Board creator can view comments" ON kanban_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kanban_cards c
            JOIN kanban_boards b ON b.id = c.board_id
            WHERE c.id = kanban_comments.card_id
            AND b.created_by = auth.uid()
        )
    );

-- Política 2: Criador do comentário pode ver
CREATE POLICY "Comment creator can view" ON kanban_comments
    FOR SELECT USING (
        kanban_comments.user_id = auth.uid()
    );

-- Política 3: Criador do board pode gerenciar comentários
CREATE POLICY "Board creator can manage comments" ON kanban_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kanban_cards c
            JOIN kanban_boards b ON b.id = c.board_id
            WHERE c.id = kanban_comments.card_id
            AND b.created_by = auth.uid()
        )
    );

-- ============================================================
-- FIX POLÍTICAS - kanban_attachments (RECURSÃO)
-- ============================================================

DROP POLICY IF EXISTS "Users can view attachments of accessible boards" ON kanban_attachments;
DROP POLICY IF EXISTS "Board members can create attachments" ON kanban_attachments;

-- Política 1: Criador do board pode ver anexos
CREATE POLICY "Board creator can view attachments" ON kanban_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kanban_cards c
            JOIN kanban_boards b ON b.id = c.board_id
            WHERE c.id = kanban_attachments.card_id
            AND b.created_by = auth.uid()
        )
    );

-- Política 2: Quem fez upload pode ver
CREATE POLICY "Uploader can view attachments" ON kanban_attachments
    FOR SELECT USING (
        kanban_attachments.uploaded_by = auth.uid()
    );

-- Política 3: Criador do board pode gerenciar anexos
CREATE POLICY "Board creator can manage attachments" ON kanban_attachments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kanban_cards c
            JOIN kanban_boards b ON b.id = c.board_id
            WHERE c.id = kanban_attachments.card_id
            AND b.created_by = auth.uid()
        )
    );

-- ============================================================
-- FIX POLÍTICAS - kanban_checklists (RECURSÃO)
-- ============================================================

DROP POLICY IF EXISTS "Users can view checklists of accessible boards" ON kanban_checklists;

-- Política 1: Criador do board pode ver checklists
CREATE POLICY "Board creator can view checklists" ON kanban_checklists
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kanban_cards c
            JOIN kanban_boards b ON b.id = c.board_id
            WHERE c.id = kanban_checklists.card_id
            AND b.created_by = auth.uid()
        )
    );

-- Política 2: Criador do board pode gerenciar checklists
CREATE POLICY "Board creator can manage checklists" ON kanban_checklists
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kanban_cards c
            JOIN kanban_boards b ON b.id = c.board_id
            WHERE c.id = kanban_checklists.card_id
            AND b.created_by = auth.uid()
        )
    );

-- ============================================================
-- FIX POLÍTICAS - kanban_activities (RECURSÃO)
-- ============================================================

DROP POLICY IF EXISTS "Users can view activities of accessible boards" ON kanban_activities;

-- Política 1: Criador do board pode ver atividades
CREATE POLICY "Board creator can view activities" ON kanban_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            WHERE b.id = kanban_activities.board_id
            AND b.created_by = auth.uid()
        )
    );

-- Política 2: Quem gerou a atividade pode ver
CREATE POLICY "Activity creator can view" ON kanban_activities
    FOR SELECT USING (
        kanban_activities.user_id = auth.uid()
    );
