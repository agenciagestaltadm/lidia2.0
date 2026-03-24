-- Migration: Create kanban_card_contacts table for associating contacts with cards
-- Created: 2026-03-24

-- Create table for card contacts
CREATE TABLE IF NOT EXISTS public.kanban_card_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES public.kanban_cards(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    UNIQUE(card_id, contact_id)
);

-- Enable RLS
ALTER TABLE public.kanban_card_contacts ENABLE ROW LEVEL SECURITY;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_kanban_card_contacts_card_id ON public.kanban_card_contacts(card_id);
CREATE INDEX IF NOT EXISTS idx_kanban_card_contacts_contact_id ON public.kanban_card_contacts(contact_id);

-- RLS Policies - Fixed to avoid recursion by using proper joins
CREATE POLICY "Users can view card contacts for their company" 
    ON public.kanban_card_contacts 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.kanban_cards c
            JOIN public.kanban_columns col ON col.id = c.column_id
            JOIN public.kanban_boards b ON b.id = col.board_id
            JOIN public.profiles p ON p.company_id = b.company_id
            WHERE c.id = kanban_card_contacts.card_id
            AND p.id = auth.uid()
        )
    );

CREATE POLICY "Users can add contacts to cards in their company" 
    ON public.kanban_card_contacts 
    FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.kanban_cards c
            JOIN public.kanban_columns col ON col.id = c.column_id
            JOIN public.kanban_boards b ON b.id = col.board_id
            JOIN public.profiles p ON p.company_id = b.company_id
            WHERE c.id = kanban_card_contacts.card_id
            AND p.id = auth.uid()
        )
    );

CREATE POLICY "Users can remove contacts from cards in their company" 
    ON public.kanban_card_contacts 
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.kanban_cards c
            JOIN public.kanban_columns col ON col.id = c.column_id
            JOIN public.kanban_boards b ON b.id = col.board_id
            JOIN public.profiles p ON p.company_id = b.company_id
            WHERE c.id = kanban_card_contacts.card_id
            AND p.id = auth.uid()
        )
    );

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_card_contacts;

