-- ============================================================
-- MIGRATION 008: Criar canais gerais para empresas existentes
-- ============================================================

-- Criar canal geral para empresas que ainda não têm
INSERT INTO chat_channels (company_id, name, description, is_general, created_by, type)
SELECT 
    c.id,
    'geral',
    'Canal geral da empresa para comunicação interna',
    true,
    p.user_id,
    'public'
FROM companies c
JOIN profiles p ON p.company_id = c.id AND p.role = 'CLIENT_ADMIN'
WHERE c.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM chat_channels ch 
    WHERE ch.company_id = c.id 
    AND ch.is_general = true
)
ON CONFLICT DO NOTHING;

-- Adicionar todos os usuários da empresa como membros do canal geral
INSERT INTO chat_channel_members (channel_id, user_id, role, joined_at)
SELECT 
    ch.id,
    p.user_id,
    CASE WHEN p.role = 'CLIENT_ADMIN' THEN 'admin'::chat_member_role ELSE 'member'::chat_member_role END,
    NOW()
FROM chat_channels ch
JOIN companies c ON c.id = ch.company_id
JOIN profiles p ON p.company_id = c.id
WHERE ch.is_general = true
AND NOT EXISTS (
    SELECT 1 FROM chat_channel_members cm 
    WHERE cm.channel_id = ch.id 
    AND cm.user_id = p.user_id
)
ON CONFLICT DO NOTHING;

-- Inicializar status online para usuários existentes (apenas quem tem company_id)
INSERT INTO chat_user_status (user_id, company_id, status, last_seen_at)
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
)
ON CONFLICT DO NOTHING;
