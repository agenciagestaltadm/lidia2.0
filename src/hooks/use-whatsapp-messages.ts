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

const messagesCache = new Map<string, {
  messages: WhatsAppMessage[];
  timestamp: number;
  hasMore: boolean;
}>();

const CACHE_DURATION = 5 * 60 * 1000;

export function useWhatsAppMessages(
  sessionId: string | null,
  phone: string | null
) {
  console.log('[useWhatsAppMessages] Hook called with:', { sessionId, phone });

  const [state, setState] = useState<UseWhatsAppMessagesState>({
    messages: [],
    loading: false,
    error: null,
    hasMore: true,
  });

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;
  const cacheKey = `${sessionId}-${phone}`;
  const previousPhoneRef = useRef<string | null>(null);
  const lastMessageTimeRef = useRef<string | null>(null);

  // Timeout de segurança para evitar loading infinito
  useEffect(() => {
    if (state.loading) {
      const timeout = setTimeout(() => {
        console.log('[useWhatsAppMessages] Safety timeout triggered - forcing loading to false');
        setState((prev) => ({ ...prev, loading: false, error: 'Timeout ao carregar mensagens' }));
      }, 10000); // 10 segundos timeout
      return () => clearTimeout(timeout);
    }
  }, [state.loading]);

  const isCacheValid = useCallback(() => {
    const cached = messagesCache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_DURATION;
  }, [cacheKey]);

  const fetchMessagesFromSupabase = useCallback(
    async (before?: string) => {
      if (!sessionId || !phone) return [];

      try {
        console.log(`[useWhatsAppMessages] Fetching from Supabase for phone:`, phone);
        const params = new URLSearchParams();
        params.append("phone", phone);
        params.append("limit", "100");
        if (before) params.append("before", before);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/messages?${params}`
        );

        console.log(`[useWhatsAppMessages] Supabase response status:`, response.status);

        if (!response.ok) {
          const error = await response.json();
          console.error(`[useWhatsAppMessages] Supabase API error:`, error);
          throw new Error(error.error || "Erro ao buscar mensagens");
        }

        const messages = await response.json();
        console.log(`[useWhatsAppMessages] ${messages.length} messages from Supabase`);
        return messages;
      } catch (err) {
        console.error("[useWhatsAppMessages] Erro ao buscar do Supabase:", err);
        return [];
      }
    },
    [sessionId, phone]
  );

  const fetchMessagesFromWhatsApp = useCallback(
    async (limit: number = 50) => {
      if (!sessionId || !phone) return [];

      try {
        console.log(`[useWhatsAppMessages] Fetching from WhatsApp for phone:`, phone);
        const params = new URLSearchParams();
        params.append("phone", phone);
        params.append("limit", limit.toString());

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/fetch-messages?${params}`
        );

        console.log(`[useWhatsAppMessages] WhatsApp response status:`, response.status);

        if (!response.ok) {
          const error = await response.json();
          console.error(`[useWhatsAppMessages] WhatsApp API error:`, error);
          throw new Error(error.error || "Erro ao buscar mensagens do WhatsApp");
        }

        const messages = await response.json();
        console.log(`[useWhatsAppMessages] ${messages.length} messages from WhatsApp`);
        return messages;
      } catch (err) {
        console.error("[useWhatsAppMessages] Erro ao buscar do WhatsApp:", err);
        return [];
      }
    },
    [sessionId, phone]
  );

  const fetchMessages = useCallback(
    async (before?: string, forceRefresh = false) => {
      if (!sessionId || !phone) {
        console.log('[useWhatsAppMessages] No sessionId or phone, skipping fetch');
        return;
      }

      console.log(`[useWhatsAppMessages] Fetching messages`, { before, forceRefresh });
      setState((prev) => ({ ...prev, loading: !before, error: null }));

      try {
        let messages: WhatsAppMessage[] = [];

        // Carrega do cache se válido e não for refresh forçado
        const cached = messagesCache.get(cacheKey);
        if (!forceRefresh && !before && cached) {
          console.log(`[useWhatsAppMessages] Using cached messages:`, cached.messages.length);
          messages = cached.messages;
          setState({
            messages,
            loading: false,
            error: null,
            hasMore: true,
          });
          return;
        }

        // Tenta buscar do WhatsApp primeiro (mais rápido para mensagens recentes)
        console.log('[useWhatsAppMessages] Trying WhatsApp first...');
        messages = await fetchMessagesFromWhatsApp(50);

        // Se não conseguiu do WhatsApp, busca do Supabase
        if (messages.length === 0) {
          console.log('[useWhatsAppMessages] No messages from WhatsApp, trying Supabase...');
          messages = await fetchMessagesFromSupabase(before);
        }

        setState((prev) => ({
          messages: before ? [...messages, ...prev.messages] : messages,
          loading: false,
          error: null,
          hasMore: messages.length === 50,
        }));

        // Atualiza o cache
        if (!before && messages.length > 0) {
          messagesCache.set(cacheKey, {
            messages,
            timestamp: Date.now(),
            hasMore: messages.length === 50,
          });
        }

        if (messages.length > 0) {
          const sorted = messages.sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          lastMessageTimeRef.current = sorted[sorted.length - 1].timestamp;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao buscar mensagens";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    [sessionId, phone, cacheKey, fetchMessagesFromWhatsApp, fetchMessagesFromSupabase]
  );

  const sendMessage = useCallback(
    async (data: SendMessageInput) => {
      if (!sessionId || !phone) return false;

      try {
        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/messages`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erro ao enviar mensagem");
        }

        const message = result.message;

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, message],
        }));

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

  const sendMediaMessage = useCallback(
    async (file: File, caption?: string) => {
      if (!sessionId || !phone) return false;

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (caption) formData.append("caption", caption);

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/messages`,
          {
            method: "POST",
            body: formData,
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

  const loadMore = useCallback(() => {
    if (state.messages.length > 0 && state.hasMore && !state.loading) {
      const oldestMessage = state.messages[0];
      fetchMessages(oldestMessage.timestamp);
    }
  }, [fetchMessages, state.messages, state.hasMore, state.loading]);

  const refresh = useCallback(() => {
    messagesCache.delete(cacheKey);
    fetchMessages(undefined, true);
  }, [cacheKey, fetchMessages]);

  // Subscribe to realtime messsages
  useEffect(() => {
    if (!sessionId || !phone) return;

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
        (payload: any) => {
          const message = payload.new as WhatsAppMessage;

          if (message.contact_phone === phone) {
            setState((prev) => {
              if (prev.messages.some(m => m.id === message.id || m.message_id === message.message_id)) {
                return prev;
              }

              const newMessages = [...prev.messages, message].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );

              console.log("[useWhatsAppMessages] New message via Realtime:", {
                id: message.id,
                content: message.content?.substring(0, 50),
                timestamp: message.timestamp,
              });

              return { ...prev, messages: newMessages };
            });

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
        (payload: any) => {
          const message = payload.new as WhatsAppMessage;

          if (message.contact_phone === phone) {
            setState((prev) => ({
              ...prev,
              messages: prev.messages.map((m) =>
                m.id === message.id ? message : m
              ),
            }));
            console.log("[useWhatsAppMessages] Message updated:", message.id);
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
        (payload: any) => {
          const deletedId = payload.old?.id as string;
          if (deletedId) {
            setState((prev) => ({
              ...prev,
              messages: prev.messages.filter((m) => m.id !== deletedId),
            }));
            console.log("[useWhatsAppMessages] Message deleted:", deletedId);
          }
        }
      );

    channel.subscribe((status: any) => {
      console.log(`[useWhatsAppMessages] Realtime subscription status: ${status}`);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, phone, cacheKey, supabase]);

  // Subscribe to broadcast messages
  useEffect(() => {
    if (!sessionId || !phone) return;

    const broadcastChannel = supabase.channel(`whatsapp-broadcast-${sessionId}`);
    broadcastChannel
      .on('broadcast', { event: 'new-message' }, (payload: any) => {
        const message = payload.payload as WhatsAppMessage;
        if (message.contact_phone === phone) {
          setState((prev) => {
            if (prev.messages.some(m => m.id === message.id || m.message_id === message.message_id)) {
              return prev;
            }
            const newMessages = [...prev.messages, message].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            return { ...prev, messages: newMessages };
          });
          messagesCache.delete(cacheKey);
        }
      })
      .subscribe();

    return () => {
      broadcastChannel.unsubscribe();
    };
  }, [sessionId, phone, supabase, cacheKey]);

  // Load messages on initial mount or when session/phone changes
  useEffect(() => {
    console.log('[useWhatsAppMessages] Load effect triggered:', { sessionId, phone, cacheValid: isCacheValid() });
    if (!sessionId || !phone) {
      console.log('[useWhatsAppMessages] Skipping load: no sessionId or phone');
      return;
    }

    if (previousPhoneRef.current !== phone) {
      messagesCache.delete(cacheKey);
      previousPhoneRef.current = phone;
      console.log('[useWhatsAppMessages] Loading messages for new contact:', phone);
      fetchMessages(undefined, true);
    } else if (!isCacheValid()) {
      console.log('[useWhatsAppMessages] Loading initial messages for:', phone);
      fetchMessages();
    } else {
      console.log('[useWhatsAppMessages] Using cached messages:', state.messages.length);
    }
  }, [sessionId, phone, fetchMessages, isCacheValid, cacheKey]);

  const loadOlderMessages = useCallback(() => {
    if (state.messages.length > 0 && state.hasMore && !state.loading) {
      const oldestMessage = state.messages[0];
      console.log('[useWhatsAppMessages] Loading older messages before:', oldestMessage.timestamp);
      fetchMessages(oldestMessage.timestamp);
    }
  }, [fetchMessages, state.messages, state.hasMore, state.loading]);

  return {
    messages: state.messages,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    sendMessage,
    sendMediaMessage,
    loadMore,
    loadOlderMessages,
    refetch: () => fetchMessages(),
    refresh,
  };
}
