-- ============================================================
-- MIGRATION 010: Inicializar Chat para Empresas Existentes
-- ============================================================
-- Este migration cria canais gerais e adiciona membros para
-- empresas que já existiam antes da implementação do chat
-- ============================================================

-- Criar canal geral para empresas que ainda não têm
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
SELECT
    c.id,
    'geral',
    'Canal geral da empresa para comunicação interna',
    'public',
    COALESCE(
        (SELECT user_id FROM profiles WHERE company_id = c.id AND role = 'CLIENT_ADMIN' LIMIT 1),
        (SELECT user_id FROM profiles WHERE company_id = c.id LIMIT 1),
        NULL
    ),
    true,
    true,
    (SELECT COUNT(*) FROM profiles WHERE company_id = c.id)
FROM companies c
WHERE c.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM chat_channels ch
    WHERE ch.company_id = c.id
    AND ch.is_general = true
);

-- Adicionar todos os usuários da empresa como membros do canal geral
INSERT INTO chat_channel_members (
    channel_id,
    user_id,
    role,
    joined_at
)
SELECT
    ch.id,
    p.user_id,
    CASE 
        WHEN p.role = 'CLIENT_ADMIN' THEN 'admin'::chat_member_role
        ELSE 'member'::chat_member_role
    END,
    NOW()
FROM chat_channels ch
JOIN companies c ON c.id = ch.company_id
JOIN profiles p ON p.company_id = c.id
WHERE ch.is_general = true
AND NOT EXISTS (
    SELECT 1 FROM chat_channel_members cm
    WHERE cm.channel_id = ch.id
    AND cm.user_id = p.user_id
);

-- Inicializar status online para todos os usuários
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
AND NOT EXISTS (
    SELECT 1 FROM chat_user_status s
    WHERE s.user_id = p.user_id
);

-- Criar mensagem de boas-vindas no canal geral
INSERT INTO chat_messages (
    channel_id,
    sender_id,
    content,
    type,
    company_id
)
SELECT
    ch.id,
    COALESCE(
        ch.created_by,
        (SELECT user_id FROM profiles WHERE company_id = ch.company_id LIMIT 1)
    ),
    '👋 Bem-vindo ao chat interno da empresa! Aqui você pode se comunicar com todos os membros da equipe.',
    'text',
    ch.company_id
FROM chat_channels ch
WHERE ch.is_general = true
AND NOT EXISTS (
    SELECT 1 FROM chat_messages m
    WHERE m.channel_id = ch.id
)
AND EXISTS (
    SELECT 1 FROM profiles WHERE company_id = ch.company_id LIMIT 1
);

-- Atualizar last_message_at nos canais
UPDATE chat_channels ch
SET last_message_at = (
    SELECT MAX(created_at) 
    FROM chat_messages m 
    WHERE m.channel_id = ch.id
)
WHERE ch.is_general = true;
