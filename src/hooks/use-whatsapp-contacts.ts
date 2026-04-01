"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WhatsAppContact } from "@/types/whatsapp";
import { toast } from "sonner";

interface UseWhatsAppContactsState {
  contacts: WhatsAppContact[];
  loading: boolean;
  error: string | null;
}

// Cache global para contatos
const contactsCache = new Map<string, {
  contacts: WhatsAppContact[];
  timestamp: number;
}>();

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

export function useWhatsAppContacts(
  sessionId: string | null
) {
  const [state, setState] = useState<UseWhatsAppContactsState>({
    contacts: [],
    loading: false,
    error: null,
  });

  const supabase = createClient();
  const cacheKey = `contacts-${sessionId}`;

  // Verifica se o cache é válido
  const isCacheValid = useCallback(() => {
    const cached = contactsCache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_DURATION;
  }, [cacheKey]);

  // Busca contatos com cache
  const fetchContacts = useCallback(
    async (forceRefresh = false) => {
      if (!sessionId) return;

      // Verifica cache se não for refresh forçado
      if (!forceRefresh && isCacheValid()) {
        const cached = contactsCache.get(cacheKey);
        if (cached) {
          setState({
            contacts: cached.contacts,
            loading: false,
            error: null,
          });
          return;
        }
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/contacts`
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao buscar contatos");
        }

        const contacts = await response.json();

        // Atualiza cache
        contactsCache.set(cacheKey, {
          contacts,
          timestamp: Date.now(),
        });

        setState({
          contacts,
          loading: false,
          error: null,
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao buscar contatos";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      }
    },
    [sessionId, cacheKey, isCacheValid]
  );

  // Sincroniza contatos do WhatsApp
  const syncContacts = useCallback(async (): Promise<boolean> => {
    if (!sessionId) return false;

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch(
        `/api/whatsapp/sessions/${sessionId}/contacts/sync`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao sincronizar contatos");
      }

      const contacts = await response.json();

      // Atualiza cache
      contactsCache.set(cacheKey, {
        contacts,
        timestamp: Date.now(),
      });

      setState({
        contacts,
        loading: false,
        error: null,
      });

      toast.success("Contatos sincronizados com sucesso!");
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao sincronizar contatos";
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      toast.error(errorMessage);
      return false;
    }
  }, [sessionId, cacheKey]);

  // Força refresh do cache
  const refresh = useCallback(() => {
    contactsCache.delete(cacheKey);
    fetchContacts(true);
  }, [cacheKey, fetchContacts]);

  // Subscreve a atualizações de contatos em tempo real
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
        (payload) => {
          // Limpa o cache quando há mudanças
          contactsCache.delete(cacheKey);
          // Recarrega os contatos
          fetchContacts(true);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId, cacheKey, fetchContacts, supabase]);

  // Carrega contatos iniciais
  useEffect(() => {
    if (sessionId) {
      fetchContacts();
    }
  }, [fetchContacts, sessionId]);

  return {
    ...state,
    fetchContacts,
    syncContacts,
    refresh,
  };
}
