-- ============================================================
-- MIGRATION 012: Configuração Manual do Chat
-- ============================================================
-- Este migration configura o chat interno manualmente para
-- empresas e usuários existentes sem usar triggers automáticos
-- ============================================================

-- ============================================================
-- 1. Criar canais gerais para empresas que não têm
-- ============================================================
DO $$
DECLARE
    v_company RECORD;
    v_channel_id UUID;
    v_admin_id UUID;
BEGIN
    FOR v_company IN 
        SELECT c.id, c.name
        FROM companies c
        WHERE c.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM chat_channels ch 
            WHERE ch.company_id = c.id 
            AND ch.is_general = true
        )
    LOOP
        -- Buscar primeiro usuário da empresa
        SELECT user_id INTO v_admin_id
        FROM profiles
        WHERE company_id = v_company.id
        ORDER BY created_at ASC
        LIMIT 1;
        
        -- Criar canal geral
        INSERT INTO chat_channels (
            company_id,
            name,
            description,
            type,
            created_by,
            is_general,
            is_active,
            member_count
        )
        VALUES (
            v_company.id,
            'geral',
            'Canal geral da empresa para comunicação interna',
            'public',
            v_admin_id,
            true,
            true,
            (SELECT COUNT(*) FROM profiles WHERE company_id = v_company.id)
        )
        RETURNING id INTO v_channel_id;
        
        RAISE NOTICE 'Canal criado para empresa %: %', v_company.name, v_channel_id;
    END LOOP;
END $$;

-- ============================================================
-- 2. Adicionar todos os usuários aos canais gerais
-- ============================================================
INSERT INTO chat_channel_members (
    channel_id,
    user_id,
    role,
    joined_at
)
SELECT
    ch.id,
    p.user_id,
    CASE WHEN p.role = 'CLIENT_ADMIN' THEN 'admin'::chat_member_role ELSE 'member'::chat_member_role END,
    NOW()
FROM chat_channels ch
JOIN profiles p ON p.company_id = ch.company_id
WHERE ch.is_general = true
ON CONFLICT (channel_id, user_id) DO NOTHING;

-- ============================================================
-- 3. Inicializar status de usuários
-- ============================================================
INSERT INTO chat_user_status (
    user_id,
    company_id,
    status,
    last_seen_at
)
SELECT
    p.user_id,
    p.company_id,
    'offline',
    NOW()
FROM profiles p
WHERE p.company_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 4. Criar mensagem de boas-vindas
-- ============================================================
INSERT INTO chat_messages (
    channel_id,
    sender_id,
    content,
    type,
    company_id
)
SELECT
    ch.id,
    (SELECT user_id FROM profiles WHERE company_id = ch.company_id ORDER BY created_at ASC LIMIT 1),
    '👋 Bem-vindo ao chat interno da empresa! Aqui você pode se comunicar com todos os membros da equipe.',
    'text',
    ch.company_id
FROM chat_channels ch
WHERE ch.is_general = true
AND NOT EXISTS (
    SELECT 1 FROM chat_messages m WHERE m.channel_id = ch.id
)
AND EXISTS (
    SELECT 1 FROM profiles WHERE company_id = ch.company_id LIMIT 1
);

-- ============================================================
-- 5. Atualizar last_message_at e member_count
-- ============================================================
UPDATE chat_channels ch
SET 
    last_message_at = (
        SELECT MAX(created_at) 
        FROM chat_messages m 
        WHERE m.channel_id = ch.id
    ),
    member_count = (
        SELECT COUNT(*) 
        FROM chat_channel_members cm 
        WHERE cm.channel_id = ch.id
    )
WHERE ch.is_general = true;

-- ============================================================
-- Resumo
-- ============================================================
SELECT 
    'Canais criados' as metric,
    COUNT(*) as count
FROM chat_channels 
WHERE is_general = true
UNION ALL
SELECT 
    'Membros em canais' as metric,
    COUNT(*)
FROM chat_channel_members
UNION ALL
SELECT 
    'Status inicializados' as metric,
    COUNT(*)
FROM chat_user_status;
