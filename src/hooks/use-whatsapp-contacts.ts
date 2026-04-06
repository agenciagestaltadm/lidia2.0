"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WhatsAppContact } from "@/types/whatsapp";
import { toast } from "sonner";

interface UseWhatsAppContactsState {
  contacts: WhatsAppContact[];
  loading: boolean;
  error: string | null;
  isSyncing: boolean;
}

export type ConversationStatus = 'open' | 'pending' | 'resolved';

export function useWhatsAppContacts(sessionId: string | null) {
  console.log('[useWhatsAppContacts] Hook called with sessionId:', sessionId);

  const [state, setState] = useState<UseWhatsAppContactsState>({
    contacts: [],
    loading: false,
    error: null,
    isSyncing: false,
  });

  const supabase = createClient();

  // Timeout de segurança para evitar loading infinito
  useEffect(() => {
    if (state.loading) {
      const timeout = setTimeout(() => {
        console.log('[useWhatsAppContacts] Safety timeout triggered - forcing loading to false');
        setState((prev) => ({ ...prev, loading: false, error: 'Timeout ao carregar contatos' }));
      }, 10000); // 10 segundos timeout
      return () => clearTimeout(timeout);
    }
  }, [state.loading]);

  // Busca contatos do Supabase (fallback)
  const fetchContactsFromSupabase = useCallback(async () => {
    if (!sessionId) return [];

    try {
      // Buscar TODOS os contatos da sessão (sem filtro de status)
      // para que os badges das abas funcionem corretamente
      const { data: contacts, error } = await supabase
        .from("whatsapp_contacts")
        .select("id, session_id, phone, name, profile_picture, status, last_message_at, is_group, group_participants, created_at, updated_at, conversation_status, opened_at, resolved_at, unread_count, has_new_messages")
        .eq("session_id", sessionId)
        .order("last_message_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Buscar últimas mensagens para os contatos
      const { data: lastMessages } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("timestamp", { ascending: false })
        .limit(1000);

      // Mapear última mensagem por contato
      const lastMessageByContact = new Map();
      lastMessages?.forEach((msg: any) => {
        if (!lastMessageByContact.has(msg.contact_phone)) {
          lastMessageByContact.set(msg.contact_phone, msg);
        }
      });

      // Adicionar last_message aos contatos
      const contactsWithLastMessage = (contacts || []).map((contact: any) => ({
        ...contact,
        last_message: lastMessageByContact.get(contact.phone) || null
      }));

      return contactsWithLastMessage;
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

      console.log(`[useWhatsAppContacts] Fetching contacts for session: ${sessionId}`);
      
      // Testa a conexão primeiro para capturar erros HTTP detalhados
      const testResponse = await fetch(`/api/whatsapp/sessions/${sessionId}/fetch-contacts`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!testResponse.ok) {
        // Tenta extrair JSON, mas se falhar, usa o texto da resposta
        let errorData: { error?: string; status?: string; details?: string } = {};
        let errorText = '';
        
        try {
          const contentType = testResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await testResponse.json();
          } else {
            errorText = await testResponse.text();
            errorData = { error: errorText || `HTTP ${testResponse.status}: ${testResponse.statusText}` };
          }
        } catch (parseError) {
          errorText = await testResponse.text().catch(() => '');
          errorData = { error: errorText || `HTTP ${testResponse.status}: ${testResponse.statusText}` };
        }
        
        console.error(`[useWhatsAppContacts] API Error Response:`, {
          status: testResponse.status,
          statusText: testResponse.statusText,
          error: errorData.error || errorData,
          details: errorData.details || errorText
        });
        
        // Se a sessão não está ativa, tenta novamente após 2 segundos
        if (errorData.status && ['waiting_qr', 'connecting', 'creating'].includes(errorData.status)) {
          console.log(`[useWhatsAppContacts] Session status is ${errorData.status}, will retry in 2s...`);
          setTimeout(() => {
            fetchContactsFromWhatsApp();
          }, 2000);
          setState((prev) => ({ ...prev, loading: false }));
          return;
        }
        
        const errorMessage = errorData.error || errorData.details || errorText || `HTTP ${testResponse.status}: ${testResponse.statusText}`;
        throw new Error(errorMessage);
      }
      
      // Se OK, faz a requisição real
      const response = await fetch(`/api/whatsapp/sessions/${sessionId}/fetch-contacts`);
      const contacts = await response.json();
      
      console.log(`[useWhatsAppContacts] ${contacts.length} contacts received from API`);

      // If API returns empty, try Supabase fallback
      if (!contacts || contacts.length === 0) {
        console.log('[useWhatsAppContacts] API returned empty, trying Supabase fallback...');
        const supabaseContacts = await fetchContactsFromSupabase();
        console.log(`[useWhatsAppContacts] ${supabaseContacts.length} contacts from Supabase fallback`);
        
        setState({
          contacts: supabaseContacts,
          loading: false,
          error: null,
          isSyncing: false,
        });
        return;
      }

      setState({
        contacts: contacts,
        loading: false,
        error: null,
        isSyncing: false,
      });

      console.log(`[useWhatsAppContacts] State updated with ${contacts.length} contacts`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao buscar contatos";
      console.error('[useWhatsAppContacts] Error:', errorMessage);
      
      // Tenta buscar do Supabase como fallback
      console.log('[useWhatsAppContacts] Error occurred, trying Supabase fallback...');
      const supabaseContacts = await fetchContactsFromSupabase();
      console.log(`[useWhatsAppContacts] ${supabaseContacts.length} contacts from Supabase fallback`);
      
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

  // Retry automático após 3 segundos se falhar
  useEffect(() => {
    if (state.error && sessionId && !state.loading) {
      console.log('[useWhatsAppContacts] Retrying in 3 seconds...');
      const timer = setTimeout(() => {
        fetchContacts();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.error, sessionId, state.loading, fetchContacts]);

  // Contadores por status (baseado em unread_count para badges)
  const counts = useMemo(() => {
    // Garante que contacts é sempre um array
    const contacts = Array.isArray(state.contacts) ? state.contacts : [];
    return {
      open: contacts.filter(c => c.conversation_status === 'open').reduce((acc, c) => acc + (c.unread_count || 0), 0),
      pending: contacts.filter(c => c.conversation_status === 'pending').reduce((acc, c) => acc + (c.unread_count || 0), 0),
      resolved: contacts.filter(c => c.conversation_status === 'resolved').reduce((acc, c) => acc + (c.unread_count || 0), 0),
    };
  }, [state.contacts]);

  return {
    contacts: state.contacts,
    loading: state.loading,
    error: state.error,
    isSyncing: state.isSyncing,
    refetch: fetchContacts,
    refetchFromWhatsApp: fetchContactsFromWhatsApp,
    counts,
  };
}
