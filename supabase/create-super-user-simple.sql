-- ============================================================
-- CRIAR SUPER USUÁRIO - VERSÃO FINAL
-- 
-- INSTRUÇÕES:
-- 1. Pegue seu ID: SELECT id, email FROM auth.users WHERE email = 'seu@email.com';
-- 2. Substitua 'SEU_ID_AQUI' pelo seu UUID em todos os lugares abaixo
-- 3. Substitua 'SEU_EMAIL_AQUI' pelo seu email
-- 4. Substitua 'SEU_NOME_AQUI' pelo seu nome
-- 5. Execute este script
-- ============================================================

-- PASSO 1: Criar tabela super_users (se não existir)
CREATE TABLE IF NOT EXISTS super_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE super_users ENABLE ROW LEVEL SECURITY;

-- Política para super_users
DROP POLICY IF EXISTS "Super users can view all" ON super_users;
CREATE POLICY "Super users can view all" ON super_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM super_users su 
            WHERE su.id = auth.uid()
        )
    );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_super_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_super_users_updated_at ON super_users;
CREATE TRIGGER update_super_users_updated_at 
    BEFORE UPDATE ON super_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_super_users_updated_at();

-- PASSO 2: REMOVER DA TABELA PROFILES
-- Substitua 'SEU_ID_AQUI' pelo seu UUID
DELETE FROM profiles WHERE user_id = 'SEU_ID_AQUI';

-- PASSO 3: REMOVER DA TABELA SUPER_USERS (para recriar)
-- Substitua 'SEU_ID_AQUI' pelo seu UUID
DELETE FROM super_users WHERE id = 'SEU_ID_AQUI';

-- PASSO 4: INSERIR COMO SUPER USUÁRIO
-- Substitua os 3 valores abaixo mantendo as aspas simples
INSERT INTO super_users (id, email, name, is_active, created_at)
VALUES (
    'SEU_ID_AQUI',           -- <-- SUBSTITUA PELO SEU UUID
    'SEU_EMAIL_AQUI',        -- <-- SUBSTITUA PELO SEU EMAIL
    'SEU_NOME_AQUI',         -- <-- SUBSTITUA PELO SEU NOME
    true,
    NOW()
);

-- PASSO 5: VERIFICAR SE FUNCIONOU
-- Substitua 'SEU_ID_AQUI' pelo seu UUID
SELECT 
    'SUPER USER CRIADO!' as status,
    s.id,
    s.email,
    s.name,
    s.is_active,
    'Faça logout e login novamente' as proximo_passo
FROM super_users s
WHERE s.id = 'SEU_ID_AQUI';

-- ============================================================
-- IMPORTANTE: APÓS EXECUTAR, FAÇA LOGOUT E LOGIN NOVAMENTE
-- O sistema vai detectar automaticamente que você é SUPER_USER
-- ============================================================
