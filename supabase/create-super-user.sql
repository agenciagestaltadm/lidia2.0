-- ============================================================
-- CRIAR SUPER USUÁRIO NO SUPABASE AUTH
-- ============================================================
-- Execute este SQL no SQL Editor do Supabase
-- IMPORTANTE: Altere a senha antes de executar!

-- Criar usuário na tabela auth.users do Supabase
-- A senha precisa estar no formato bcrypt hash

-- Para gerar o hash da senha, você pode usar:
-- 1. Terminal: `node -e "console.log(require('bcrypt').hashSync('sua_senha_aqui', 10))"`
-- 2. Ou usar o site: https://bcrypt.online/
-- 3. Ou deixar que o Supabase gere via API

-- OPÇÃO 1: Inserir diretamente com hash bcrypt (recomendado)
-- Substitua 'SUA_SENHA_HASH_AQUI' pelo hash bcrypt da sua senha
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    gen_random_uuid(),  -- ou use um UUID fixo: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid
    'admin@lidia.com',  -- ALTERE PARA SEU EMAIL
    crypt('admin123', gen_salt('bf')),  -- SENHA: admin123 (altere conforme necessário)
    NOW(),  -- email já confirmado
    '{"provider":"email","providers":["email"]}',
    '{"role":"SUPER_USER","full_name":"Super Administrador"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
)
ON CONFLICT (email) DO NOTHING;

-- OPÇÃO 2: Se quiser usar um UUID fixo para facilitar referências
-- Descomente e ajuste conforme necessário:
/*
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'admin@lidia.com',
    crypt('sua_senha_aqui', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"SUPER_USER","full_name":"Super Administrador"}',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = NOW();
*/

-- Verificar se o usuário foi criado e o profile gerado automaticamente
SELECT 
    u.id as user_id,
    u.email,
    u.email_confirmed_at,
    p.id as profile_id,
    p.role,
    p.full_name
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'admin@lidia.com';
