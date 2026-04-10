-- Migration: Fix RLS policies for waba_configs to allow all authenticated users from same company
-- Date: 2026-04-10
-- Description: The INSERT policy was too restrictive (CLIENT_ADMIN only), causing empty {} errors
-- when non-admin users tried to create WABA connections. This adds a more permissive policy.

-- Remove the restrictive INSERT policy
DROP POLICY IF EXISTS "Admins can insert company waba configs" ON waba_configs;

-- Add a more permissive INSERT policy - any authenticated user from the same company can insert
CREATE POLICY "Users can insert company waba configs"
    ON waba_configs FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR profiles.company_id = waba_configs.company_id
            )
        )
    );

-- Also relax the UPDATE policy
DROP POLICY IF EXISTS "Admins can update company waba configs" ON waba_configs;

CREATE POLICY "Users can update company waba configs"
    ON waba_configs FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND (
                profiles.role = 'SUPER_USER'
                OR profiles.company_id = waba_configs.company_id
            )
        )
    );

-- Comment
COMMENT ON POLICY "Users can insert company waba configs" ON waba_configs IS 'Any authenticated user from the same company can insert WABA configs';
COMMENT ON POLICY "Users can update company waba configs" ON waba_configs IS 'Any authenticated user from the same company can update WABA configs';
