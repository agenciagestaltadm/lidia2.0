"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WhatsAppSession, CreateSessionInput } from "@/types/whatsapp";
import { toast } from "sonner";

interface UseWhatsAppSessionsState {
  sessions: WhatsAppSession[];
  loading: boolean;
  error: string | null;
}

export function useWhatsAppSessions() {
  const [state, setState] = useState<UseWhatsAppSessionsState>({
    sessions: [],
    loading: true,
    error: null,
  });

  const supabase = createClient();

  // Busca sessões
  const fetchSessions = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch("/api/whatsapp/sessions");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao buscar sessões");
      }

      const sessions = await response.json();
      setState({ sessions, loading: false, error: null });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao buscar sessões";
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      toast.error(errorMessage);
    }
  }, []);

  // Cria nova sessão
  const createSession = useCallback(
    async (input: CreateSessionInput): Promise<WhatsAppSession | null> => {
      try {
        console.log("[WhatsApp] Criando sessão:", input);
        const response = await fetch("/api/whatsapp/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });

        console.log("[WhatsApp] Status da resposta:", response.status);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
          }
          console.error("[WhatsApp] Erro na resposta:", errorData);
          throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        const session = await response.json();
        console.log("[WhatsApp] Sessão criada:", session);
        setState((prev) => ({
          ...prev,
          sessions: [session, ...prev.sessions],
        }));
        toast.success("Conexão criada com sucesso!");
        return session;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao criar sessão";
        console.error("[WhatsApp] Erro ao criar sessão:", err);
        toast.error(errorMessage);
        return null;
      }
    },
    []
  );

  // Deleta uma sessão
  const deleteSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/whatsapp/sessions/${sessionId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao excluir sessão");
        }

        setState((prev) => ({
          ...prev,
          sessions: prev.sessions.filter((s) => s.id !== sessionId),
        }));
        toast.success("Conexão excluída com sucesso!");
        return true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erro ao excluir sessão";
        toast.error(errorMessage);
        return false;
      }
    },
    []
  );

  // Atualiza status de uma sessão
  const updateSessionStatus = useCallback(
    (sessionId: string, status: WhatsAppSession["status"]) => {
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId ? { ...s, status } : s
        ),
      }));
    },
    []
  );

  // Busca sessão específica
  const getSession = useCallback(
    async (sessionId: string): Promise<WhatsAppSession | null> => {
      try {
        const response = await fetch(`/api/whatsapp/sessions/${sessionId}`);

        if (!response.ok) {
          return null;
        }

        return await response.json();
      } catch {
        return null;
      }
    },
    []
  );

  // Carrega sessões ao montar
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Subscreve a mudanças em tempo real
  useEffect(() => {
    const subscription = supabase
      .channel("whatsapp-sessions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_sessions",
        },
        () => {
          // Recarrega sessões quando houver mudanças
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSessions, supabase]);

  return {
    ...state,
    refetch: fetchSessions,
    createSession,
    deleteSession,
    getSession,
    updateSessionStatus,
  };
}
