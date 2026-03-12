-- ============================================================
-- INTERNAL CHAT SYSTEM - Migration 007
-- Sistema de Chat Corporativo Interno para LIDIA 2.0
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE channel_access_type AS ENUM ('public', 'private', 'restricted');
CREATE TYPE chat_message_type AS ENUM ('text', 'image', 'video', 'document', 'audio', 'system');
CREATE TYPE chat_user_status_type AS ENUM ('online', 'away', 'busy', 'offline');
CREATE TYPE chat_member_role AS ENUM ('admin', 'member');

-- ============================================================
-- TABELAS
-- ============================================================

-- Canais/Salas de conversa
CREATE TABLE chat_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type channel_access_type DEFAULT 'public',
    created_by UUID NOT NULL REFERENCES auth.users(id),
    is_general BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    member_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membros dos canais
CREATE TABLE chat_channel_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role chat_member_role DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ,
    is_muted BOOLEAN DEFAULT false,
    notification_count INTEGER DEFAULT 0,
    UNIQUE(channel_id, user_id)
);

-- Mensagens
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
    direct_recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    type chat_message_type DEFAULT 'text',
    content TEXT NOT NULL,
    content_encrypted TEXT,
    iv TEXT,
    metadata JSONB DEFAULT '{}',
    reply_to_id UUID REFERENCES chat_messages(id),
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Garante que uma mensagem pertence a um canal OU é direta
    CONSTRAINT channel_or_direct CHECK (
        (channel_id IS NOT NULL AND direct_recipient_id IS NULL) OR
        (channel_id IS NULL AND direct_recipient_id IS NOT NULL)
    )
);

-- Status de leitura das mensagens
CREATE TABLE chat_message_read_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Reações às mensagens
CREATE TABLE chat_message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Mensagens fixadas
CREATE TABLE chat_pinned_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID NOT NULL REFERENCES chat_channels(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    pinned_by UUID NOT NULL REFERENCES auth.users(id),
    pinned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_id, message_id)
);

-- Status online dos usuários
CREATE TABLE chat_user_status (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    status chat_user_status_type DEFAULT 'offline',
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    custom_status TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digitação em tempo real
CREATE TABLE chat_typing_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
    direct_recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 seconds',
    UNIQUE(channel_id, user_id),
    UNIQUE(direct_recipient_id, user_id)
);

-- Anexos
CREATE TABLE chat_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    thumbnail_path TEXT,
    duration INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX idx_chat_channels_company_id ON chat_channels(company_id);
CREATE INDEX idx_chat_channels_is_general ON chat_channels(is_general) WHERE is_general = true;
CREATE INDEX idx_chat_channels_last_message ON chat_channels(last_message_at DESC);

CREATE INDEX idx_chat_channel_members_channel_id ON chat_channel_members(channel_id);
CREATE INDEX idx_chat_channel_members_user_id ON chat_channel_members(user_id);
CREATE INDEX idx_chat_channel_members_last_read ON chat_channel_members(last_read_at);

CREATE INDEX idx_chat_messages_channel_id ON chat_messages(channel_id);
CREATE INDEX idx_chat_messages_direct_recipient ON chat_messages(direct_recipient_id, sender_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_reply_to ON chat_messages(reply_to_id);

-- Índice para busca full-text em português
CREATE INDEX idx_chat_messages_content_search ON chat_messages 
    USING gin(to_tsvector('portuguese', content));

CREATE INDEX idx_chat_user_status_company_id ON chat_user_status(company_id);
CREATE INDEX idx_chat_user_status_status ON chat_user_status(status);

CREATE INDEX idx_chat_message_read_status_message_id ON chat_message_read_status(message_id);
CREATE INDEX idx_chat_message_read_status_user_id ON chat_message_read_status(user_id);

CREATE INDEX idx_chat_message_reactions_message_id ON chat_message_reactions(message_id);

CREATE INDEX idx_chat_pinned_messages_channel_id ON chat_pinned_messages(channel_id);

CREATE INDEX idx_chat_typing_indicators_channel ON chat_typing_indicators(channel_id);
CREATE INDEX idx_chat_typing_indicators_expires ON chat_typing_indicators(expires_at);

CREATE INDEX idx_chat_attachments_message_id ON chat_attachments(message_id);

-- ============================================================
-- TRIGGERS
-- ============================================================
CREATE TRIGGER update_chat_channels_updated_at BEFORE UPDATE ON chat_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_user_status_updated_at BEFORE UPDATE ON chat_user_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar last_message_at quando uma nova mensagem é inserida
CREATE OR REPLACE FUNCTION update_channel_last_message()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.channel_id IS NOT NULL THEN
        UPDATE chat_channels 
        SET last_message_at = NEW.created_at 
        WHERE id = NEW.channel_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_channel_last_message 
    AFTER INSERT ON chat_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_channel_last_message();

-- Trigger para atualizar member_count quando membros são adicionados/removidos
CREATE OR REPLACE FUNCTION update_channel_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE chat_channels 
        SET member_count = member_count + 1 
        WHERE id = NEW.channel_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE chat_channels 
        SET member_count = member_count - 1 
        WHERE id = OLD.channel_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_member_count
    AFTER INSERT OR DELETE ON chat_channel_members
    FOR EACH ROW
    EXECUTE FUNCTION update_channel_member_count();

-- Trigger para limpar indicadores de digitação expirados
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM chat_typing_indicators WHERE expires_at < NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;

-- Políticas para chat_channels
CREATE POLICY "Users can view channels in their company" ON chat_channels
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins and managers can create channels" ON chat_channels
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND company_id = chat_channels.company_id
            AND role IN ('CLIENT_ADMIN', 'CLIENT_MANAGER', 'SUPER_USER')
        )
    );

