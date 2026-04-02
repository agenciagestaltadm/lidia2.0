"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WhatsAppContact } from "@/types/whatsapp";
import { toast } from "sonner";

interface UseWhatsAppContactsState {
  contacts: WhatsAppContact[];
  loading: boolean;
  error: string | null;
  isSyncing: boolean;
}

export function useWhatsAppContacts(sessionId: string | null) {
  const [state, setState] = useState<UseWhatsAppContactsState>({
    contacts: [],
    loading: false,
    error: null,
    isSyncing: false,
  });

  const supabase = createClient();

  // Busca contatos do Supabase (fallback)
  const fetchContactsFromSupabase = useCallback(async () => {
    if (!sessionId) return [];

    try {
      const { data: contacts, error } = await supabase
        .from("whatsapp_contacts")
        .select("*")
        .eq("session_id", sessionId)
        .order("last_message_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return contacts || [];
    } catch (err) {
      console.error("[useWhatsAppContacts] Erro ao buscar do Supabase:", err);
      return [];
    }
  }, [sessionId, supabase]);

  // Busca contatos diretamente do WhatsApp (rápido)
  const fetchContactsFromWhatsApp = useCallback(async () => {
    if (!sessionId) return;

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/whatsapp/sessions/${sessionId}/fetch-contacts`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao buscar contatos do WhatsApp");
      }

      const contacts = await response.json();

      setState({
        contacts: contacts || [],
        loading: false,
        error: null,
        isSyncing: false,
      });

      console.log(`[useWhatsAppContacts] ${contacts.length} contatos carregados do WhatsApp`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao buscar contatos";
      
      // Tenta buscar do Supabase como fallback
      const supabaseContacts = await fetchContactsFromSupabase();
      
      setState({
        contacts: supabaseContacts,
        loading: false,
        error: supabaseContacts.length > 0 ? null : errorMessage,
        isSyncing: false,
      });
    }
  }, [sessionId, fetchContactsFromSupabase]);

  // Busca contatos (método principal - tenta WhatsApp primeiro)
  const fetchContacts = useCallback(async () => {
    if (!sessionId) return;
    
    // Tenta buscar do WhatsApp primeiro (mais rápido)
    await fetchContactsFromWhatsApp();
  }, [sessionId, fetchContactsFromWhatsApp]);

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

  return {
    ...state,
    refetch: fetchContacts,
    refetchFromWhatsApp: fetchContactsFromWhatsApp,
  };
}
