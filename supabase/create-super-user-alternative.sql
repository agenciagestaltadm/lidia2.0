-- ============================================================
-- CRIAR SUPER USUÁRIO VIA TABELA PROFILES (Alternativa)
-- 
-- Use este script se o outro não funcionar
-- ============================================================

-- PASSO 1: Verificar se o usuário existe no auth
-- Execute primeiro: SELECT id, email FROM auth.users WHERE email = 'seu@email.com';

-- PASSO 2: Configurar - SUBSTITUA OS VALORES ABAIXO
-- Substitua 'SEU_ID_AQUI' pelo seu UUID em TODOS os lugares
-- Substitua 'SEU_EMAIL_AQUI' pelo seu email
-- Substitua 'SEU_NOME_AQUI' pelo seu nome

-- PASSO 3: Remover da tabela super_users (se existir)
DELETE FROM super_users WHERE id = 'SEU_ID_AQUI';

-- PASSO 4: Remover da tabela profiles (se existir, para recriar)
DELETE FROM profiles WHERE user_id = 'SEU_ID_AQUI';

-- PASSO 5: Inserir como SUPER_USER na tabela profiles
INSERT INTO profiles (
    user_id, 
    email, 
    full_name, 
    role, 
    company_id, 
    is_active, 
    permissions,
    created_at,
    updated_at
) VALUES (
    'SEU_ID_AQUI',                    -- <-- SUBSTITUA PELO SEU UUID
    'SEU_EMAIL_AQUI',                 -- <-- SUBSTITUA PELO SEU EMAIL
    'SEU_NOME_AQUI',                  -- <-- SUBSTITUA PELO SEU NOME
    'SUPER_USER',                     -- Role de super usuário
    NULL,                             -- Super user não tem company_id
    true,                             -- Ativo
    '{                               -- Todas as permissões
        "canViewCentral": true,
        "canViewAttendances": true,
        "canViewContacts": true,
        "canSendBulk": true,
        "canViewKanban": true,
        "canManageConnection": true,
        "canManageUsers": true,
        "canViewSettings": true
    }'::jsonb,
    NOW(),
    NOW()
);

-- PASSO 6: Verificar se funcionou
SELECT 
    'SUPER USER CRIADO!' as status,
    p.user_id,
    p.email,
    p.full_name,
    p.role,
    p.is_active,
    'Faça logout e login novamente' as proximo_passo
FROM profiles p
WHERE p.user_id = 'SEU_ID_AQUI';

-- ============================================================
-- IMPORTANTE: 
-- 1. Substitua SEU_ID_AQUI em TODOS os lugares (4 lugares)
-- 2. Substitua SEU_EMAIL_AQUI 
-- 3. Substitua SEU_NOME_AQUI
-- 4. Execute o script completo
-- 5. Faça logout e login novamente
-- ============================================================