CREATE POLICY "Admins and channel creators can update channels" ON chat_channels
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND company_id = chat_channels.company_id
            AND role IN ('CLIENT_ADMIN', 'CLIENT_MANAGER', 'SUPER_USER')
        )
        OR created_by = auth.uid()
    );

CREATE POLICY "Admins can delete channels" ON chat_channels
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND company_id = chat_channels.company_id
            AND role IN ('CLIENT_ADMIN', 'SUPER_USER')
        )
    );

-- Políticas para chat_channel_members
CREATE POLICY "Users can view members of channels they belong to" ON chat_channel_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_channel_members cm
            WHERE cm.channel_id = chat_channel_members.channel_id
            AND cm.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'SUPER_USER'
        )
    );

CREATE POLICY "Users can join public channels" ON chat_channel_members
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM chat_channels c
            WHERE c.id = channel_id
            AND c.type = 'public'
        )
    );

CREATE POLICY "Admins can add members" ON chat_channel_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_channel_members cm
            JOIN chat_channels c ON c.id = cm.channel_id
            WHERE cm.channel_id = chat_channel_members.channel_id
            AND cm.user_id = auth.uid()
            AND (cm.role = 'admin' OR EXISTS (
                SELECT 1 FROM profiles 
                WHERE user_id = auth.uid() 
                AND role IN ('CLIENT_ADMIN', 'SUPER_USER')
            ))
        )
    );

CREATE POLICY "Users can leave channels" ON chat_channel_members
    FOR DELETE USING (
        user_id = auth.uid()
    );

-- Políticas para chat_messages
CREATE POLICY "Users can view messages in their channels or direct messages" ON chat_messages
    FOR SELECT USING (
        -- Mensagem em canal que o usuário participa
        EXISTS (
            SELECT 1 FROM chat_channel_members
            WHERE chat_channel_members.channel_id = chat_messages.channel_id
            AND chat_channel_members.user_id = auth.uid()
        )
        OR
        -- Mensagem direta enviada ou recebida pelo usuário
        (chat_messages.direct_recipient_id = auth.uid() OR chat_messages.sender_id = auth.uid())
        OR
        -- Super usuário
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'SUPER_USER'
        )
    );

CREATE POLICY "Users can send messages" ON chat_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND (
            -- Canal que o usuário participa
            EXISTS (
                SELECT 1 FROM chat_channel_members
                WHERE chat_channel_members.channel_id = chat_messages.channel_id
                AND chat_channel_members.user_id = auth.uid()
            )
            OR
            -- Mensagem direta para alguém da mesma empresa
            EXISTS (
                SELECT 1 FROM profiles p1
                JOIN profiles p2 ON p1.company_id = p2.company_id
                WHERE p1.user_id = auth.uid()
                AND p2.user_id = chat_messages.direct_recipient_id
            )
        )
    );

CREATE POLICY "Users can edit their own messages" ON chat_messages
    FOR UPDATE USING (
        sender_id = auth.uid()
    );

CREATE POLICY "Users can delete their own messages" ON chat_messages
    FOR DELETE USING (
        sender_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM chat_channel_members cm
            WHERE cm.channel_id = chat_messages.channel_id
            AND cm.user_id = auth.uid()
            AND cm.role = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('CLIENT_ADMIN', 'SUPER_USER')
        )
    );

-- Políticas para chat_message_read_status
CREATE POLICY "Users can view read status of messages they can see" ON chat_message_read_status
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_messages m
            LEFT JOIN chat_channel_members cm ON cm.channel_id = m.channel_id
            WHERE m.id = chat_message_read_status.message_id
            AND (cm.user_id = auth.uid() OR m.direct_recipient_id = auth.uid() OR m.sender_id = auth.uid())
        )
    );

CREATE POLICY "Users can mark messages as read" ON chat_message_read_status
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

-- Políticas para chat_message_reactions
CREATE POLICY "Users can view reactions" ON chat_message_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_messages m
            LEFT JOIN chat_channel_members cm ON cm.channel_id = m.channel_id
            WHERE m.id = chat_message_reactions.message_id
            AND (cm.user_id = auth.uid() OR m.direct_recipient_id = auth.uid() OR m.sender_id = auth.uid())
        )
    );

