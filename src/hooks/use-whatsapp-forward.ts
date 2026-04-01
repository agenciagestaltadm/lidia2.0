"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { WhatsAppMessageForward } from "@/types/whatsapp";

interface UseWhatsAppForwardState {
  forwards: WhatsAppMessageForward[];
  loading: boolean;
  error: string | null;
}

export function useWhatsAppForward(sessionId: string | null) {
  const [state, setState] = useState<UseWhatsAppForwardState>({
    forwards: [],
    loading: false,
    error: null,
  });

  // Busca histórico de encaminhamentos
  const fetchForwards = useCallback(
    async (messageId: string) => {
      if (!sessionId) return;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/forward?messageId=${messageId}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao buscar encaminhamentos");
        }

        const data = await response.json();
        setState((prev) => ({
          ...prev,
          forwards: data.forwards,
          loading: false,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao buscar encaminhamentos";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      }
    },
    [sessionId]
  );

  // Encaminha mensagem para um ou mais contatos
  const forwardMessage = useCallback(
    async (messageId: string, forwardToPhones: string[]): Promise<boolean> => {
      if (!sessionId) return false;

      if (!forwardToPhones || forwardToPhones.length === 0) {
        toast.error("Selecione pelo menos um contato");
        return false;
      }

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/forward`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messageId,
              forwardToPhones,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao encaminhar mensagem");
        }

        const result = await response.json();

        // Atualiza estado local
        setState((prev) => ({
          ...prev,
          forwards: [...prev.forwards, ...result.forwards],
          loading: false,
        }));

        toast.success(
          `Mensagem encaminhada para ${result.count} contato(s)`
        );
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao encaminhar mensagem";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        toast.error(errorMessage);
        return false;
      }
    },
    [sessionId]
  );

  // Obtém contagem de encaminhamentos
  const getForwardCount = useCallback((): number => {
    return state.forwards.length;
  }, [state.forwards]);

  // Obtém contatos para os quais a mensagem foi encaminhada
  const getForwardedToPhones = useCallback((): string[] => {
    return [...new Set(state.forwards.map((f) => f.forwarded_to_phone))];
  }, [state.forwards]);

  return {
    ...state,
    fetchForwards,
    forwardMessage,
    getForwardCount,
    getForwardedToPhones,
  };
}
