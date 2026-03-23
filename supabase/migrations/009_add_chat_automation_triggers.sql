-- ============================================================
-- MIGRATION 009: Automação de Chat - Triggers para criação automática
-- ============================================================
-- Este migration cria triggers que automatizam:
-- 1. Criação de canal geral quando uma nova empresa é criada
-- 2. Adição automática de novos usuários ao canal geral da empresa
-- 3. Inicialização automática do status de chat para novos usuários
-- ============================================================

-- ============================================================
-- FUNÇÃO: Criar canal geral quando empresa é criada
-- ============================================================
CREATE OR REPLACE FUNCTION create_general_channel_on_company_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_admin_user_id UUID;
BEGIN
    -- Buscar o usuário que criou a empresa (admin)
    SELECT user_id INTO v_admin_user_id
    FROM profiles
    WHERE company_id = NEW.id
    AND role = 'CLIENT_ADMIN'
    LIMIT 1;
    
    -- Se não encontrou admin, tenta qualquer usuário da empresa
    IF v_admin_user_id IS NULL THEN
        SELECT user_id INTO v_admin_user_id
        FROM profiles
        WHERE company_id = NEW.id
        LIMIT 1;
    END IF;
    
    -- Criar canal geral
    INSERT INTO chat_channels (
        company_id,
        name,
        description,
        type,
        created_by,
        is_general,
        is_active
    ) VALUES (
        NEW.id,
        'geral',
        'Canal geral da empresa para comunicação interna',
        'public',
        v_admin_user_id,
        true,
        true
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar canal geral quando empresa é criada
DROP TRIGGER IF EXISTS trigger_create_general_channel ON companies;
CREATE TRIGGER trigger_create_general_channel
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION create_general_channel_on_company_insert();

-- ============================================================
-- FUNÇÃO: Adicionar usuário ao canal geral quando perfil é criado
-- ============================================================
CREATE OR REPLACE FUNCTION add_user_to_general_channel_on_profile_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_general_channel_id UUID;
BEGIN
    -- Só processa se o usuário tem company_id
    IF NEW.company_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Buscar o canal geral da empresa
    SELECT id INTO v_general_channel_id
    FROM chat_channels
    WHERE company_id = NEW.company_id
    AND is_general = true
    AND is_active = true
    LIMIT 1;
    
    -- Se existe canal geral, adicionar usuário como membro
    IF v_general_channel_id IS NOT NULL THEN
        INSERT INTO chat_channel_members (
            channel_id,
            user_id,
            role,
            joined_at
        ) VALUES (
            v_general_channel_id,
            NEW.user_id,
            CASE WHEN NEW.role = 'CLIENT_ADMIN' THEN 'admin'::chat_member_role ELSE 'member'::chat_member_role END,
            NOW()
        )
        ON CONFLICT (channel_id, user_id) DO NOTHING;
        
        -- Inicializar status online do usuário
        INSERT INTO chat_user_status (
            user_id,
            company_id,
            status,
            last_seen_at
        ) VALUES (
            NEW.user_id,
            NEW.company_id,
            'offline',
            NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para adicionar usuário ao canal geral quando perfil é criado
DROP TRIGGER IF EXISTS trigger_add_user_to_general_channel ON profiles;
CREATE TRIGGER trigger_add_user_to_general_channel
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION add_user_to_general_channel_on_profile_insert();

-- ============================================================
-- FUNÇÃO: Atualizar company_id no status quando perfil é atualizado
-- ============================================================
CREATE OR REPLACE FUNCTION update_chat_status_on_company_change()
RETURNS TRIGGER AS $$
DECLARE
    v_general_channel_id UUID;
BEGIN
    -- Se company_id mudou
    IF OLD.company_id IS DISTINCT FROM NEW.company_id THEN
        -- Se tem nova empresa
        IF NEW.company_id IS NOT NULL THEN
            -- Buscar canal geral da nova empresa
            SELECT id INTO v_general_channel_id
            FROM chat_channels
            WHERE company_id = NEW.company_id
            AND is_general = true
            AND is_active = true
            LIMIT 1;
            
            -- Adicionar ao canal geral da nova empresa
            IF v_general_channel_id IS NOT NULL THEN
                INSERT INTO chat_channel_members (
                    channel_id,
                    user_id,
                    role,
                    joined_at
                ) VALUES (
                    v_general_channel_id,
                    NEW.user_id,
                    CASE WHEN NEW.role = 'CLIENT_ADMIN' THEN 'admin'::chat_member_role ELSE 'member'::chat_member_role END,
                    NOW()
                )
                ON CONFLICT (channel_id, user_id) DO NOTHING;
            END IF;
            
            -- Atualizar ou criar status na nova empresa
            INSERT INTO chat_user_status (
                user_id,
                company_id,
                status,
                last_seen_at
            ) VALUES (
                NEW.user_id,
                NEW.company_id,
                'offline',
                NOW()
            )
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                company_id = EXCLUDED.company_id,
                status = 'offline',
                last_seen_at = NOW();
        END IF;
        
        -- Se saiu de uma empresa, manter nos canais antigos (histórico)
        -- Mas atualizar status para não aparecer mais online na empresa antiga
        IF OLD.company_id IS NOT NULL THEN
            UPDATE chat_user_status
            SET status = 'offline',
                last_seen_at = NOW()
            WHERE user_id = NEW.user_id
            AND company_id = OLD.company_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para atualizar status quando company_id muda
DROP TRIGGER IF EXISTS trigger_update_chat_status_on_company_change ON profiles;
CREATE TRIGGER trigger_update_chat_status_on_company_change
    AFTER UPDATE OF company_id ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_status_on_company_change();

-- ============================================================
-- FUNÇÃO: Criar DM (conversa direta) se não existir
-- ============================================================
CREATE OR REPLACE FUNCTION ensure_dm_channel_exists()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
    v_existing_dm UUID;
BEGIN
    -- Só processa mensagens diretas (não canais)
    IF NEW.channel_id IS NOT NULL OR NEW.direct_recipient_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Buscar company_id do remetente
    SELECT company_id INTO v_company_id
    FROM profiles
    WHERE user_id = NEW.sender_id;
    
    -- Verificar se já existe DM entre esses usuários
    SELECT c.id INTO v_existing_dm
    FROM chat_channels c
    JOIN chat_channel_members cm1 ON cm1.channel_id = c.id
    JOIN chat_channel_members cm2 ON cm2.channel_id = c.id
    WHERE c.type = 'private'
    AND c.is_active = true
    AND c.company_id = v_company_id
    AND cm1.user_id = NEW.sender_id
    AND cm2.user_id = NEW.direct_recipient_id
    AND (
        SELECT COUNT(*) 
        FROM chat_channel_members 
        WHERE channel_id = c.id
    ) = 2
    LIMIT 1;
    
    -- Se não existe DM, criar um novo canal privado
    IF v_existing_dm IS NULL THEN
        -- Criar canal
        INSERT INTO chat_channels (
            company_id,
            name,
            description,
            type,
            created_by,
            is_general,
            is_active
        ) VALUES (
            v_company_id,
            'dm_' || NEW.sender_id::text || '_' || NEW.direct_recipient_id::text,
            'Conversa direta',
            'private',
            NEW.sender_id,
            false,
            true
        )
        RETURNING id INTO v_existing_dm;
        
        -- Adicionar ambos os usuários como membros
        INSERT INTO chat_channel_members (channel_id, user_id, role, joined_at)
        VALUES 
            (v_existing_dm, NEW.sender_id, 'member', NOW()),
            (v_existing_dm, NEW.direct_recipient_id, 'member', NOW())
        ON CONFLICT (channel_id, user_id) DO NOTHING;
    END IF;
    
    -- Atualizar a mensagem para usar o channel_id encontrado/criado
    NEW.channel_id := v_existing_dm;
    NEW.direct_recipient_id := NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar DM automaticamente (opcional - desabilitado por padrão)
-- Se quiser ativar, descomente:
-- DROP TRIGGER IF EXISTS trigger_ensure_dm ON chat_messages;
-- CREATE TRIGGER trigger_ensure_dm
--     BEFORE INSERT ON chat_messages
--     FOR EACH ROW
--     WHEN (NEW.channel_id IS NULL AND NEW.direct_recipient_id IS NOT NULL)
--     EXECUTE FUNCTION ensure_dm_channel_exists();

-- ============================================================
-- FUNÇÃO: Atualizar última mensagem do canal
-- ============================================================
CREATE OR REPLACE FUNCTION update_channel_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_channels
    SET last_message_at = NEW.created_at
    WHERE id = NEW.channel_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar última mensagem
DROP TRIGGER IF EXISTS trigger_update_channel_last_message ON chat_messages;
CREATE TRIGGER trigger_update_channel_last_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_channel_last_message();

-- ============================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- ============================================================

-- Índice para buscar canais gerais rapidamente
CREATE INDEX IF NOT EXISTS idx_chat_channels_general 
ON chat_channels(company_id, is_general) 
WHERE is_general = true AND is_active = true;

-- Índice para buscar DMs entre usuários
CREATE INDEX IF NOT EXISTS idx_chat_channels_dm 
ON chat_channels(company_id, type) 
WHERE type = 'private' AND is_active = true;

-- Índice para mensagens por data
CREATE INDEX IF NOT EXISTS idx_chat_messages_created 
ON chat_messages(channel_id, created_at DESC);

-- Índice para busca full-text (se ainda não existir)
CREATE INDEX IF NOT EXISTS idx_chat_messages_content_search 
ON chat_messages USING gin(to_tsvector('portuguese', content));

-- ============================================================
-- COMENTÁRIOS DOCUMENTANDO AS FUNÇÕES
-- ============================================================

COMMENT ON FUNCTION create_general_channel_on_company_insert() IS 
'Cria automaticamente um canal geral quando uma nova empresa é registrada no sistema';

COMMENT ON FUNCTION add_user_to_general_channel_on_profile_insert() IS 
'Adiciona automaticamente novos usuários ao canal geral da empresa quando seu perfil é criado';

COMMENT ON FUNCTION update_chat_status_on_company_change() IS 
'Atualiza o status de chat do usuário quando ele muda de empresa';

COMMENT ON FUNCTION ensure_dm_channel_exists() IS 
'Garante que uma conversa direta (DM) existe entre dois usuários antes de enviar mensagem';

-- ============================================================
-- FIM DA MIGRATION
-- ============================================================
