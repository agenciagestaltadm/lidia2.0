"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface PresenceState {
  presence_status: "available" | "unavailable" | "composing" | "recording";
  last_seen_at: string | null;
  is_typing: boolean;
}

export function useWhatsAppPresence(
  sessionId: string | null,
  phone: string | null
) {
  const [presence, setPresence] = useState<PresenceState>({
    presence_status: "unavailable",
    last_seen_at: null,
    is_typing: false,
  });
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  // Busca presença do contato
  const fetchPresence = useCallback(async () => {
    if (!sessionId || !phone) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/whatsapp/sessions/${sessionId}/presence?phone=${phone}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch presence");
      }

      const data = await response.json();
      setPresence(data);
    } catch (error) {
      console.error("[useWhatsAppPresence] Erro ao buscar presença:", error);
    } finally {
      setLoading(false);
    }
  }, [sessionId, phone]);

  // Atualiza presença do contato
  const updatePresence = useCallback(
    async (
      status: "available" | "unavailable" | "composing" | "recording",
      isTyping: boolean = false
    ) => {
      if (!sessionId || !phone) return;

      try {
        const response = await fetch(
          `/api/whatsapp/sessions/${sessionId}/presence`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone,
              presence_status: status,
              is_typing: isTyping,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update presence");
        }

        const data = await response.json();
        setPresence(data);
        console.log("[useWhatsAppPresence] Presença atualizada:", data);
      } catch (error) {
        console.error("[useWhatsAppPresence] Erro ao atualizar presença:", error);
      }
    },
    [sessionId, phone]
  );

  // Subscreve a mudanças de presença em tempo real
  useEffect(() => {
    if (!sessionId || !phone) return;

    const subscription = supabase
      .channel(`whatsapp-presence-${sessionId}-${phone}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "whatsapp_contacts",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload: any) => {
          const contact = payload.new as any;
          if (contact.phone === phone) {
            setPresence({
              presence_status: contact.presence_status,
              last_seen_at: contact.last_seen_at,
              is_typing: contact.is_typing,
            });
            console.log("[useWhatsAppPresence] Presença atualizada via realtime:", contact);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [sessionId, phone, supabase]);

  // Polling para atualizar presença a cada 10 segundos
  useEffect(() => {
    if (!sessionId || !phone) return;

    const interval = setInterval(() => {
      fetchPresence();
    }, 10000); // 10 segundos

    return () => clearInterval(interval);
  }, [sessionId, phone, fetchPresence]);

  // Busca inicial
  useEffect(() => {
    fetchPresence();
  }, [fetchPresence]);

  return {
    ...presence,
    loading,
    updatePresence,
    refetch: fetchPresence,
  };
}
