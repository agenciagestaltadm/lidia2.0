"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

interface UseWhatsAppQRState {
  qrCode: string | null;
  status: "idle" | "connecting" | "waiting_qr" | "connected" | "error" | "timeout";
  phone: string | null;
  pushName: string | null;
  loading: boolean;
  errorMessage: string | null;
}

export function useWhatsAppQR(sessionId: string | null) {
  const [state, setState] = useState<UseWhatsAppQRState>({
    qrCode: null,
    status: "idle",
    phone: null,
    pushName: null,
    loading: false,
    errorMessage: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  // Flag para rastrear se já recebemos um evento de erro/fim do servidor
  const handledErrorRef = useRef<boolean>(false);

  // Inicia conexão e escuta QR code
  const startConnection = useCallback(() => {
    if (!sessionId) return;

    // Fecha conexão anterior se existir
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Reseta flag de erro
    handledErrorRef.current = false;

    setState({
      qrCode: null,
      status: "connecting",
      phone: null,
      pushName: null,
      loading: true,
      errorMessage: null,
    });

    // Cria EventSource para SSE
    const eventSource = new EventSource(`/api/whatsapp/sessions/${sessionId}/qr`);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("status", (event) => {
      const data = JSON.parse(event.data);
      if (data.status === "starting") {
        setState((prev) => ({ ...prev, status: "connecting" }));
      } else if (data.status === "retrying") {
        // Baileys está tentando reconectar, mantém o estado de connecting
        setState((prev) => ({ ...prev, status: "connecting", loading: true }));
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
      handledErrorRef.current = true; // Marca como tratado para evitar onerror
      setState({
        qrCode: null,
        status: "connected",
        phone: data.phone,
        pushName: data.pushName,
        loading: false,
        errorMessage: null,
      });
      toast.success("WhatsApp conectado com sucesso!");
      eventSource.close();
    });

    eventSource.addEventListener("disconnected", () => {
      handledErrorRef.current = true; // Marca como tratado para evitar onerror
      setState({
        qrCode: null,
        status: "idle",
        phone: null,
        pushName: null,
        loading: false,
        errorMessage: null,
      });
      eventSource.close();
    });

    eventSource.addEventListener("timeout", () => {
      handledErrorRef.current = true; // Marca como tratado para evitar onerror
      setState((prev) => ({
        ...prev,
        status: "timeout",
        loading: false,
      }));
      toast.error("Tempo expirado. Tente novamente.");
      eventSource.close();
    });

    eventSource.addEventListener("error", (event) => {
      // Verifica se é um evento de mensagem SSE customizado (com dados)
      if (event instanceof MessageEvent && event.data) {
        handledErrorRef.current = true; // Marca como tratado para evitar onerror duplicado
        let errorMessage = "Erro na conexão com o servidor";
        
        try {
          const data = JSON.parse(event.data);
          errorMessage = data.message || data.error || "Erro na conexão";
          console.error("[useWhatsAppQR] Server error:", data);
        } catch (e) {
          console.error("[useWhatsAppQR] Failed to parse error data:", e);
        }
        
        setState((prev) => ({
          ...prev,
          status: "error",
          loading: false,
          errorMessage,
        }));
        toast.error(errorMessage);
        eventSource.close();
      }
      // Se não é MessageEvent, será tratado pelo onerror abaixo
    });

    // Tratamento de erro nativo do EventSource (conexão perdida, stream fechada, etc.)
    eventSource.onerror = () => {
      // Se já tratamos um evento de erro/fim do servidor, ignora o onerror nativo
      // (o browser dispara onerror quando a stream SSE é fechada pelo servidor)
      if (handledErrorRef.current) {
        console.log("[useWhatsAppQR] Ignoring native onerror (already handled)");
        eventSource.close();
        return;
      }

      // Verifica se o EventSource já está fechado (readyState === 2)
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("[useWhatsAppQR] EventSource already closed, ignoring onerror");
        return;
      }

      // Erro genuíno de conexão (rede, servidor indisponível, etc.)
      console.error("[useWhatsAppQR] Connection error (network/server issue)");
      handledErrorRef.current = true;
      
      setState((prev) => ({
        ...prev,
        status: "error",
        loading: false,
        errorMessage: "Erro de conexão. Verifique sua internet e tente novamente.",
      }));
      toast.error("Erro de conexão. Verifique sua internet e tente novamente.");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId]);

  // Cancela conexão
  const cancelConnection = useCallback(() => {
    if (eventSourceRef.current) {
      handledErrorRef.current = true; // Evita onerror ao fechar manualmente
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState({
      qrCode: null,
      status: "idle",
      phone: null,
      pushName: null,
      loading: false,
      errorMessage: null,
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
