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

export function useWhatsAppContacts(sessionId: string | null) {
  const [state, setState] = useState<UseWhatsAppContactsState>({
    contacts: [],
    loading: false,
    error: null,
  });

  const supabase = createClient();

  // Busca contatos
  const fetchContacts = useCallback(async () => {
    if (!sessionId) return;

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { data: contacts, error } = await supabase
        .from("whatsapp_contacts")
        .select("*")
        .eq("session_id", sessionId)
        .order("last_message_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setState({
        contacts: contacts || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao buscar contatos";
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, [sessionId, supabase]);

  // Subscreve a mudanças em tempo real nos contatos
  useEffect(() => {
    if (!sessionId) return;

    // Busca inicial
    fetchContacts();

    // Subscreve a mudanças
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
          console.log("[useWhatsAppContacts] Mudança detectada:", payload);

          if (payload.eventType === "INSERT") {
            const newContact = payload.new as WhatsAppContact;
            setState((prev) => ({
              ...prev,
              contacts: [newContact, ...prev.contacts],
            }));
          } else if (payload.eventType === "UPDATE") {
            const updatedContact = payload.new as WhatsAppContact;
            setState((prev) => ({
              ...prev,
              contacts: prev.contacts
                .map((c) => (c.id === updatedContact.id ? updatedContact : c))
                .sort(
                  (a, b) =>
                    new Date(b.last_message_at || 0).getTime() -
                    new Date(a.last_message_at || 0).getTime()
                ),
            }));
          } else if (payload.eventType === "DELETE") {
            const deletedContact = payload.old as WhatsAppContact;
            setState((prev) => ({
              ...prev,
              contacts: prev.contacts.filter((c) => c.id !== deletedContact.id),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId, supabase, fetchContacts]);

  // Polling para atualizar contatos a cada 5 segundos
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(() => {
      fetchContacts();
    }, 5000); // 5 segundos

    return () => clearInterval(interval);
  }, [sessionId, fetchContacts]);

  return {
    ...state,
    refetch: fetchContacts,
  };
}
