"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { WhatsAppMessage, WhatsAppContact } from "@/types/whatsapp";

interface UseWhatsAppSSEState {
  messages: WhatsAppMessage[];
  contacts: WhatsAppContact[];
  loading: boolean;
  error: string | null;
  connected: boolean;
}

export function useWhatsAppSSE(sessionId: string | null, phone: string | null) {
  const [state, setState] = useState<UseWhatsAppSSEState>({
    messages: [],
    contacts: [],
    loading: false,
    error: null,
    connected: false,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const messagesRef = useRef<WhatsAppMessage[]>([]);
  const contactsRef = useRef<WhatsAppContact[]>([]);

  // Atualiza refs quando state muda
  useEffect(() => {
    messagesRef.current = state.messages;
  }, [state.messages]);

  useEffect(() => {
    contactsRef.current = state.contacts;
  }, [state.contacts]);

  // Conecta ao SSE stream
  useEffect(() => {
    if (!sessionId) {
      setState((prev) => ({ ...prev, connected: false }));
      return;
    }

    console.log(`[useWhatsAppSSE] Connecting to SSE for session: ${sessionId}, phone: ${phone}`);

    // Fecha conexão anterior
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const url = phone 
      ? `/api/whatsapp/sessions/${sessionId}/stream?phone=${phone}`
      : `/api/whatsapp/sessions/${sessionId}/stream`;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("connected", (event) => {
      const data = JSON.parse(event.data);
      console.log(`[useWhatsAppSSE] Connected:`, data);
      setState((prev) => ({ ...prev, connected: true, loading: false }));
    });

    eventSource.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      console.log(`[useWhatsAppSSE] New message:`, message.id);
      
      setState((prev) => {
        // Evita duplicatas
        if (prev.messages.some(m => m.id === message.id || m.message_id === message.message_id)) {
          return prev;
        }
        
        const newMessages = [...prev.messages, message].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        return { ...prev, messages: newMessages };
      });
    });

    eventSource.addEventListener("contact", (event) => {
      const contact = JSON.parse(event.data);
      console.log(`[useWhatsAppSSE] New/Updated contact:`, contact.phone);
      
      setState((prev) => {
        const exists = prev.contacts.some(c => c.id === contact.id || c.phone === contact.phone);
        
        if (exists) {
          return {
            ...prev,
            contacts: prev.contacts.map(c => 
              c.id === contact.id || c.phone === contact.phone ? contact : c
            )
          };
        }
        
        return { ...prev, contacts: [contact, ...prev.contacts] };
      });
    });

    eventSource.addEventListener("error", (event) => {
      console.error(`[useWhatsAppSSE] Error:`, event);
      setState((prev) => ({ 
        ...prev, 
        error: "Erro na conexão em tempo real", 
        connected: false,
        loading: false 
      }));
    });

    eventSource.onerror = (error) => {
      console.error(`[useWhatsAppSSE] Connection error:`, error);
      setState((prev) => ({ 
        ...prev, 
        error: "Erro de conexão", 
        connected: false,
        loading: false 
      }));
    };

    // Timeout de segurança
    const timeout = setTimeout(() => {
      if (eventSource.readyState === EventSource.CONNECTING) {
        console.log(`[useWhatsAppSSE] Connection timeout`);
        eventSource.close();
        setState((prev) => ({ 
          ...prev, 
          loading: false, 
          error: "Timeout ao conectar" 
        }));
      }
    }, 10000);

    return () => {
      clearTimeout(timeout);
      console.log(`[useWhatsAppSSE] Closing connection`);
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [sessionId, phone]);

  // Carrega mensagens iniciais via API
  const loadMessages = useCallback(async () => {
    if (!sessionId || !phone) return;

    console.log(`[useWhatsAppSSE] Loading initial messages`);
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetch(
        `/api/whatsapp/sessions/${sessionId}/messages?phone=${phone}&limit=50`
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar mensagens");
      }

      const messages = await response.json();
      console.log(`[useWhatsAppSSE] Loaded ${messages.length} messages`);

      setState((prev) => ({
        ...prev,
        messages: messages.sort(
          (a: WhatsAppMessage, b: WhatsAppMessage) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
        loading: false,
      }));
    } catch (err) {
      console.error(`[useWhatsAppSSE] Error loading messages:`, err);
      setState((prev) => ({
        ...prev,
        error: "Erro ao carregar mensagens",
        loading: false,
      }));
    }
  }, [sessionId, phone]);

  // Carrega contatos iniciais
  const loadContacts = useCallback(async () => {
    if (!sessionId) return;

    console.log(`[useWhatsAppSSE] Loading contacts`);
    setState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetch(
        `/api/whatsapp/sessions/${sessionId}/fetch-contacts`
      );

      if (!response.ok) {
        throw new Error("Erro ao carregar contatos");
      }

      const contacts = await response.json();
      console.log(`[useWhatsAppSSE] Loaded ${contacts.length} contacts`);

      setState((prev) => ({
        ...prev,
        contacts: contacts || [],
        loading: false,
      }));
    } catch (err) {
      console.error(`[useWhatsAppSSE] Error loading contacts:`, err);
      setState((prev) => ({
        ...prev,
        error: "Erro ao carregar contatos",
        loading: false,
      }));
    }
  }, [sessionId]);

  // Envia mensagem
  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId || !phone) return false;

    try {
      const response = await fetch(
        `/api/whatsapp/sessions/${sessionId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, content }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao enviar mensagem");
      }

      const message = await response.json();
      
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, message],
      }));

      return true;
    } catch (err) {
      console.error(`[useWhatsAppSSE] Error sending message:`, err);
      return false;
    }
  }, [sessionId, phone]);

  return {
    ...state,
    loadMessages,
    loadContacts,
    sendMessage,
  };
}
