"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export type MessageDirection = "inbound" | "outbound";
export type MessageType = "text" | "image" | "video" | "audio" | "document" | "location" | "template";
export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";

export interface WABAMessage {
  id: string;
  conversation_id: string;
  waba_connection_id?: string;
  direction: MessageDirection;
  message_type: MessageType;
  content: string;
  media_url?: string;
  media_caption?: string;
  external_id?: string;
  status: MessageStatus;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  failed_at?: string;
  error_message?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SendMessageData {
  conversationId: string;
  connectionId: string;
  phoneNumber: string;
  messageType: MessageType;
  content: string;
  mediaUrl?: string;
  mediaCaption?: string;
}

// Fetch messages for a conversation
async function fetchMessages(conversationId: string): Promise<WABAMessage[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("waba_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as WABAMessage[]) || [];
}

// Send message via API
async function sendMessageAPI(data: SendMessageData): Promise<WABAMessage> {
  const response = await fetch("/api/waba/send-message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send message");
  }

  return response.json();
}

// Mark messages as read
async function markMessagesAsRead(conversationId: string): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("waba_messages")
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("direction", "inbound")
    .eq("status", "delivered");

  if (error) throw error;
}

// Hook for managing WABA messages
export function useWABAMessages(conversationId?: string) {
  const [messages, setMessages] = useState<WABAMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const supabase = createClient();
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;
    
    setIsLoading(true);
    try {
      const data = await fetchMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Erro ao carregar mensagens");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Send message
  const sendMessage = useCallback(async (data: SendMessageData): Promise<WABAMessage | null> => {
    setIsSending(true);
    try {
      const message = await sendMessageAPI(data);
      // Don't add manually - the message will come via Realtime INSERT subscription
      // This prevents duplication
      toast.success("Mensagem enviada!");
      return message;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem");
      return null;
    } finally {
      setIsSending(false);
    }
  }, []);

  // Mark as read
  const markAsRead = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      await markMessagesAsRead(conversationId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.direction === "inbound" && msg.status === "delivered"
            ? { ...msg, status: "read", read_at: new Date().toISOString() }
            : msg
        )
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  }, [conversationId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;

    // Load initial messages
    loadMessages();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`waba_messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "waba_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as WABAMessage;
          setMessages((prev) => {
            // Check if message already exists
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "waba_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as WABAMessage;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, loadMessages, supabase]);

  return {
    messages,
    isLoading,
    isSending,
    loadMessages,
    sendMessage,
    markAsRead,
  };
}

// Hook for sending messages with optimistic updates
export function useSendWABAMessage() {
  const [isSending, setIsSending] = useState(false);
  const supabase = createClient();

  const sendMessage = useCallback(async (
    data: SendMessageData & { companyId: string }
  ): Promise<WABAMessage | null> => {
    setIsSending(true);
    try {
      // First save to database with pending status
      const { data: message, error } = await supabase
        .from("waba_messages")
        .insert({
          conversation_id: data.conversationId,
          waba_connection_id: data.connectionId,
          direction: "outbound",
          message_type: data.messageType,
          content: data.content,
          media_url: data.mediaUrl,
          media_caption: data.mediaCaption,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      // Then try to send via API
      try {
        const sentMessage = await sendMessageAPI(data);
        
        // Update message with external_id and sent status
        await supabase
          .from("waba_messages")
          .update({
            external_id: sentMessage.external_id,
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", message.id);

        return { ...message, status: "sent", sent_at: new Date().toISOString() } as WABAMessage;
      } catch (apiError) {
        // Mark as failed if API call fails
        await supabase
          .from("waba_messages")
          .update({
            status: "failed",
            failed_at: new Date().toISOString(),
            error_message: apiError instanceof Error ? apiError.message : "API Error",
          })
          .eq("id", message.id);

        throw apiError;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem");
      return null;
    } finally {
      setIsSending(false);
    }
  }, [supabase]);

  return { sendMessage, isSending };
}

// Hook for message status updates via webhook
export function useMessageStatusUpdater() {
  const supabase = createClient();

  const updateStatus = useCallback(async (
    externalId: string,
    status: MessageStatus,
    timestamp?: string
  ): Promise<void> => {
    const updateData: Record<string, string> = { status };
    
    if (status === "sent" && timestamp) {
      updateData.sent_at = timestamp;
    } else if (status === "delivered" && timestamp) {
      updateData.delivered_at = timestamp;
    } else if (status === "read" && timestamp) {
      updateData.read_at = timestamp;
    } else if (status === "failed") {
      updateData.failed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("waba_messages")
      .update(updateData)
      .eq("external_id", externalId);

    if (error) {
      console.error("Error updating message status:", error);
    }
  }, [supabase]);

  return { updateStatus };
}
