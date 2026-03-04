-- ============================================================
-- CRIAR SUPER USUÁRIO VIA SQL DIRETO (MÉTODO ALTERNATIVO)
-- ============================================================
-- Se o método anterior não funcionou, use este!
-- 
-- IMPORTANTE: Este SQL insere diretamente com o formato de hash
-- que o Supabase Auth espera (bcrypt $2a$10$...)

-- MÉTODO 1: Delete se existir e recria
-- Primeiro deleta o usuário se já existir (cuidado: isso remove o profile também)
DELETE FROM auth.users WHERE email = 'adminlidia@superusuario.com.br';

-- Agora insere o novo usuário
-- O hash bcrypt abaixo foi gerado para a senha: 123456Ag@
-- Formato: $2a$10$ (bcrypt com 10 rounds)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    new_email,
    new_phone,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'adminlidia@superusuario.com.br',
    '$2a$10$abcdefghijklmnopqrstuvwxycdefghijklmnopqrstu',  -- SUBSTITUA PELO HASH REAL!
    NOW(),
    NULL,
    NULL,
    NULL,
    NULL,
    '',
    NULL,
    '',
    '',
    '',
    NULL,
    '',
    '',
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"role": "SUPER_USER", "full_name": "Super Administrador LIDIA"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    0,
    NULL,
    '',
    NULL,
    FALSE,
    NULL
);

-- Verificar resultado
SELECT 
    u.id as user_id,
    u.email,
    u.email_confirmed_at,
    p.id as profile_id,
    p.role,
    p.full_name
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'adminlidia@superusuario.com.br';

-- ============================================================
-- INSTRUÇÃO ALTERNATIVA (RECOMENDADA):
-- ============================================================
-- Se o SQL acima não funcionar, faça pelo painel do Supabase:
--
-- 1. Vá em: Authentication → Users
-- 2. Clique em: "Add user" → "Create new user"
-- 3. Preencha:
--    - Email: adminlidia@superusuario.com.br
--    - Password: 123456Ag@
--    - ✅ "Auto-confirm email" (marque esta opção)
-- 4. Clique em "Create user"
-- 5. Depois execute o SQL abaixo para tornar SUPER_USER:

/*
UPDATE profiles 
SET 
    role = 'SUPER_USER',
    full_name = 'Super Administrador LIDIA'
WHERE email = 'adminlidia@superusuario.com.br';
*/
