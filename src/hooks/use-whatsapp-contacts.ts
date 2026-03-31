"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WhatsAppContact } from "@/types/whatsapp";
import { toast } from "sonner";

interface UseWhatsAppContactsState {
  contacts: WhatsAppContact[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

export function useWhatsAppContacts(
  sessionId: string | null,
  search?: string
) {
  const [state, setState] = useState<UseWhatsAppContactsState>({
    contacts: [],
    loading: false,
    error: null,
    hasMore: true,
  });

  const [offset, setOffset] = useState(0);
  const supabase = createClient();

  // Busca contatos
  const fetchContacts = useCallback(
    async (reset = false) => {
      if (!sessionId) return;

      const currentOffset = reset ? 0 : offset;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const params = new URLSearchParams();
        params.append("limit", "50");
        params.append("offset", currentOffset.toString());
        if (search) params.append("search", search);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/contacts?${params}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao buscar contatos");
        }

        const contacts = await response.json();

        setState((prev) => ({
          contacts: reset ? contacts : [...prev.contacts, ...contacts],
          loading: false,
          error: null,
          hasMore: contacts.length === 50,
        }));

        if (reset) {
          setOffset(50);
        } else {
          setOffset((prev) => prev + 50);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao buscar contatos";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        toast.error(errorMessage);
      }
    },
    [sessionId, search, offset]
  );

  // Carrega mais contatos
  const loadMore = useCallback(() => {
    if (!state.loading && state.hasMore) {
      fetchContacts();
    }
  }, [fetchContacts, state.loading, state.hasMore]);

  // Recarrega contatos
  const refetch = useCallback(() => {
    setOffset(0);
    fetchContacts(true);
  }, [fetchContacts]);

  // Busca contato específico
  const getContact = useCallback(
    async (phone: string): Promise<WhatsAppContact | null> => {
      if (!sessionId) return null;

      try {
        const { data, error } = await supabase
          .from("whatsapp_contacts")
          .select("*")
          .eq("session_id", sessionId)
          .eq("phone", phone)
          .single();

        if (error) return null;
        return data as WhatsAppContact;
      } catch {
        return null;
      }
    },
    [sessionId, supabase]
  );

  // Subscreve a mudanças em tempo real
  useEffect(() => {
    if (!sessionId) return;

    const subscription = supabase
      .channel(`whatsapp-contacts-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_contacts",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          // Recarrega contatos quando houver mudanças
          refetch();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId, refetch, supabase]);

  // Carrega contatos iniciais
  useEffect(() => {
    if (sessionId) {
      setOffset(0);
      fetchContacts(true);
    }
  }, [fetchContacts, sessionId, search]);

  return {
    ...state,
    loadMore,
    refetch,
    getContact,
  };
}
