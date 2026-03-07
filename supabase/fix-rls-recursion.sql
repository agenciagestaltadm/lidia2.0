-- Corrigir recursão infinita nas políticas RLS
-- Execute este SQL no Supabase SQL Editor

-- Desabilitar RLS temporariamente para empresas (apenas para teste)
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Ou, se preferir manter RLS, use estas políticas simplificadas:

-- Remover políticas existentes que podem causar recursão
DROP POLICY IF EXISTS "Users can view profiles in their company" ON profiles;
DROP POLICY IF EXISTS "Super users can manage all profiles" ON profiles;

-- Política simplificada para super users
CREATE POLICY "Super users full access" ON profiles
    FOR ALL 
    USING (auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email LIKE '%admin%' OR email LIKE '%super%'
    ));

-- Política para usuários verem seus próprios dados
CREATE POLICY "Users view own profile" ON profiles
    FOR SELECT
    USING (user_id = auth.uid());

-- Reabilitar RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Política simplificada para companies
DROP POLICY IF EXISTS "Super users can manage all companies" ON companies;
DROP POLICY IF EXISTS "Users can view their own company" ON companies;

CREATE POLICY "Allow all operations for super users" ON companies
    FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email LIKE '%admin%' OR email LIKE '%super%'
    ));

CREATE POLICY "Allow insert for authenticated" ON companies
    FOR INSERT
