"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

interface UseWhatsAppQRState {
  qrCode: string | null;
  status: "idle" | "connecting" | "waiting_qr" | "connected" | "error" | "timeout";
  phone: string | null;
  pushName: string | null;
  loading: boolean;
}

export function useWhatsAppQR(sessionId: string | null) {
  const [state, setState] = useState<UseWhatsAppQRState>({
    qrCode: null,
    status: "idle",
    phone: null,
    pushName: null,
    loading: false,
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  // Inicia conexão e escuta QR code
  const startConnection = useCallback(() => {
    if (!sessionId) return;

    // Fecha conexão anterior se existir
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setState({
      qrCode: null,
      status: "connecting",
      phone: null,
      pushName: null,
      loading: true,
    });

    // Cria EventSource para SSE
    const eventSource = new EventSource(`/api/whatsapp/sessions/${sessionId}/qr`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("status", (event) => {
      const data = JSON.parse(event.data);
      if (data.status === "starting") {
        setState((prev) => ({ ...prev, status: "connecting" }));
      }
    });

    eventSource.addEventListener("qr", (event) => {
      const data = JSON.parse(event.data);
      setState((prev) => ({
        ...prev,
        qrCode: data.qr,
        status: "waiting_qr",
        loading: false,
      }));
    });

    eventSource.addEventListener("connected", (event) => {
      const data = JSON.parse(event.data);
      setState({
        qrCode: null,
        status: "connected",
        phone: data.phone,
        pushName: data.pushName,
        loading: false,
      });
      toast.success("WhatsApp conectado com sucesso!");
      eventSource.close();
    });

    eventSource.addEventListener("disconnected", () => {
      setState({
        qrCode: null,
        status: "idle",
        phone: null,
        pushName: null,
        loading: false,
      });
      eventSource.close();
    });

    eventSource.addEventListener("timeout", () => {
      setState((prev) => ({
        ...prev,
        status: "timeout",
        loading: false,
      }));
      toast.error("Tempo expirado. Tente novamente.");
      eventSource.close();
    });

    eventSource.addEventListener("error", (event) => {
      console.error("EventSource error:", event);
      let errorMessage = "Erro desconhecido";
      try {
        const data = JSON.parse((event as MessageEvent).data || '{}');
        errorMessage = data.error || data.message || "Erro na conexão";
        console.error("Error data:", data);
      } catch (e) {
        console.error("Failed to parse error data:", e);
      }
      setState((prev) => ({
        ...prev,
        status: "error",
        loading: false,
      }));
      toast.error(errorMessage);
      eventSource.close();
    });

    // Tratamento de erro geral
    eventSource.onerror = () => {
      setState((prev) => ({
        ...prev,
        status: "error",
        loading: false,
      }));
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId]);

  // Cancela conexão
  const cancelConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState({
      qrCode: null,
      status: "idle",
      phone: null,
      pushName: null,
      loading: false,
    });
  }, []);

  // Limpa ao desmontar
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    startConnection,
    cancelConnection,
  };
}
