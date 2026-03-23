-- ============================================================
-- MIGRATION 011: Remover Triggers do Chat (Temporário)
-- ============================================================
-- Remove os triggers que estão causando problemas na criação
-- de empresas até que sejam corrigidos corretamente
-- ============================================================

-- Remover triggers
DROP TRIGGER IF EXISTS trigger_create_general_channel ON companies;
DROP TRIGGER IF EXISTS trigger_add_user_to_general_channel ON profiles;
DROP TRIGGER IF EXISTS trigger_update_chat_status_on_company_change ON profiles;

-- Remover funções
DROP FUNCTION IF EXISTS create_general_channel_on_company_insert();
DROP FUNCTION IF EXISTS add_user_to_general_channel_on_profile_insert();
DROP FUNCTION IF EXISTS update_chat_status_on_company_change();

-- ============================================================
-- FUNÇÃO SIMPLIFICADA: Criar canal geral (sem trigger automático)
-- ============================================================
-- Esta função pode ser chamada manualmente após criar a empresa
CREATE OR REPLACE FUNCTION create_general_channel_for_company(p_company_id UUID)
RETURNS UUID AS $$
DECLARE
    v_channel_id UUID;
    v_admin_user_id UUID;
BEGIN
    -- Verificar se já existe canal geral
    SELECT id INTO v_channel_id
    FROM chat_channels
    WHERE company_id = p_company_id
    AND is_general = true
    LIMIT 1;
    
    IF v_channel_id IS NOT NULL THEN
        RETURN v_channel_id;
    END IF;
    
    -- Buscar admin da empresa
    SELECT user_id INTO v_admin_user_id
    FROM profiles
    WHERE company_id = p_company_id
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Criar canal geral
    INSERT INTO chat_channels (
        company_id,
        name,
        description,
        type,
        created_by,
        is_general,
        is_active
    ) VALUES (
        p_company_id,
        'geral',
        'Canal geral da empresa para comunicação interna',
        'public',
        v_admin_user_id,
        true,
        true
    )
    RETURNING id INTO v_channel_id;
    
    -- Adicionar todos os usuários da empresa ao canal
    INSERT INTO chat_channel_members (
        channel_id,
        user_id,
        role,
        joined_at
    )
    SELECT
        v_channel_id,
        p.user_id,
        CASE WHEN p.role = 'CLIENT_ADMIN' THEN 'admin'::chat_member_role ELSE 'member'::chat_member_role END,
        NOW()
    FROM profiles p
    WHERE p.company_id = p_company_id
    ON CONFLICT (channel_id, user_id) DO NOTHING;
    
    -- Atualizar member_count
    UPDATE chat_channels
    SET member_count = (
        SELECT COUNT(*) FROM chat_channel_members WHERE channel_id = v_channel_id
    )
    WHERE id = v_channel_id;
    
    RETURN v_channel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNÇÃO: Adicionar usuário ao canal geral da empresa
-- ============================================================
CREATE OR REPLACE FUNCTION add_user_to_company_chat(p_user_id UUID, p_company_id UUID)
RETURNS VOID AS $$
DECLARE
    v_general_channel_id UUID;
BEGIN
    -- Buscar canal geral
    SELECT id INTO v_general_channel_id
    FROM chat_channels
    WHERE company_id = p_company_id
    AND is_general = true
    AND is_active = true
    LIMIT 1;
    
    -- Se não existe canal, criar
    IF v_general_channel_id IS NULL THEN
        v_general_channel_id := create_general_channel_for_company(p_company_id);
    END IF;
    
    -- Adicionar usuário ao canal
    INSERT INTO chat_channel_members (
        channel_id,
        user_id,
        role,
        joined_at
    )
    SELECT
        v_general_channel_id,
        p.user_id,
        CASE WHEN p.role = 'CLIENT_ADMIN' THEN 'admin'::chat_member_role ELSE 'member'::chat_member_role END,
        NOW()
    FROM profiles p
    WHERE p.user_id = p_user_id
    AND p.company_id = p_company_id
    ON CONFLICT (channel_id, user_id) DO NOTHING;
    
    -- Inicializar status
    INSERT INTO chat_user_status (
        user_id,
        company_id,
        status,
        last_seen_at
    ) VALUES (
        p_user_id,
        p_company_id,
        'offline',
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
