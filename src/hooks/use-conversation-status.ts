"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseConversationStatusState {
  loading: boolean;
  error: string | null;
}

export function useConversationStatus(sessionId: string | null) {
  const [state, setState] = useState<UseConversationStatusState>({
    loading: false,
    error: null,
  });

  // Open conversation (move from pending to open)
  const openConversation = useCallback(async (phone: string): Promise<boolean> => {
    if (!sessionId || !phone) {
      toast.error("Sessão ou telefone inválido");
      return false;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `/api/whatsapp/sessions/${sessionId}/contacts/${phone}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "open" }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao abrir conversa");
      }

      toast.success("Conversa aberta");
      setState((prev) => ({ ...prev, loading: false }));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao abrir conversa";
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      toast.error(errorMessage);
      return false;
    }
  }, [sessionId]);

  // Resolve conversation (move to resolved)
  const resolveConversation = useCallback(async (phone: string): Promise<boolean> => {
    if (!sessionId || !phone) {
      toast.error("Sessão ou telefone inválido");
      return false;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `/api/whatsapp/sessions/${sessionId}/contacts/${phone}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "resolved" }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao resolver conversa");
      }

      toast.success("Conversa resolvida");
      setState((prev) => ({ ...prev, loading: false }));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao resolver conversa";
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      toast.error(errorMessage);
      return false;
    }
  }, [sessionId]);

  // Reopen conversation (move from resolved to open)
  const reopenConversation = useCallback(async (phone: string): Promise<boolean> => {
    if (!sessionId || !phone) {
      toast.error("Sessão ou telefone inválido");
      return false;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `/api/whatsapp/sessions/${sessionId}/contacts/${phone}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "open" }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao reabrir conversa");
      }

      toast.success("Conversa reaberta");
      setState((prev) => ({ ...prev, loading: false }));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao reabrir conversa";
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      toast.error(errorMessage);
      return false;
    }
  }, [sessionId]);

  // Mark conversation as read (reset unread count)
  const markAsRead = useCallback(async (phone: string): Promise<boolean> => {
    if (!sessionId || !phone) return false;

    try {
      const response = await fetch(
        `/api/whatsapp/sessions/${sessionId}/contacts/${phone}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "open" }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao marcar como lida");
      }

      return true;
    } catch (err) {
      console.error("Erro ao marcar como lida:", err);
      return false;
    }
  }, [sessionId]);

  // Get conversation status
  const getStatus = useCallback(async (phone: string): Promise<{
    status: string;
    unreadCount: number;
    hasNewMessages: boolean;
  } | null> => {
    if (!sessionId || !phone) return null;

    try {
      const response = await fetch(
        `/api/whatsapp/sessions/${sessionId}/contacts/${phone}/status`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao buscar status");
      }

      const data = await response.json();
      return {
        status: data.contact.status,
        unreadCount: data.contact.unreadCount,
        hasNewMessages: data.contact.hasNewMessages,
      };
    } catch (err) {
      console.error("Erro ao buscar status:", err);
      return null;
    }
  }, [sessionId]);

  return {
    loading: state.loading,
    error: state.error,
    openConversation,
    resolveConversation,
    reopenConversation,
    markAsRead,
    getStatus,
  };
}
