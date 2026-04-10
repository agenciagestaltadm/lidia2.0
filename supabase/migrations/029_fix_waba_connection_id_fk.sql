-- Migration: Fix waba_connection_id FK constraints to reference waba_configs instead of waba_connections
-- Date: 2026-04-12
-- Description: The waba_connections table is never populated by the system.
-- All connection data lives in waba_configs, so the FK should reference waba_configs(id).
-- This was causing silent INSERT failures in the webhook because config.id
-- (from waba_configs) was being used as waba_connection_id which references
-- waba_connections(id) - a table with no matching rows.

-- ============================================================
-- 1. Drop existing FK constraints
-- ============================================================

-- Find and drop FK on waba_conversations.waba_connection_id
ALTER TABLE waba_conversations
  DROP CONSTRAINT IF EXISTS waba_conversations_waba_connection_id_fkey;

-- Find and drop FK on waba_messages.waba_connection_id
ALTER TABLE waba_messages
  DROP CONSTRAINT IF EXISTS waba_messages_waba_connection_id_fkey;

-- ============================================================
-- 2. Add new FK constraints referencing waba_configs(id)
-- ============================================================

ALTER TABLE waba_conversations
  ADD CONSTRAINT waba_conversations_waba_config_id_fkey
  FOREIGN KEY (waba_connection_id) REFERENCES waba_configs(id) ON DELETE SET NULL;

ALTER TABLE waba_messages
  ADD CONSTRAINT waba_messages_waba_config_id_fkey
  FOREIGN KEY (waba_connection_id) REFERENCES waba_configs(id) ON DELETE SET NULL;

-- ============================================================
-- 3. Comments
-- ============================================================
COMMENT ON CONSTRAINT waba_conversations_waba_config_id_fkey ON waba_conversations IS
  'References waba_configs since that is the primary connection table';
COMMENT ON CONSTRAINT waba_messages_waba_config_id_fkey ON waba_messages IS
  'References waba_configs since that is the primary connection table';

-- ============================================================
-- 4. Fix CHECK constraint on waba_messages.message_type
-- ============================================================
-- The original constraint only allowed: text, image, video, audio, document, location, template
-- Meta can also send: sticker, contacts, reaction, interactive
-- Without these, INSERT fails silently when those message types arrive via webhook

ALTER TABLE waba_messages
  DROP CONSTRAINT IF EXISTS waba_messages_message_type_check;

ALTER TABLE waba_messages
  ADD CONSTRAINT waba_messages_message_type_check
  CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'location', 'template', 'sticker', 'contacts', 'reaction', 'interactive'));

COMMENT ON CONSTRAINT waba_messages_message_type_check ON waba_messages IS
  'Allows all message types that Meta WhatsApp API can send';

-- ============================================================
-- 5. Fix FK on waba_webhook_logs.connection_id
-- ============================================================
-- Same issue: connection_id references waba_connections(id) but we use waba_configs.id
-- The waba_config_id column already references waba_configs correctly,
-- so we just need to fix the connection_id FK too.

ALTER TABLE waba_webhook_logs
  DROP CONSTRAINT IF EXISTS waba_webhook_logs_connection_id_fkey;

ALTER TABLE waba_webhook_logs
  ADD CONSTRAINT waba_webhook_logs_connection_id_fkey
  FOREIGN KEY (connection_id) REFERENCES waba_configs(id) ON DELETE CASCADE;

COMMENT ON CONSTRAINT waba_webhook_logs_connection_id_fkey ON waba_webhook_logs IS
  'References waba_configs since that is the primary connection table';
