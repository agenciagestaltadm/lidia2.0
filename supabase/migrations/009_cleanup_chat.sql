-- ============================================================
-- MIGRATION 009: Limpar Tudo Relacionado ao Chat
-- ============================================================
-- Remove todos os triggers, funções e dados relacionados ao chat
-- ============================================================

-- Remover triggers
DROP TRIGGER IF EXISTS trigger_create_general_channel ON companies;
DROP TRIGGER IF EXISTS trigger_add_user_to_general_channel ON profiles;
DROP TRIGGER IF EXISTS trigger_update_chat_status_on_company_change ON profiles;
DROP TRIGGER IF EXISTS trigger_update_channel_last_message ON chat_messages;
DROP TRIGGER IF EXISTS trigger_update_member_count ON chat_channel_members;

-- Remover funções
DROP FUNCTION IF EXISTS create_general_channel_on_company_insert();
DROP FUNCTION IF EXISTS add_user_to_general_channel_on_profile_insert();
DROP FUNCTION IF EXISTS update_chat_status_on_company_change();
DROP FUNCTION IF EXISTS create_general_channel_for_company(UUID);
DROP FUNCTION IF EXISTS add_user_to_company_chat(UUID, UUID);

-- Limpar dados das tabelas de chat (opcional - descomente se quiser remover os dados)
-- DELETE FROM chat_message_reactions;
-- DELETE FROM chat_attachments;
-- DELETE FROM chat_pinned_messages;
-- DELETE FROM chat_typing_indicators;
-- DELETE FROM chat_message_read_status;
-- DELETE FROM chat_messages;
-- DELETE FROM chat_channel_members;
-- DELETE FROM chat_user_status;
-- DELETE FROM chat_channels;

-- Se quiser remover as tabelas completamente, descomente abaixo:
-- DROP TABLE IF EXISTS chat_message_reactions CASCADE;
-- DROP TABLE IF EXISTS chat_attachments CASCADE;
-- DROP TABLE IF EXISTS chat_pinned_messages CASCADE;
-- DROP TABLE IF EXISTS chat_typing_indicators CASCADE;
-- DROP TABLE IF EXISTS chat_message_read_status CASCADE;
-- DROP TABLE IF EXISTS chat_messages CASCADE;
-- DROP TABLE IF EXISTS chat_channel_members CASCADE;
-- DROP TABLE IF EXISTS chat_user_status CASCADE;
-- DROP TABLE IF EXISTS chat_channels CASCADE;

-- Remover tipo enum se não estiver mais em uso
-- DROP TYPE IF EXISTS chat_member_role CASCADE;
-- DROP TYPE IF EXISTS chat_message_type CASCADE;
-- DROP TYPE IF EXISTS chat_channel_type CASCADE;

SELECT 'Chat cleanup completed' as status;
