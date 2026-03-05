-- ============================================================
-- CRIAR USUÁRIO ADMIN - SEM DESABILITAR TRIGGERS
-- ============================================================
-- Este SQL não requer permissões especiais de owner

-- Passo 1: Limpar usuário e perfil antigos (se existirem)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Encontra o ID do usuário se existir
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'adminlidia@superusuario.com.br';
    
    IF v_user_id IS NOT NULL THEN
        -- Deleta o perfil primeiro (devido à FK)
        DELETE FROM public.profiles WHERE user_id = v_user_id;
        
        -- Deleta o usuário
        DELETE FROM auth.users WHERE id = v_user_id;
        
        RAISE NOTICE '✅ Usuário antigo removido: %', v_user_id;
    ELSE
        RAISE NOTICE 'ℹ️ Nenhum usuário antigo encontrado';
    END IF;
END $$;

-- Passo 2: Criar usuário DEIXANDO a trigger criar o perfil automaticamente
-- A trigger vai inserir na tabela profiles com valores default
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
        -- Hash bcrypt válido para '123456Ag@' (gerado com salt 10)
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
    
    RAISE NOTICE '✅ Usuário criado: %', v_user_id;
END $$;

-- Passo 3: Atualizar o perfil criado pela trigger com os dados corretos
UPDATE public.profiles 
SET 
    role = 'SUPER_USER',
    full_name = 'Super Administrador LIDIA',
    is_active = true
WHERE email = 'adminlidia@superusuario.com.br';

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================
SELECT 
    u.id as user_id,
    u.email,
    u.email_confirmed_at,
    p.id as profile_id,
    p.role,
    p.full_name,
    p.is_active
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE u.email = 'adminlidia@superusuario.com.br';
