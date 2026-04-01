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
  const previousPhoneRef = useRef<string | null>(null);

  // Verifica se o cache é válido
  const isCacheValid = useCallback(() => {
    const cached = messagesCache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_DURATION;
  }, [cacheKey]);

  // Busca mensagens do Supabase (fallback)
  const fetchMessagesFromSupabase = useCallback(
    async (before?: string) => {
      if (!sessionId || !phone) return [];

      try {
        const params = new URLSearchParams();
        params.append("phone", phone);
        params.append("limit", "100");
        if (before) params.append("before", before);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/messages?${params}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao buscar mensagens");
        }

        return await response.json();
      } catch (err) {
        console.error("[useWhatsAppMessages] Erro ao buscar do Supabase:", err);
        return [];
      }
    },
    [sessionId, phone]
  );

  // Busca mensagens diretamente do WhatsApp (rápido)
  const fetchMessagesFromWhatsApp = useCallback(
    async (limit: number = 50) => {
      if (!sessionId || !phone) return [];

      try {
        const params = new URLSearchParams();
        params.append("phone", phone);
        params.append("limit", limit.toString());

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/fetch-messages?${params}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao buscar mensagens do WhatsApp");
        }

        const messages = await response.json();
        console.log(`[useWhatsAppMessages] ${messages.length} mensagens carregadas do WhatsApp`);
        return messages;
      } catch (err) {
        console.error("[useWhatsAppMessages] Erro ao buscar do WhatsApp:", err);
        return [];
      }
    },
    [sessionId, phone]
  );

  // Busca mensagens com cache (tenta WhatsApp primeiro)
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

        // Tenta buscar do WhatsApp primeiro (mais rápido)
        let messages = await fetchMessagesFromWhatsApp(50);
        
        // Se não conseguiu do WhatsApp, tenta do Supabase
        if (messages.length === 0 && !before) {
          console.log("[useWhatsAppMessages] Tentando buscar do Supabase...");
          messages = await fetchMessagesFromSupabase(before);
        }

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
    [sessionId, phone, cacheKey, isCacheValid, fetchMessagesFromWhatsApp, fetchMessagesFromSupabase]
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

  // Subscrição Realtime otimizada - recebe mensagens instantaneamente via WebSocket
  useEffect(() => {
    if (!sessionId || !phone) return;

    // Canal otimizado com broadcast desabilitado para self
    const channel = supabase
      .channel(`whatsapp-messages-${sessionId}-${phone}`, {
        config: {
          broadcast: { self: false },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whatsapp_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const message = payload.new as WhatsAppMessage;
          
          if (message.contact_phone === phone) {
            setState((prev) => {
              // Deduplicação: evita mensagens duplicadas
              if (prev.messages.some(m => m.id === message.id || m.message_id === message.message_id)) {
                return prev;
              }
              
              // Adiciona mensagem mantendo ordenação por timestamp
              const newMessages = [...prev.messages, message].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
              
              console.log("[useWhatsAppMessages] Nova mensagem recebida em tempo real:", {
                id: message.id,
                content: message.content?.substring(0, 50),
                timestamp: message.timestamp,
              });
              
              return { ...prev, messages: newMessages };
            });
            
            // Limpa cache após receber nova mensagem
            messagesCache.delete(cacheKey);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "whatsapp_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const message = payload.new as WhatsAppMessage;
          
          if (message.contact_phone === phone) {
            setState((prev) => ({
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === message.id ? message : m
              ),
            }));
            console.log("[useWhatsAppMessages] Mensagem atualizada:", message.id);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "whatsapp_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const deletedId = payload.old?.id as string;
          if (deletedId) {
            setState((prev) => ({
              ...prev,
              messages: prev.messages.filter((m) => m.id !== deletedId),
            }));
            console.log("[useWhatsAppMessages] Mensagem deletada:", deletedId);
          }
        }
      );

    // Inscreve no canal
    channel.subscribe((status) => {
      console.log(`[useWhatsAppMessages] Realtime subscription status: ${status}`);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, phone, supabase, cacheKey]);

  // Sincronização inicial - apenas carga inicial, sem polling
  // As mensagens são recebidas em tempo real via Supabase Realtime
  useEffect(() => {
    if (!sessionId || !phone) return;

    // Carrega mensagens iniciais apenas se não houver cache válido
    if (!isCacheValid()) {
      fetchMessages();
    }
  }, [sessionId, phone, fetchMessages, isCacheValid]);

  // Carrega mensagens iniciais e força refresh ao trocar de conversa
  useEffect(() => {
    if (sessionId && phone) {
      // Se o telefone mudou, força refresh do cache
      if (previousPhoneRef.current !== phone) {
        messagesCache.delete(cacheKey);
        previousPhoneRef.current = phone;
        console.log('[useWhatsAppMessages] Carregando mensagens para novo contato:', phone);
        fetchMessages(undefined, true); // forceRefresh = true
      } else {
        console.log('[useWhatsAppMessages] Carregando mensagens iniciais');
        fetchMessages();
      }
    }
  }, [fetchMessages, sessionId, phone, cacheKey]);

  // Carrega mensagens antigas ao fazer scroll para cima
  const loadOlderMessages = useCallback(() => {
    if (state.messages.length > 0 && state.hasMore && !state.loading) {
      const oldestMessage = state.messages[0];
      console.log('[useWhatsAppMessages] Carregando mensagens antigas antes de:', oldestMessage.timestamp);
      fetchMessages(oldestMessage.timestamp);
    }
  }, [fetchMessages, state.messages, state.hasMore, state.loading]);

   return {
     ...state,
     sendMessage,
     sendMediaMessage,
     loadMore,
     loadOlderMessages,
     refetch: () => fetchMessages(),
     refresh,
   };
 }
