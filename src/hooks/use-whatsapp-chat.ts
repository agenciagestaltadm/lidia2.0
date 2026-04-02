"use client";

import { useState, useEffect, useCallback, useRef, useReducer } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WhatsAppMessage, SendMessageInput } from "@/types/whatsapp";
import { toast } from "sonner";

// ============================================================
// TIPOS E INTERFACES
// ============================================================

interface MessageState {
  messages: WhatsAppMessage[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  pageNumber: number;
}

type MessageAction =
  | { type: "LOAD_MESSAGES"; payload: WhatsAppMessage[] }
  | { type: "ADD_MESSAGE"; payload: WhatsAppMessage }
  | { type: "UPDATE_MESSAGE"; payload: WhatsAppMessage }
  | { type: "DELETE_MESSAGE"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_LOADING_MORE"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_HAS_MORE"; payload: boolean }
  | { type: "INCREMENT_PAGE" }
  | { type: "RESET"; payload?: WhatsAppMessage[] };

// ============================================================
// REDUCER - Baseado na estratégia do MessagesList/index.js
// ============================================================

const messageReducer = (state: MessageState, action: MessageAction): MessageState => {
  switch (action.type) {
    case "LOAD_MESSAGES": {
      const newMessages = action.payload;
      const updatedMessages = [...state.messages];

      newMessages.forEach((message) => {
        const index = updatedMessages.findIndex((m) => m.id === message.id);
        if (index !== -1) {
          updatedMessages[index] = message;
        } else {
          updatedMessages.push(message);
        }
      });

      // Ordena por timestamp
      updatedMessages.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      return {
        ...state,
        messages: updatedMessages,
        loading: false,
        loadingMore: false,
      };
    }

    case "ADD_MESSAGE": {
      const newMessage = action.payload;
      const exists = state.messages.some(
        (m) => m.id === newMessage.id || m.message_id === newMessage.message_id
      );

      if (exists) {
        return state;
      }

      const updatedMessages = [...state.messages, newMessage].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      return {
        ...state,
        messages: updatedMessages,
      };
    }

    case "UPDATE_MESSAGE": {
      const updatedMessage = action.payload;
      return {
        ...state,
        messages: state.messages.map((m) =>
          m.id === updatedMessage.id ? updatedMessage : m
        ),
      };
    }

    case "DELETE_MESSAGE": {
      const messageId = action.payload;
      return {
        ...state,
        messages: state.messages.filter((m) => m.id !== messageId),
      };
    }

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_LOADING_MORE":
      return { ...state, loadingMore: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false, loadingMore: false };

    case "SET_HAS_MORE":
      return { ...state, hasMore: action.payload };

    case "INCREMENT_PAGE":
      return { ...state, pageNumber: state.pageNumber + 1 };

    case "RESET":
      return {
        messages: action.payload || [],
        loading: false,
        loadingMore: false,
        error: null,
        hasMore: true,
        pageNumber: 1,
      };

    default:
      return state;
  }
};

// ============================================================
// CACHE GLOBAL - Mesma estratégia do arquivo de atualização
// ============================================================

interface CacheEntry {
  messages: WhatsAppMessage[];
  timestamp: number;
  hasMore: boolean;
}

const messagesCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// ============================================================
// HOOK PRINCIPAL
// ============================================================

export function useWhatsAppChat(
  sessionId: string | null,
  phone: string | null
) {
  const cacheKey = `${sessionId}-${phone}`;
  const previousPhoneRef = useRef<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [state, dispatch] = useReducer(messageReducer, {
    messages: [],
    loading: false,
    loadingMore: false,
    error: null,
    hasMore: true,
    pageNumber: 1,
  });

  // ============================================================
  // VERIFICAÇÃO DE CACHE
  // ============================================================

  const isCacheValid = useCallback(() => {
    const cached = messagesCache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_DURATION;
  }, [cacheKey]);

  // ============================================================
  // FETCH MENSAGENS - Estratégia similar ao arquivo de atualização
  // ============================================================

  const fetchMessages = useCallback(
    async (before?: string, forceRefresh = false) => {
      if (!sessionId || !phone) return;

      console.log(`[useWhatsAppChat] Fetching messages`, { before, forceRefresh });

      if (!before) {
        dispatch({ type: "SET_LOADING", payload: true });
      } else {
        dispatch({ type: "SET_LOADING_MORE", payload: true });
      }

      try {
        // Usa cache se válido e não for refresh forçado
        const cached = messagesCache.get(cacheKey);
        if (!forceRefresh && !before && cached) {
          console.log(`[useWhatsAppChat] Using cached messages:`, cached.messages.length);
          dispatch({ type: "RESET", payload: cached.messages });
          dispatch({ type: "SET_HAS_MORE", payload: cached.hasMore });
          return;
        }

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

        const messages: WhatsAppMessage[] = await response.json();
        console.log(`[useWhatsAppChat] ${messages.length} messages fetched`);

        if (before) {
          // Carregando mensagens antigas (prepend)
          dispatch({ type: "LOAD_MESSAGES", payload: messages });
        } else {
          // Carregamento inicial
          dispatch({ type: "RESET", payload: messages });
        }

        dispatch({ type: "SET_HAS_MORE", payload: messages.length === 50 });

        // Atualiza cache
        if (!before && messages.length > 0) {
          messagesCache.set(cacheKey, {
            messages,
            timestamp: Date.now(),
            hasMore: messages.length === 50,
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao buscar mensagens";
        dispatch({ type: "SET_ERROR", payload: errorMessage });
        console.error("[useWhatsAppChat] Error fetching messages:", err);
      }
    },
    [sessionId, phone, cacheKey]
  );

  // ============================================================
  // CARREGAR MAIS MENSAGENS (PAGINAÇÃO)
  // ============================================================

  const loadMore = useCallback(() => {
    if (state.loadingMore || !state.hasMore || state.messages.length === 0) return;

    const oldestMessage = state.messages[0];
    dispatch({ type: "INCREMENT_PAGE" });
    fetchMessages(oldestMessage.timestamp);
  }, [state.loadingMore, state.hasMore, state.messages, fetchMessages]);

  // ============================================================
  // SSE - SERVER SENT EVENTS (similar ao Socket.IO do arquivo)
  // ============================================================

  useEffect(() => {
    if (!sessionId || !phone) {
      // Limpa EventSource se desconectar
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    console.log(`[useWhatsAppChat] Starting SSE for session: ${sessionId}, phone: ${phone}`);

    const params = new URLSearchParams();
    params.append("phone", phone);

    const eventSource = new EventSource(
      `/api/whatsapp/sessions/${sessionId}/stream?${params}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log(`[useWhatsAppChat] SSE connected`);
    };

    eventSource.addEventListener("connected", (event) => {
      console.log(`[useWhatsAppChat] SSE connected event:`, event.data);
    });

    eventSource.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log(`[useWhatsAppChat] New message via SSE:`, message.id);

        dispatch({ type: "ADD_MESSAGE", payload: message });

        // Invalida cache
        messagesCache.delete(cacheKey);
      } catch (error) {
        console.error("[useWhatsAppChat] Error parsing SSE message:", error);
      }
    });

    eventSource.addEventListener("contact", (event) => {
      // Pode ser usado para atualizar info do contato
      console.log(`[useWhatsAppChat] Contact update via SSE:`, event.data);
    });

    eventSource.onerror = (error) => {
      console.error("[useWhatsAppChat] SSE error:", error);
      // Tenta reconectar após 3 segundos
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          console.log("[useWhatsAppChat] Attempting SSE reconnection...");
        }
      }, 3000);
    };

    return () => {
      console.log(`[useWhatsAppChat] Closing SSE`);
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [sessionId, phone, cacheKey]);

  // ============================================================
  // SUPABASE REALTIME (fallback/adicional)
  // ============================================================

  useEffect(() => {
    if (!sessionId || !phone) return;

    const channel = supabase
      .channel(`whatsapp-chat-${sessionId}-${phone}`, {
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
            dispatch({ type: "ADD_MESSAGE", payload: message });
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
            dispatch({ type: "UPDATE_MESSAGE", payload: message });
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
            dispatch({ type: "DELETE_MESSAGE", payload: deletedId });
          }
        }
      );

    channel.subscribe((status) => {
      console.log(`[useWhatsAppChat] Realtime subscription status: ${status}`);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [sessionId, phone, cacheKey, supabase]);

  // ============================================================
  // CARREGAMENTO INICIAL
  // ============================================================

  useEffect(() => {
    if (!sessionId || !phone) {
      dispatch({ type: "RESET" });
      return;
    }

    // Se mudou o telefone, limpa e recarrega
    if (previousPhoneRef.current !== phone) {
      messagesCache.delete(cacheKey);
      previousPhoneRef.current = phone;
      fetchMessages(undefined, true);
    } else if (!isCacheValid()) {
      fetchMessages();
    }
  }, [sessionId, phone, fetchMessages, isCacheValid, cacheKey]);

  // ============================================================
  // ENVIO DE MENSAGEM
  // ============================================================

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

        // Adiciona mensagem enviada ao estado
        if (result) {
          dispatch({ type: "ADD_MESSAGE", payload: result });
          messagesCache.delete(cacheKey);
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao enviar mensagem";
        toast.error(errorMessage);
        return false;
      }
    },
    [sessionId, phone, cacheKey]
  );

  // ============================================================
  // REFRESH MANUAL
  // ============================================================

  const refresh = useCallback(() => {
    messagesCache.delete(cacheKey);
    fetchMessages(undefined, true);
  }, [cacheKey, fetchMessages]);

  return {
    messages: state.messages,
    loading: state.loading,
    loadingMore: state.loadingMore,
    error: state.error,
    hasMore: state.hasMore,
    sendMessage,
    loadMore,
    refresh,
  };
}
