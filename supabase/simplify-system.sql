-- ============================================================
-- SIMPLIFICAR SISTEMA LIDIA - LOGIN BÁSICO
-- ============================================================
-- Este SQL remove a complexidade de SUPER_USER e deixa o sistema simples:
-- 1. Remove trigger problemática
-- 2. Limpa usuários antigos
-- 3. Cria estrutura mínima para login funcionar
-- ============================================================

-- Passo 1: Remover a trigger que cria perfil automaticamente
-- (Vamos criar perfis manualmente no dashboard)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Passo 2: Limpar usuários e perfis antigos (opcional - remova se quiser manter dados)
-- DELETE FROM public.profiles;
-- DELETE FROM auth.users WHERE email != 'seu-email@exemplo.com'; -- mantenha seu usuário se existir

-- Passo 3: Criar função simples para criar perfil (sem ser trigger)
CREATE OR REPLACE FUNCTION public.create_user_profile(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_role user_role DEFAULT 'CLIENT_AGENT'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, role, is_active)
    VALUES (p_user_id, p_email, p_full_name, p_role, true)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        is_active = true,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Passo 4: Garantir que a tabela profiles existe e está correta
-- (Se já existir, não faz nada)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'CLIENT_AGENT',
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    last_sign_in_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Passo 5: Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = user_id);

-- Política: usuários podem atualizar apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = user_id);

-- Política: admins podem ver todos os perfis (para gerenciamento no dashboard)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
    ON public.profiles FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('SUPER_USER', 'CLIENT_ADMIN')
        )
    );

-- ============================================================
-- INSTRUÇÕES DE USO
-- ============================================================

-- APÓS executar este SQL, faça:

-- 1. CRIAR USUÁRIO NO PAINEL SUPABASE:
--    - Vá em Authentication → Users
--    - Clique "Add user" → "Create new user"
--    - Digite email e senha
--    - Marque "Auto-confirm email"
--    - Clique "Create user"

-- 2. CRIAR PERFIL DO USUÁRIO (execute no SQL Editor):
/*
SELECT public.create_user_profile(
    'UUID-DO-USUARIO-AQUI',           -- substitua pelo UUID do usuário criado
    'email@usuario.com',               -- email do usuário
    'Nome do Usuário',                 -- nome completo
    'CLIENT_ADMIN'                     -- role: SUPER_USER, CLIENT_ADMIN, CLIENT_AGENT, CLIENT_VIEWER
);
*/

-- 3. VERIFICAR SE FUNCIONA:
--    - Tente fazer login com o email e senha criados
--    - Deve redirecionar para /app/central

-- ============================================================
-- EXEMPLO: Criar primeiro usuário admin (substitua os valores)
-- ============================================================
/*
-- Primeiro crie o usuário no painel, depois execute:
SELECT public.create_user_profile(
    '00000000-0000-0000-0000-000000000000',  -- UUID do usuário
    'admin@empresa.com',                      -- email
    'Administrador',                          -- nome
    'CLIENT_ADMIN'                            -- role
);
*/

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
SELECT 
    'Sistema simplificado com sucesso!' as status,
    COUNT(*) as total_profiles
FROM public.profiles;
