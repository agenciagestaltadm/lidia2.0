"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WhatsAppMessage, SendMessageInput } from "@/types/whatsapp";
import { toast } from "sonner";

interface UseWhatsAppMessagesState {
  messages: WhatsAppMessage[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

// Cache global para mensagens
const messagesCache = new Map<string, {
  messages: WhatsAppMessage[];
  timestamp: number;
  hasMore: boolean;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

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
  const cacheKey = `${sessionId}-${phone}`;

  // Verifica se o cache é válido
  const isCacheValid = useCallback(() => {
    const cached = messagesCache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_DURATION;
  }, [cacheKey]);

  // Busca mensagens com cache
  const fetchMessages = useCallback(
    async (before?: string, forceRefresh = false) => {
      if (!sessionId || !phone) return;

      // Verifica cache se não for refresh forçado e não for paginação
      if (!before && !forceRefresh && isCacheValid()) {
        const cached = messagesCache.get(cacheKey);
        if (cached) {
          setState({
            messages: cached.messages,
            loading: false,
            error: null,
            hasMore: cached.hasMore,
          });
          return;
        }
      }

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
        const hasMore = messages.length === 50;

        // Atualiza cache apenas para carga inicial
        if (!before) {
          messagesCache.set(cacheKey, {
            messages,
            timestamp: Date.now(),
            hasMore,
          });
        }

        setState((prev) => ({
          messages: before
            ? [...prev.messages, ...messages]
            : messages,
          loading: false,
          error: null,
          hasMore,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao buscar mensagens";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      }
    },
    [sessionId, phone, cacheKey, isCacheValid]
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
        
        // Limpa o cache após enviar mensagem
        messagesCache.delete(cacheKey);
        
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao enviar mensagem";
        toast.error(errorMessage);
        return false;
      }
    },
    [sessionId, cacheKey]
  );

  // Envia mensagem com mídia
  const sendMediaMessage = useCallback(
    async (
      phone: string,
      mediaBuffer: Buffer,
      mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker',
      caption?: string,
      fileName?: string
    ): Promise<boolean> => {
      if (!sessionId) return false;

      try {
        // Converte Buffer para base64 para envio
        const base64Media = mediaBuffer.toString('base64');
        
        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone,
              mediaType,
              mediaUrl: `data:application/octet-stream;base64,${base64Media}`,
              caption,
              fileName,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao enviar mídia");
        }

        const message = await response.json();
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, message],
        }));
        
        // Limpa o cache após enviar mensagem
        messagesCache.delete(cacheKey);
        
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao enviar mídia";
        toast.error(errorMessage);
        return false;
      }
    },
    [sessionId, cacheKey]
  );

  // Carrega mais mensagens (paginação)
  const loadMore = useCallback(() => {
    if (state.messages.length > 0 && state.hasMore && !state.loading) {
      const oldestMessage = state.messages[0];
      fetchMessages(oldestMessage.timestamp);
    }
  }, [fetchMessages, state.messages, state.hasMore, state.loading]);

  // Força refresh do cache
  const refresh = useCallback(() => {
    messagesCache.delete(cacheKey);
    fetchMessages(undefined, true);
  }, [cacheKey, fetchMessages]);

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
    sendMediaMessage,
    loadMore,
    refetch: () => fetchMessages(),
    refresh,
  };
}
