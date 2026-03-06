-- ============================================================
-- CRIAR SUPER USUÁRIO RÁPIDO
-- 
-- Instruções:
-- 1. Substitua 'SEU_EMAIL_AQUI' pelo seu email
-- 2. Substitua 'SEU_USER_ID' pelo ID do usuário (veja abaixo como pegar)
-- 3. Execute no SQL Editor do Supabase
-- ============================================================

-- COMO PEGAR SEU USER ID:
-- Execute primeiro: SELECT id, email FROM auth.users WHERE email = 'seu@email.com';
-- O valor da coluna "id" é o seu USER_ID

-- ============================================================
-- PASSO 1: CRIAR TABELA super_users (se não existir)
-- ============================================================
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

-- Criar política para super_users
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

-- ============================================================
-- PASSO 2: CRIAR SUPER USUÁRIO - MUDE AQUI
-- ============================================================
DO $$
DECLARE
  v_user_id UUID := 'SEU_USER_ID_AQUI';  -- <-- COLE SEU USER ID AQUI (ex: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
  v_email TEXT := 'SEU_EMAIL_AQUI';       -- <-- COLE SEU EMAIL AQUI (ex: 'admin@exemplo.com')
  v_name TEXT := 'Administrador';          -- <-- MUDE SEU NOME SE QUISER
BEGIN

  -- Verificar se user_id foi preenchido
  IF v_user_id = 'SEU_USER_ID_AQUI' THEN
    RAISE EXCEPTION 'Você precisa preencher o SEU_USER_ID_AQUI no script!';
  END IF;
  
  IF v_email = 'SEU_EMAIL_AQUI' THEN
    RAISE EXCEPTION 'Você precisa preencher o SEU_EMAIL_AQUI no script!';
  END IF;

  -- 1. Remover da tabela profiles (se existir)
  DELETE FROM profiles WHERE user_id = v_user_id;
  
  -- 2. Remover da tabela super_users (se existir, para recriar)
  DELETE FROM super_users WHERE id = v_user_id;
  
  -- 3. Inserir na tabela super_users
  INSERT INTO super_users (id, email, name, is_active, created_at)
  VALUES (v_user_id, v_email, v_name, true, NOW());
  
  -- 4. Atualizar metadata no auth.users
  UPDATE auth.users 
  SET user_metadata = '{"role": "SUPER_USER"}'::jsonb
  WHERE id = v_user_id;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Super usuário criado com sucesso!';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'ID: %', v_user_id;
  RAISE NOTICE '========================================';
  
END $$;

-- ============================================================
-- PASSO 3: VERIFICAR SE FUNCIONOU
-- ============================================================
SELECT 
  'SUPER USER' as tipo,
  s.id,
  s.email,
  s.name,
  s.is_active,
  au.user_metadata->>'role' as metadata_role,
  'Execute agora: SELECT id, email FROM auth.users WHERE email = ''' || s.email || ''';' as verificacao
FROM super_users s
JOIN auth.users au ON s.id = au.id
WHERE s.id = 'SEU_USER_ID_AQUI';  -- <-- MUDE PARA SEU USER ID OU REMOVA O WHERE PARA VER TODOS
