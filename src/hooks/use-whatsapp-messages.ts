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

  const isCacheValid = useCallback(() => {
    const cached = messagesCache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_DURATION;
  }, [cacheKey]);

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

  const fetchMessages = useCallback(
    async (before?: string, forceRefresh = false) => {
      if (!sessionId || !phone) return;

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

        let messages = await fetchMessagesFromWhatsApp(50);
        
        if (messages.length === 0 && !before) {
          console.log("[useWhatsAppMessages] Tentando buscar do Supabase...");
          messages = await fetchMessagesFromSupabase(before);
        }

        const hasMore = messages.length === 50;

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
    async (
      phone: string,
      mediaBuffer: Buffer,
      mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker',
      caption?: string,
      fileName?: string
    ): Promise<boolean> => {
      if (!sessionId) return false;

      try {
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
        (payload) => {
          const message = payload.new as WhatsAppMessage;
          
          if (message.contact_phone === phone) {
            setState((prev) => {
              if (prev.messages.some(m => m.id === message.id || m.message_id === message.message_id)) {
                return prev;
              }
              
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

    channel.subscribe((status) => {
      console.log(`[useWhatsAppMessages] Realtime subscription status: ${status}`);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, phone, cacheKey]);

  useEffect(() => {
    if (!sessionId || !phone) return;

    const broadcastChannel = supabase.channel(`whatsapp-broadcast-${sessionId}`);
    broadcastChannel
      .on('broadcast', { event: 'new-message' }, (payload) => {
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

  useEffect(() => {
    if (!sessionId || !phone) return;

    if (previousPhoneRef.current !== phone) {
      messagesCache.delete(cacheKey);
      previousPhoneRef.current = phone;
      console.log('[useWhatsAppMessages] Carregando mensagens para novo contato:', phone);
      fetchMessages(undefined, true);
    } else if (!isCacheValid()) {
      console.log('[useWhatsAppMessages] Carregando mensagens iniciais');
      fetchMessages();
    }
  }, [sessionId, phone, fetchMessages, isCacheValid, cacheKey]);

  useEffect(() => {
    if (!sessionId || !phone) return;

    const interval = setInterval(async () => {
      try {
        const params = new URLSearchParams();
        params.append('phone', phone);
        params.append('limit', '10');
        if (lastMessageTimeRef.current) {
          params.append('after', lastMessageTimeRef.current);
        }

        const response = await fetch(`/api/whatsapp/sessions/${sessionId}/messages?${params}`);
        if (response.ok) {
          const newMessages = await response.json();
          if (newMessages.length > 0) {
            setState((prev) => {
              const existingIds = new Set(prev.messages.map(m => m.message_id));
              const uniqueNew = newMessages.filter((m: WhatsAppMessage) => !existingIds.has(m.message_id));
              if (uniqueNew.length === 0) return prev;

              const merged = [...prev.messages, ...uniqueNew].sort(
                (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              );
              lastMessageTimeRef.current = merged[merged.length - 1].timestamp;
              return { ...prev, messages: merged };
            });
          }
        }
      } catch (err) {
        console.error('[useWhatsAppMessages] Polling error:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId, phone]);

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
