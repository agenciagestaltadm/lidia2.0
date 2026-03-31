"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WhatsAppMessage, SendMessageInput } from "@/types/whatsapp";
import { toast } from "sonner";

interface UseWhatsAppMessagesState {
  messages: WhatsAppMessage[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

export function useWhatsAppMessages(
  sessionId: string | null,
  phone: string | null
) {
  const [state, setState] = useState<UseWhatsAppMessagesState>({
    messages: [],
    loading: false,
    error: null,
    hasMore: true,
  });

  const supabase = createClient();

  // Busca mensagens
  const fetchMessages = useCallback(
    async (before?: string) => {
      if (!sessionId || !phone) return;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const params = new URLSearchParams();
        params.append("phone", phone);
        params.append("limit", "50");
        if (before) params.append("before", before);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/messages?${params}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao buscar mensagens");
        }

        const messages = await response.json();

        setState((prev) => ({
          messages: before
            ? [...prev.messages, ...messages]
            : messages,
          loading: false,
          error: null,
          hasMore: messages.length === 50,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao buscar mensagens";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      }
    },
    [sessionId, phone]
  );

  // Envia mensagem
  const sendMessage = useCallback(
    async (input: SendMessageInput): Promise<boolean> => {
      if (!sessionId) return false;

      try {
        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao enviar mensagem");
        }

        const message = await response.json();
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, message],
        }));
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao enviar mensagem";
        toast.error(errorMessage);
        return false;
      }
    },
    [sessionId]
  );

  // Carrega mais mensagens (paginação)
  const loadMore = useCallback(() => {
    if (state.messages.length > 0) {
      const oldestMessage = state.messages[0];
      fetchMessages(oldestMessage.timestamp);
    }
  }, [fetchMessages, state.messages]);

  // Subscreve a novas mensagens em tempo real
  useEffect(() => {
    if (!sessionId || !phone) return;

    const subscription = supabase
      .channel(`whatsapp-messages-${sessionId}-${phone}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whatsapp_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMessage = payload.new as WhatsAppMessage;
          if (newMessage.contact_phone === phone) {
            setState((prev) => ({
              ...prev,
              messages: [...prev.messages, newMessage],
            }));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId, phone, supabase]);

  // Carrega mensagens iniciais
  useEffect(() => {
    if (sessionId && phone) {
      fetchMessages();
    }
  }, [fetchMessages, sessionId, phone]);

  return {
    ...state,
    sendMessage,
    loadMore,
    refetch: () => fetchMessages(),
  };
}