CREATE POLICY "Users can add reactions" ON chat_message_reactions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM chat_messages m
            LEFT JOIN chat_channel_members cm ON cm.channel_id = m.channel_id
            WHERE m.id = chat_message_reactions.message_id
            AND (cm.user_id = auth.uid() OR m.direct_recipient_id = auth.uid())
        )
    );

CREATE POLICY "Users can remove their own reactions" ON chat_message_reactions
    FOR DELETE USING (
        user_id = auth.uid()
    );

-- Políticas para chat_pinned_messages
CREATE POLICY "Users can view pinned messages" ON chat_pinned_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_channel_members
            WHERE chat_channel_members.channel_id = chat_pinned_messages.channel_id
            AND chat_channel_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can pin messages" ON chat_pinned_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_channel_members
            WHERE chat_channel_members.channel_id = chat_pinned_messages.channel_id
            AND chat_channel_members.user_id = auth.uid()
            AND chat_channel_members.role = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('CLIENT_ADMIN', 'SUPER_USER')
        )
    );

CREATE POLICY "Admins can unpin messages" ON chat_pinned_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM chat_channel_members
            WHERE chat_channel_members.channel_id = chat_pinned_messages.channel_id
            AND chat_channel_members.user_id = auth.uid()
            AND chat_channel_members.role = 'admin'
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('CLIENT_ADMIN', 'SUPER_USER')
        )
    );

-- Políticas para chat_user_status
CREATE POLICY "Users can view status of company members" ON chat_user_status
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM profiles 
            WHERE user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = auth.uid() 
            AND role = 'SUPER_USER'
        )
    );

CREATE POLICY "Users can update their own status" ON chat_user_status
    FOR ALL USING (
        user_id = auth.uid()
    );

-- Políticas para chat_typing_indicators
CREATE POLICY "Users can view typing in their channels" ON chat_typing_indicators
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_channel_members
            WHERE chat_channel_members.channel_id = chat_typing_indicators.channel_id
            AND chat_channel_members.user_id = auth.uid()
        )
        OR chat_typing_indicators.direct_recipient_id = auth.uid()
    );

CREATE POLICY "Users can set typing indicator" ON chat_typing_indicators
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Users can clear their typing indicator" ON chat_typing_indicators
    FOR DELETE USING (
        user_id = auth.uid()
    );

-- Políticas para chat_attachments
CREATE POLICY "Users can view attachments of visible messages" ON chat_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_messages m
            LEFT JOIN chat_channel_members cm ON cm.channel_id = m.channel_id
            WHERE m.id = chat_attachments.message_id
            AND (cm.user_id = auth.uid() OR m.direct_recipient_id = auth.uid() OR m.sender_id = auth.uid())
        )
    );

-- ============================================================
-- FUNÇÕES AUXILIARES
-- ============================================================

-- Função para obter contagem de mensagens não lidas por canal
CREATE OR REPLACE FUNCTION get_unread_count(p_channel_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_last_read TIMESTAMPTZ;
    v_count INTEGER;
BEGIN
    SELECT last_read_at INTO v_last_read
    FROM chat_channel_members
    WHERE channel_id = p_channel_id AND user_id = p_user_id;
    
    IF v_last_read IS NULL THEN
        SELECT COUNT(*) INTO v_count
        FROM chat_messages
        WHERE channel_id = p_channel_id;
    ELSE
        SELECT COUNT(*) INTO v_count
        FROM chat_messages
        WHERE channel_id = p_channel_id
        AND created_at > v_last_read;
    END IF;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar mensagens
CREATE OR REPLACE FUNCTION search_messages(
    p_company_id UUID,
    p_query TEXT,
    p_channel_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_date_from TIMESTAMPTZ DEFAULT NULL,
    p_date_to TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    channel_id UUID,
    sender_id UUID,
    content TEXT,
    created_at TIMESTAMPTZ,
    rank real
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.channel_id,
        m.sender_id,
        m.content,
        m.created_at,
        ts_rank(to_tsvector('portuguese', m.content), plainto_tsquery('portuguese', p_query)) as rank
    FROM chat_messages m
    WHERE m.company_id = p_company_id
    AND (
        p_channel_id IS NULL OR m.channel_id = p_channel_id
    )
    AND (
        p_user_id IS NULL OR m.sender_id = p_user_id
    )
    AND (
        p_date_from IS NULL OR m.created_at >= p_date_from
    )
    AND (
        p_date_to IS NULL OR m.created_at <= p_date_to
    )
    AND to_tsvector('portuguese', m.content) @@ plainto_tsquery('portuguese', p_query)
    ORDER BY rank DESC, m.created_at DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

-- Criar canal geral para empresas existentes (será executado via script separado)
-- INSERT INTO chat_channels (company_id, name, description, is_general, created_by)
-- SELECT id, 'geral', 'Canal geral da empresa para comunicação interna', true, created_by
-- FROM companies WHERE is_active = true;
