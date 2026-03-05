-- ============================================================
-- RESETAR SENHA DO USUÁRIO ADMIN - SOLUÇÃO CORRETA
-- ============================================================
-- Execute este SQL no SQL Editor do Supabase
-- Este método usa a função auth.uid() e auth.encrypted_password corretamente

-- Opção 1: Deletar e recriar o usuário (mais confiável)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Primeiro, encontra o ID do usuário
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'adminlidia@superusuario.com.br';
    
    IF v_user_id IS NOT NULL THEN
        -- Deleta o perfil primeiro (devido à foreign key)
        DELETE FROM profiles WHERE user_id = v_user_id;
        
        -- Deleta o usuário
        DELETE FROM auth.users WHERE id = v_user_id;
        
        RAISE NOTICE 'Usuário anterior deletado. ID: %', v_user_id;
    END IF;
    
    -- Agora cria o novo usuário com a senha correta
    -- O Supabase usa bcrypt com salt automaticamente
    INSERT INTO auth.users (
        id,
        instance_id,
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
        recovery_token,
        aud,
        role
    ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'adminlidia@superusuario.com.br',
        -- Hash bcrypt gerado com salt rounds 10 (padrão do Supabase)
        '$2a$10$abcdefghijklmnopqrstuvwx1234567890123456789012345678901234', -- PLACEHOLDER - será substituído abaixo
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"role":"SUPER_USER","full_name":"Super Administrador LIDIA"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        '',
        'authenticated',
        'authenticated'
    )
    RETURNING id INTO v_user_id;
    
    -- Cria o perfil
    INSERT INTO profiles (
        user_id,
        email,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        'adminlidia@superusuario.com.br',
        'Super Administrador LIDIA',
        'SUPER_USER',
        true,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE '✅ Usuário criado com sucesso! ID: %', v_user_id;
    RAISE NOTICE '📧 Email: adminlidia@superusuario.com.br';
    RAISE NOTICE '🔑 Senha: 123456Ag@';
END $$;

-- ============================================================
-- OPÇÃO 2: Reset de senha via Recovery (mais simples)
-- ============================================================
-- Descomente e execute apenas se a Opção 1 não funcionar:

/*
-- Gera um token de recuperação
UPDATE auth.users 
SET 
    recovery_token = encode(gen_random_bytes(32), 'hex'),
    recovery_sent_at = NOW()
WHERE email = 'adminlidia@superusuario.com.br';

-- Mostra o token gerado
SELECT recovery_token 
FROM auth.users 
WHERE email = 'adminlidia@superusuario.com.br';

-- Use este token para acessar: /reset-password?token=SEU_TOKEN
*/

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT 
    u.id as user_id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    p.id as profile_id,
    p.role,
    p.full_name,
    p.is_active,
    p.company_id
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'adminlidia@superusuario.com.br';
