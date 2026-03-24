-- ============================================================
-- FIX: Corrigir recursão infinita em kanban_boards
-- ============================================================
-- Migration: 018_fix_kanban_boards_recursion.sql
-- Description: Remove todas as políticas problemáticas e recria
--              sem consultas cruzadas que causam recursão
-- ============================================================

-- ============================================================
-- LIMPAR TODAS AS POLÍTICAS DE KANBAN_BOARDS
-- ============================================================

DROP POLICY IF EXISTS "Super users can manage all kanban boards" ON kanban_boards;
DROP POLICY IF EXISTS "Users can view boards in their company" ON kanban_boards;
DROP POLICY IF EXISTS "Admins can create boards" ON kanban_boards;
DROP POLICY IF EXISTS "Admins and managers can update boards" ON kanban_boards;
DROP POLICY IF EXISTS "Only admins can delete boards" ON kanban_boards;
DROP POLICY IF EXISTS "Board creator can manage their boards" ON kanban_boards;

-- ============================================================
-- RECRIAR POLÍTICAS SIMPLES SEM RECURSÃO
-- ============================================================

-- Política 1: Qualquer usuário autenticado pode ver boards da sua empresa
-- (Simplificado - sem consulta a kanban_board_members)
CREATE POLICY "Users can view company boards" ON kanban_boards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() 
            AND p.company_id = kanban_boards.company_id
        )
    );

-- Política 2: Usuários podem criar boards na sua empresa
-- (Simplificado - permite qualquer usuário da empresa criar)
CREATE POLICY "Users can create boards" ON kanban_boards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() 
            AND p.company_id = kanban_boards.company_id
        )
    );

-- Política 3: Criador do board pode atualizar/deletar
CREATE POLICY "Creator can manage board" ON kanban_boards
    FOR ALL USING (
        kanban_boards.created_by = auth.uid()
    );

-- Política 4: Admins da empresa podem gerenciar qualquer board
CREATE POLICY "Company admins can manage boards" ON kanban_boards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.user_id = auth.uid() 
            AND p.company_id = kanban_boards.company_id
            AND p.role IN ('CLIENT_ADMIN', 'SUPER_USER')
        )
    );

-- ============================================================
-- LIMPAR POLÍTICAS DE KANBAN_BOARD_MEMBERS (SE AINDA EXISTIREM)
-- ============================================================

DROP POLICY IF EXISTS "Users can view board members of accessible boards" ON kanban_board_members;
DROP POLICY IF EXISTS "Board admins can manage members" ON kanban_board_members;
DROP POLICY IF EXISTS "Users can view board members" ON kanban_board_members;
DROP POLICY IF EXISTS "Board creator can add themselves" ON kanban_board_members;
DROP POLICY IF EXISTS "Users can view board members as creator" ON kanban_board_members;
DROP POLICY IF EXISTS "Users can view own board membership" ON kanban_board_members;
DROP POLICY IF EXISTS "Board creator can manage members" ON kanban_board_members;
DROP POLICY IF EXISTS "Company admins can manage board members" ON kanban_board_members;

-- ============================================================
-- RECRIAR POLÍTICAS SIMPLES PARA KANBAN_BOARD_MEMBERS
-- ============================================================

-- Política 1: Ver membros - apenas se for da mesma empresa
CREATE POLICY "View members in company" ON kanban_board_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            JOIN profiles p ON p.company_id = b.company_id
            WHERE b.id = kanban_board_members.board_id
            AND p.user_id = auth.uid()
        )
    );

-- Política 2: Inserir - apenas se for da mesma empresa
CREATE POLICY "Insert members in company" ON kanban_board_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            JOIN profiles p ON p.company_id = b.company_id
            WHERE b.id = kanban_board_members.board_id
            AND p.user_id = auth.uid()
        )
    );

-- Política 3: Atualizar/deletar - apenas criador do board ou admin
CREATE POLICY "Manage members as creator" ON kanban_board_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            WHERE b.id = kanban_board_members.board_id
            AND b.created_by = auth.uid()
        )
    );

-- ============================================================
-- LIMPAR E RECRIAR POLÍTICAS DE KANBAN_COLUMNS
-- ============================================================

DROP POLICY IF EXISTS "Super users can manage all columns" ON kanban_columns;
DROP POLICY IF EXISTS "Users can view columns of accessible boards" ON kanban_columns;
DROP POLICY IF EXISTS "Board admins can manage columns" ON kanban_columns;
DROP POLICY IF EXISTS "Board creator can view columns" ON kanban_columns;
DROP POLICY IF EXISTS "Board creator can manage columns" ON kanban_columns;
DROP POLICY IF EXISTS "Company admins can manage columns" ON kanban_columns;

-- Políticas simplificadas para columns
CREATE POLICY "View columns in company" ON kanban_columns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            JOIN profiles p ON p.company_id = b.company_id
            WHERE b.id = kanban_columns.board_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Manage columns as board creator" ON kanban_columns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            WHERE b.id = kanban_columns.board_id
            AND b.created_by = auth.uid()
        )
    );

-- ============================================================
-- LIMPAR E RECRIAR POLÍTICAS DE KANBAN_CARDS
-- ============================================================

DROP POLICY IF EXISTS "Super users can manage all cards" ON kanban_cards;
DROP POLICY IF EXISTS "Users can view cards of accessible boards" ON kanban_cards;
DROP POLICY IF EXISTS "Board members can view cards" ON kanban_cards;
DROP POLICY IF EXISTS "Board members can create cards" ON kanban_cards;
DROP POLICY IF EXISTS "Board creator can view cards" ON kanban_cards;
DROP POLICY IF EXISTS "Card creator can view" ON kanban_cards;
DROP POLICY IF EXISTS "Board creator can manage cards" ON kanban_cards;
DROP POLICY IF EXISTS "Company admins can manage cards" ON kanban_cards;

-- Políticas simplificadas para cards
CREATE POLICY "View cards in company" ON kanban_cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            JOIN profiles p ON p.company_id = b.company_id
            WHERE b.id = kanban_cards.board_id
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Manage cards as board creator" ON kanban_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM kanban_boards b
            WHERE b.id = kanban_cards.board_id
            AND b.created_by = auth.uid()
        )
    );

CREATE POLICY "Manage own cards" ON kanban_cards
    FOR ALL USING (
        kanban_cards.created_by = auth.uid()
    );
