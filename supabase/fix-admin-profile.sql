-- ============================================================
-- CORREÇÃO: CRIAR SUPER USUÁRIO ADMIN LIDIA COM PERFIL
-- ============================================================
-- Execute este SQL no SQL Editor do Supabase
-- Este script garante que tanto o usuário quanto o perfil sejam criados

DO $$
DECLARE
    v_user_id UUID;
    v_profile_id UUID;
BEGIN
    -- Verifica se o usuário já existe
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'adminlidia@superusuario.com.br';
    
    IF v_user_id IS NULL THEN
        -- Cria novo usuário
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
            gen_random_uuid(),
            'adminlidia@superusuario.com.br',
            crypt('123456Ag@', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"role":"SUPER_USER","full_name":"Super Administrador LIDIA"}',
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        )
        RETURNING id INTO v_user_id;
        
        RAISE NOTICE 'Usuário criado com sucesso! ID: %', v_user_id;
    ELSE
        -- Atualiza usuário existente
        UPDATE auth.users SET
            encrypted_password = crypt('123456Ag@', gen_salt('bf')),
            raw_user_meta_data = '{"role":"SUPER_USER","full_name":"Super Administrador LIDIA"}',
            updated_at = NOW()
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Usuário atualizado com sucesso! ID: %', v_user_id;
    END IF;
    
    -- Verifica se o perfil existe
    SELECT id INTO v_profile_id FROM profiles WHERE user_id = v_user_id;
    
    IF v_profile_id IS NULL THEN
        -- Cria o perfil explicitamente (caso a trigger não tenha funcionado)
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
        )
        RETURNING id INTO v_profile_id;
        
        RAISE NOTICE 'Perfil criado com sucesso! ID: %', v_profile_id;
    ELSE
        -- Atualiza o perfil existente
        UPDATE profiles SET
            role = 'SUPER_USER',
            full_name = 'Super Administrador LIDIA',
            email = 'adminlidia@superusuario.com.br',
            is_active = true,
            updated_at = NOW()
        WHERE id = v_profile_id;
        
        RAISE NOTICE 'Perfil atualizado com sucesso! ID: %', v_profile_id;
    END IF;
END $$;

-- Verificar se o usuário e perfil foram criados/atualizados corretamente
SELECT 
    u.id as user_id,
    u.email,
    u.email_confirmed_at,
    p.id as profile_id,
    p.user_id as profile_user_id,
    p.role,
    p.full_name,
    p.is_active,
    p.created_at as profile_created_at
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'adminlidia@superusuario.com.br';
