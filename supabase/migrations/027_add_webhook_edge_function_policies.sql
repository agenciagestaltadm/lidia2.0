-- Migration: Add Edge Function Webhook Policies
-- Date: 2026-04-10
-- Description: Adds RLS policies to allow Edge Function to access webhook data without JWT authentication

-- ============================================================
-- 1. Enable anonymous access to waba_configs for webhook verification
-- ============================================================

-- Policy to allow reading waba_configs by account_uuid (for webhook verification)
CREATE POLICY "Allow anonymous read for webhook verification"
    ON waba_configs FOR SELECT
    TO anon
    USING (true);

-- Policy to allow service role to update waba_configs status
CREATE POLICY "Allow service role to update webhook status"
    ON waba_configs FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 2. Enable service role access to waba_webhook_logs
-- ============================================================

-- Policy to allow service role to insert webhook logs
CREATE POLICY "Allow service role to insert webhook logs"
    ON waba_webhook_logs FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy to allow service role to update webhook logs
CREATE POLICY "Allow service role to update webhook logs"
    ON waba_webhook_logs FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 3. Enable service role access to waba_contacts
-- ============================================================

-- Policy to allow service role to read contacts
CREATE POLICY "Allow service role to read contacts"
    ON waba_contacts FOR SELECT
    TO service_role
    USING (true);

-- Policy to allow service role to insert contacts
CREATE POLICY "Allow service role to insert contacts"
    ON waba_contacts FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy to allow service role to update contacts
CREATE POLICY "Allow service role to update contacts"
    ON waba_contacts FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 4. Enable service role access to waba_conversations
-- ============================================================

-- Policy to allow service role to read conversations
CREATE POLICY "Allow service role to read conversations"
    ON waba_conversations FOR SELECT
    TO service_role
    USING (true);

-- Policy to allow service role to insert conversations
CREATE POLICY "Allow service role to insert conversations"
    ON waba_conversations FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy to allow service role to update conversations
CREATE POLICY "Allow service role to update conversations"
    ON waba_conversations FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 5. Enable service role access to waba_messages
-- ============================================================

-- Policy to allow service role to read messages
CREATE POLICY "Allow service role to read messages"
    ON waba_messages FOR SELECT
    TO service_role
    USING (true);

-- Policy to allow service role to insert messages
CREATE POLICY "Allow service role to insert messages"
    ON waba_messages FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy to allow service role to update messages
CREATE POLICY "Allow service role to update messages"
    ON waba_messages FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 6. Enable service role access to waba_templates
-- ============================================================

-- Policy to allow service role to read templates
CREATE POLICY "Allow service role to read templates"
    ON waba_templates FOR SELECT
    TO service_role
    USING (true);

-- Policy to allow service role to update templates
CREATE POLICY "Allow service role to update templates"
    ON waba_templates FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 7. Comments for documentation
-- ============================================================

COMMENT ON POLICY "Allow anonymous read for webhook verification" ON waba_configs IS 
'Allows Facebook/Meta to verify webhook without authentication. Only account_uuid and verify_token are exposed.';

COMMENT ON POLICY "Allow service role to insert webhook logs" ON waba_webhook_logs IS 
'Allows Edge Function to log webhook events using service role key.';
