-- ============================================================
-- Migration 006: Auto Email Verification + Admin Functions
-- ============================================================
-- Este migration adiciona funções para:
-- 1. Verificação automática de email ao criar usuários via admin
-- 2. Deleção segura de usuários (rollback)
-- 3. Obtenção de roles disponíveis por empresa (para filtros)
-- ============================================================

-- ============================================================
-- Função 1: Verificar email de usuário automaticamente (admin only)
-- ============================================================
-- Usada quando um super usuário cria um novo usuário via painel admin
-- Define email_confirmed_at para permitir login imediato
CREATE OR REPLACE FUNCTION admin_confirm_user_email(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
    caller_role public.user_role;
BEGIN
    -- Verificar se quem chamou é SUPER_USER
    SELECT role INTO caller_role
    FROM public.profiles
    WHERE profiles.user_id = auth.uid();
    
    IF caller_role IS NULL OR caller_role != 'SUPER_USER' THEN
        RAISE EXCEPTION 'Permissão negada: Apenas super usuários podem verificar emails automaticamente';
    END IF;
    
    -- Verificar se o usuário existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    -- Atualizar email_confirmed_at na tabela auth.users
    UPDATE auth.users
    SET email_confirmed_at = NOW(),
        updated_at = NOW(),
        confirmation_token = NULL,  -- Limpar token de confirmação
        confirmation_sent_at = NULL  -- Limpar data de envio
    WHERE id = user_id;
    
    -- Registrar em audit_logs
    INSERT INTO public.audit_logs (action, actor_id, target_id, target_type, metadata)
    VALUES (
        'USER_EMAIL_AUTO_VERIFIED',
        auth.uid(),
        user_id,
        'user',
        jsonb_build_object(
            'verified_at', NOW(),
            'verified_by', auth.uid()
        )
    );
END;
$$;

-- ============================================================
-- Função 2: Deletar usuário (usada em rollback)
-- ============================================================
-- Usada para fazer rollback se a criação do profile falhar
CREATE OR REPLACE FUNCTION admin_delete_user(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
    caller_role public.user_role;
BEGIN
    -- Verificar permissões
    SELECT role INTO caller_role
    FROM public.profiles
    WHERE profiles.user_id = auth.uid();
    
    IF caller_role IS NULL OR caller_role != 'SUPER_USER' THEN
        RAISE EXCEPTION 'Permissão negada: Apenas super usuários podem deletar usuários';
    END IF;
    
    -- Verificar se o usuário existe
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
        RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
    
    -- Registrar ação antes de deletar
    INSERT INTO public.audit_logs (action, actor_id, target_id, target_type, metadata)
    VALUES (
        'USER_DELETED_BY_ADMIN',
        auth.uid(),
        user_id,
        'user',
        jsonb_build_object(
            'deleted_at', NOW(),
            'deleted_by', auth.uid()
        )
    );
    
    -- Deletar da auth.users (cascade deleta profiles via trigger)
    DELETE FROM auth.users WHERE id = user_id;
END;
$$;

-- ============================================================
-- Função 3: Obter roles disponíveis para uma empresa
-- ============================================================
-- Retorna as roles que existem em uma empresa específica
-- Útil para popular dropdown de filtros dependentes
CREATE OR REPLACE FUNCTION get_company_roles(company_uuid UUID)
RETURNS TABLE(role public.user_role, role_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    caller_role public.user_role;
    caller_company_id UUID;
BEGIN
    -- Verificar permissões do caller
    SELECT p.role, p.company_id 
    INTO caller_role, caller_company_id
    FROM profiles p
    WHERE p.user_id = auth.uid();
    
    -- Apenas SUPER_USER pode ver roles de qualquer empresa
    -- Usuários normais só podem ver da própria empresa
    IF caller_role != 'SUPER_USER' THEN
        IF caller_company_id IS NULL OR caller_company_id != company_uuid THEN
            RAISE EXCEPTION 'Permissão negada: Você só pode visualizar roles da sua empresa';
        END IF;
    END IF;
    
    -- Retornar contagem de usuários por role na empresa
    RETURN QUERY
    SELECT 
        p.role,
        COUNT(*)::BIGINT as role_count
    FROM profiles p
    WHERE p.company_id = company_uuid
      AND p.role != 'SUPER_USER'
    GROUP BY p.role
    ORDER BY role_count DESC;
END;
$$;

-- ============================================================
-- Função 4: Verificar se email está confirmado
-- ============================================================
CREATE OR REPLACE FUNCTION is_email_confirmed(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth
AS $$
DECLARE
    confirmed_at TIMESTAMPTZ;
BEGIN
    SELECT email_confirmed_at INTO confirmed_at
    FROM auth.users
    WHERE id = user_uuid;
    
    RETURN confirmed_at IS NOT NULL;
END;
$$;

-- ============================================================
-- Grant execute permissions
-- ============================================================
GRANT EXECUTE ON FUNCTION admin_confirm_user_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_roles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_email_confirmed(UUID) TO authenticated;

-- ============================================================
-- Comentários para documentação
-- ============================================================
COMMENT ON FUNCTION admin_confirm_user_email(UUID) IS 
'Verifica automaticamente o email de um usuário criado via painel admin.
Apenas SUPER_USER pode executar esta função.
Usada para permitir login imediato sem confirmação por email.';

COMMENT ON FUNCTION admin_delete_user(UUID) IS 
'Deleta um usuário do sistema.
Apenas SUPER_USER pode executar esta função.
Usada para rollback quando criação de profile falha.';

COMMENT ON FUNCTION get_company_roles(UUID) IS 
'Retorna as roles disponíveis em uma empresa específica com contagem de usuários.
SUPER_USER pode consultar qualquer empresa, usuários normais apenas a própria.';

COMMENT ON FUNCTION is_email_confirmed(UUID) IS 
'Verifica se o email de um usuário está confirmado.
Retorna TRUE se email_confirmed_at não for NULL.';
