"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { WhatsAppMessageReaction } from "@/types/whatsapp";

interface UseWhatsAppReactionsState {
  reactions: Record<string, WhatsAppMessageReaction[]>;
  loading: boolean;
  error: string | null;
}

export function useWhatsAppReactions(
  sessionId: string | null,
  messageId: string | null
) {
  const [state, setState] = useState<UseWhatsAppReactionsState>({
    reactions: {},
    loading: false,
    error: null,
  });

  // Busca reações da mensagem
  const fetchReactions = useCallback(async () => {
    if (!sessionId || !messageId) return;

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch(
        `/api/whatsapp/sessions/${sessionId}/reactions?messageId=${messageId}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao buscar reações");
      }

      const reactions = await response.json();
      setState((prev) => ({
        ...prev,
        reactions,
        loading: false,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao buscar reações";
      setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
    }
  }, [sessionId, messageId]);

  // Adiciona ou remove reação
  const toggleReaction = useCallback(
    async (
      contactPhone: string,
      reactionEmoji: string
    ): Promise<boolean> => {
      if (!sessionId || !messageId) return false;

      try {
        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/reactions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messageId,
              contactPhone,
              reactionEmoji,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao adicionar reação");
        }

        const result = await response.json();

        // Atualiza estado local
        if (result.removed) {
          setState((prev) => {
            const newReactions = { ...prev.reactions };
            if (newReactions[reactionEmoji]) {
              newReactions[reactionEmoji] = newReactions[reactionEmoji].filter(
                (r) => r.contact_phone !== contactPhone
              );
              if (newReactions[reactionEmoji].length === 0) {
                delete newReactions[reactionEmoji];
              }
            }
            return { ...prev, reactions: newReactions };
          });
          toast.success("Reação removida");
        } else {
          setState((prev) => {
            const newReactions = { ...prev.reactions };
            if (!newReactions[reactionEmoji]) {
              newReactions[reactionEmoji] = [];
            }
            newReactions[reactionEmoji].push(result);
            return { ...prev, reactions: newReactions };
          });
          toast.success("Reação adicionada");
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao adicionar reação";
        toast.error(errorMessage);
        return false;
      }
    },
    [sessionId, messageId]
  );

  // Remove reação específica
  const removeReaction = useCallback(
    async (
      contactPhone: string,
      reactionEmoji: string
    ): Promise<boolean> => {
      if (!sessionId || !messageId) return false;

      try {
        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/reactions`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messageId,
              contactPhone,
              reactionEmoji,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao remover reação");
        }

        // Atualiza estado local
        setState((prev) => {
          const newReactions = { ...prev.reactions };
          if (newReactions[reactionEmoji]) {
            newReactions[reactionEmoji] = newReactions[reactionEmoji].filter(
              (r) => r.contact_phone !== contactPhone
            );
            if (newReactions[reactionEmoji].length === 0) {
              delete newReactions[reactionEmoji];
            }
          }
          return { ...prev, reactions: newReactions };
        });

        toast.success("Reação removida");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao remover reação";
        toast.error(errorMessage);
        return false;
      }
    },
    [sessionId, messageId]
  );

  // Obtém contagem de reações
  const getReactionCount = useCallback((): number => {
    return Object.values(state.reactions).reduce(
      (total, reactions) => total + reactions.length,
      0
    );
  }, [state.reactions]);

  // Obtém reações agrupadas por emoji
  const getReactionsByEmoji = useCallback(
    (emoji: string): WhatsAppMessageReaction[] => {
      return state.reactions[emoji] || [];
    },
    [state.reactions]
  );

  // Obtém todos os emojis com reações
  const getReactionEmojis = useCallback((): string[] => {
    return Object.keys(state.reactions);
  }, [state.reactions]);

  return {
    ...state,
    fetchReactions,
    toggleReaction,
    removeReaction,
    getReactionCount,
    getReactionsByEmoji,
    getReactionEmojis,
  };
}
