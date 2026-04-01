"use client";

import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { WhatsAppGroup, WhatsAppGroupParticipant } from "@/types/whatsapp";

interface UseWhatsAppGroupsState {
  groups: WhatsAppGroup[];
  selectedGroup: WhatsAppGroup | null;
  participants: WhatsAppGroupParticipant[];
  loading: boolean;
  error: string | null;
}

export function useWhatsAppGroups(sessionId: string | null) {
  const [state, setState] = useState<UseWhatsAppGroupsState>({
    groups: [],
    selectedGroup: null,
    participants: [],
    loading: false,
    error: null,
  });

  const supabase = createClient();

  // Busca grupos
  const fetchGroups = useCallback(
    async (includeArchived = false) => {
      if (!sessionId) return;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/groups?includeArchived=${includeArchived}`
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao buscar grupos");
        }

        const groups = await response.json();
        setState((prev) => ({
          ...prev,
          groups,
          loading: false,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao buscar grupos";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      }
    },
    [sessionId]
  );

  // Busca participantes do grupo
  const fetchParticipants = useCallback(
    async (groupId: string) => {
      if (!sessionId) return;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/groups/${groupId}/participants`
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao buscar participantes");
        }

        const participants = await response.json();
        setState((prev) => ({
          ...prev,
          participants,
          loading: false,
        }));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao buscar participantes";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
      }
    },
    [sessionId]
  );

  // Cria novo grupo
  const createGroup = useCallback(
    async (
      groupJid: string,
      name: string,
      description?: string,
      profilePictureUrl?: string,
      ownerPhone?: string
    ): Promise<boolean> => {
      if (!sessionId) return false;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/groups`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupJid,
              name,
              description,
              profilePictureUrl,
              ownerPhone,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao criar grupo");
        }

        const group = await response.json();
        setState((prev) => ({
          ...prev,
          groups: [...prev.groups, group],
          loading: false,
        }));

        toast.success("Grupo criado com sucesso");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao criar grupo";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        toast.error(errorMessage);
        return false;
      }
    },
    [sessionId]
  );

  // Atualiza grupo
  const updateGroup = useCallback(
    async (
      groupId: string,
      updates: {
        name?: string;
        description?: string;
        profilePictureUrl?: string;
        isArchived?: boolean;
      }
    ): Promise<boolean> => {
      if (!sessionId) return false;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/groups`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId,
              ...updates,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao atualizar grupo");
        }

        const updatedGroup = await response.json();
        setState((prev) => ({
          ...prev,
          groups: prev.groups.map((g) =>
            g.id === groupId ? updatedGroup : g
          ),
          selectedGroup:
            prev.selectedGroup?.id === groupId ? updatedGroup : prev.selectedGroup,
          loading: false,
        }));

        toast.success("Grupo atualizado com sucesso");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao atualizar grupo";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        toast.error(errorMessage);
        return false;
      }
    },
    [sessionId]
  );

  // Deleta grupo
  const deleteGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!sessionId) return false;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/groups`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupId }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao deletar grupo");
        }

        setState((prev) => ({
          ...prev,
          groups: prev.groups.filter((g) => g.id !== groupId),
          selectedGroup:
            prev.selectedGroup?.id === groupId ? null : prev.selectedGroup,
          loading: false,
        }));

        toast.success("Grupo deletado com sucesso");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao deletar grupo";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        toast.error(errorMessage);
        return false;
      }
    },
    [sessionId]
  );

  // Adiciona participante
  const addParticipant = useCallback(
    async (
      groupId: string,
      participantPhone: string,
      participantName?: string,
      isAdmin?: boolean
    ): Promise<boolean> => {
      if (!sessionId) return false;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/groups/${groupId}/participants`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              participantPhone,
              participantName,
              isAdmin,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao adicionar participante");
        }

        const participant = await response.json();
        setState((prev) => ({
          ...prev,
          participants: [...prev.participants, participant],
          loading: false,
        }));

        toast.success("Participante adicionado com sucesso");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao adicionar participante";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        toast.error(errorMessage);
        return false;
      }
    },
    [sessionId]
  );

  // Remove participante
  const removeParticipant = useCallback(
    async (groupId: string, participantId: string): Promise<boolean> => {
      if (!sessionId) return false;

      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/groups/${groupId}/participants`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ participantId }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erro ao remover participante");
        }

        setState((prev) => ({
          ...prev,
          participants: prev.participants.filter((p) => p.id !== participantId),
          loading: false,
        }));

        toast.success("Participante removido com sucesso");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao remover participante";
        setState((prev) => ({ ...prev, loading: false, error: errorMessage }));
        toast.error(errorMessage);
        return false;
      }
    },
    [sessionId]
  );

  // Seleciona grupo
  const selectGroup = useCallback((group: WhatsAppGroup | null) => {
    setState((prev) => ({
      ...prev,
      selectedGroup: group,
    }));
  }, []);

  // Subscreve a mudanças em tempo real
  useEffect(() => {
    if (!sessionId) return;

    const subscription = supabase
      .channel(`whatsapp-groups-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_groups",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setState((prev) => ({
              ...prev,
              groups: [...prev.groups, payload.new as WhatsAppGroup],
            }));
          } else if (payload.eventType === "UPDATE") {
            setState((prev) => ({
              ...prev,
              groups: prev.groups.map((g) =>
                g.id === payload.new.id ? (payload.new as WhatsAppGroup) : g
              ),
            }));
          } else if (payload.eventType === "DELETE") {
            setState((prev) => ({
              ...prev,
              groups: prev.groups.filter((g) => g.id !== payload.old.id),
            }));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId, supabase]);

  return {
    ...state,
    fetchGroups,
    fetchParticipants,
    createGroup,
    updateGroup,
    deleteGroup,
    addParticipant,
    removeParticipant,
    selectGroup,
  };
}
