"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { WhatsAppMessageDeletion } from "@/types/whatsapp";

interface UseWhatsAppDeleteState {
  deletion: WhatsAppMessageDeletion | null;
  loading: boolean;
  error: string | null;
}

export function useWhatsAppDelete(sessionId: string | null) {
  const [state, setState] = useState<UseWhatsAppDeleteState>({
    deletion: null,
    loading: false,
    error: null,
  });

  // Busca informações de deleção
  const fetchDeletion = useCallback(
    async (messageId: string) => {
      if (!sessionId) return;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/delete?messageId=${messageId}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao buscar informações de deleção");
        }

        const data = await response.json();
        setState((prev) => ({
          ...prev,
          deletion: data.deletion,
          loading: false,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao buscar informações de deleção";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      }
    },
    [sessionId]
  );

  // Deleta mensagem
  const deleteMessage = useCallback(
    async (
      messageId: string,
      deletedBy: string,
      reason?: string
    ): Promise<boolean> => {
      if (!sessionId) return false;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/delete`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messageId,
              deletedBy,
              reason: reason || null,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao deletar mensagem");
        }

        const result = await response.json();

        // Atualiza estado local
        setState((prev) => ({
          ...prev,
          deletion: result.deletion,
          loading: false,
        }));

        toast.success("Mensagem deletada com sucesso");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao deletar mensagem";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        toast.error(errorMessage);
        return false;
      }
    },
    [sessionId]
  );

  // Verifica se mensagem foi deletada
  const isDeleted = useCallback((): boolean => {
    return !!state.deletion;
  }, [state.deletion]);

  // Obtém informações de deleção
  const getDeletionInfo = useCallback((): WhatsAppMessageDeletion | null => {
    return state.deletion;
  }, [state.deletion]);

  return {
    ...state,
    fetchDeletion,
    deleteMessage,
    isDeleted,
    getDeletionInfo,
  };
}
