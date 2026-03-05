-- ============================================================
-- CORREÇÃO: Criar usuário admin quando há erro na trigger
-- ============================================================

-- Passo 1: Limpar completamente qualquer vestígio do usuário antigo
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Encontra o ID se existir
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'adminlidia@superusuario.com.br';
    
    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE 'Deletando usuário antigo: %', v_user_id;
        
        -- Deleta registros relacionados primeiro (se houver)
        DELETE FROM audit_logs WHERE actor_id = v_user_id;
        DELETE FROM contacts WHERE created_by = v_user_id;
        
        -- Deleta o perfil
        DELETE FROM profiles WHERE user_id = v_user_id;
        
        -- Deleta o usuário
        DELETE FROM auth.users WHERE id = v_user_id;
        
        RAISE NOTICE 'Usuário antigo removido';
    END IF;
END $$;

-- Passo 2: Desabilitar temporariamente a trigger de criação automática de perfil
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Passo 3: Criar o usuário manualmente (sem a trigger interferindo)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
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
        -- Este é um hash bcrypt válido para '123456Ag@'
        '$2a$10$QdXdvCFXgZ.N6E1.UJZxQOzYk1hCjCqWJHhYQ/XT/Z7JQY1EJQpC.',
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
    
    RAISE NOTICE 'Usuário criado: %', v_user_id;
    
    -- Cria o perfil manualmente
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
    
    RAISE NOTICE 'Perfil criado com sucesso!';
END $$;

-- Passo 4: Reabilitar a trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
SELECT 
    u.id as user_id,
    u.email,
    u.email_confirmed_at,
    u.created_at,
    p.id as profile_id,
    p.role,
    p.full_name,
    p.is_active
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
WHERE u.email = 'adminlidia@superusuario.com.br';
