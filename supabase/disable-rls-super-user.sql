-- ============================================================
-- DESATIVAR RLS PARA SUPER USERS - LOGIN EM QUALQUER DISPOSITIVO
-- ============================================================
-- Este script desativa o RLS da tabela super_users para permitir
-- que o super usuário faça login de qualquer navegador ou dispositivo
-- sem restrições de política
-- ============================================================

-- 1. Desativar RLS na tabela super_users completamente
-- Isso permite acesso total sem verificação de políticas
ALTER TABLE super_users DISABLE ROW LEVEL SECURITY;

-- 2. Verificar status do RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'super_users';

-- 3. Opcional: Remover todas as políticas existentes da tabela
DROP POLICY IF EXISTS "Super users can view all" ON super_users;
DROP POLICY IF EXISTS "Allow authenticated users to read super_users" ON super_users;
DROP POLICY IF EXISTS "Allow super users to manage all" ON super_users;
DROP POLICY IF EXISTS "Super users can view all super users" ON super_users;

-- 4. Verificar se o super usuário existe
SELECT 
    '✅ Super user encontrado!' as status,
    id,
    email,
    name,
    is_active,
    last_login_at,
    created_at
FROM super_users
LIMIT 5;

-- ============================================================
-- INSTRUÇÕES DE USO:
-- ============================================================
-- 1. Execute este SQL no SQL Editor do Supabase Dashboard
-- 2. Faça o login novamente como super usuário
-- 3. O RLS desativado permite login de qualquer dispositivo/navegador
--
-- ⚠️ NOTA DE SEGURANÇA:
-- Desativar o RLS significa que qualquer pessoa com acesso ao banco
-- pode ler/modificar a tabela super_users. Em produção, considere
-- reativar o RLS com políticas adequadas após resolver o problema.
-- ============================================================
