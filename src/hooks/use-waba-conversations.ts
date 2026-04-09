"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export type ConversationStatus = "pending" | "open" | "resolved";
export type Priority = "low" | "medium" | "high";

export interface WABAContact {
  id: string;
  company_id: string;
  phone: string;
  name?: string;
  profile_picture?: string;
  whatsapp_id?: string;
  source?: string;
  created_at: string;
  updated_at: string;
}

export interface WABALastMessage {
  id: string;
  content: string;
  direction: "inbound" | "outbound";
  message_type: string;
  created_at: string;
  status?: string;
}

export interface WABAConversation {
  id: string;
  company_id: string;
  waba_connection_id?: string;
  contact_id: string;
  status: ConversationStatus;
  priority: Priority;
  unread_count: number;
  last_message_id?: string;
  assigned_to?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined fields
  contact?: WABAContact;
  last_message?: WABALastMessage;
}

export interface CreateConversationData {
  companyId: string;
  connectionId?: string;
  contactId: string;
  status?: ConversationStatus;
  priority?: Priority;
  assignedTo?: string;
}

// Fetch conversations by status
async function fetchConversations(
  companyId: string,
  status?: ConversationStatus
): Promise<WABAConversation[]> {
  const supabase = createClient();
  
  let query = supabase
    .from("waba_conversations")
    .select(`
      *,
      contact:waba_contacts(*),
      last_message:waba_messages(id, content, direction, message_type, created_at, status)
    `)
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) throw error;
  
  // Transform data to match interface
  return (data || []).map((conv: Record<string, unknown>) => ({
    ...conv,
    contact: Array.isArray(conv.contact) ? conv.contact[0] : conv.contact,
    last_message: Array.isArray(conv.last_message) ? conv.last_message[0] : conv.last_message,
  })) as WABAConversation[];
}

// Create conversation
async function createConversation(
  data: CreateConversationData
): Promise<WABAConversation> {
  const supabase = createClient();
  
  const { data: conversation, error } = await supabase
    .from("waba_conversations")
    .insert({
      company_id: data.companyId,
      waba_connection_id: data.connectionId,
      contact_id: data.contactId,
      status: data.status || "pending",
      priority: data.priority || "medium",
      assigned_to: data.assignedTo,
    })
    .select(`
      *,
      contact:waba_contacts(*)
    `)
    .single();

  if (error) throw error;
  return conversation as WABAConversation;
}

// Update conversation status
async function updateConversationStatus(
  conversationId: string,
  status: ConversationStatus
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("waba_conversations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) throw error;
}

// Update unread count
async function updateUnreadCount(
  conversationId: string,
  count: number
): Promise<void> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("waba_conversations")
    .update({ unread_count: count, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) throw error;
}

// Find or create contact
async function findOrCreateContact(
  companyId: string,
  phone: string,
  name?: string,
  whatsappId?: string
): Promise<WABAContact> {
  const supabase = createClient();
  
  // Try to find existing contact
  const { data: existing } = await supabase
    .from("waba_contacts")
    .select("*")
    .eq("company_id", companyId)
    .eq("phone", phone)
    .single();

  if (existing) {
    // Update name if provided and contact doesn't have one
    if (name && !existing.name) {
      const { data: updated } = await supabase
        .from("waba_contacts")
        .update({ name, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .select()
        .single();
      return updated as WABAContact;
    }
    return existing as WABAContact;
  }

  // Create new contact
  const { data: newContact, error } = await supabase
    .from("waba_contacts")
    .insert({
      company_id: companyId,
      phone,
      name: name || phone,
      whatsapp_id: whatsappId,
      source: "whatsapp_official",
    })
    .select()
    .single();

  if (error) throw error;
  return newContact as WABAContact;
}

// Find or create conversation
async function findOrCreateConversation(
  companyId: string,
  contactId: string,
  connectionId?: string
): Promise<WABAConversation> {
  const supabase = createClient();
  
  // Try to find existing open/pending conversation
  const { data: existing } = await supabase
    .from("waba_conversations")
    .select("*")
    .eq("company_id", companyId)
    .eq("contact_id", contactId)
    .in("status", ["open", "pending"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    return existing as WABAConversation;
  }

  // Create new conversation
  return createConversation({
    companyId,
    contactId,
    connectionId,
    status: "pending",
  });
}

// Hook for managing WABA conversations
export function useWABAConversations(
  companyId?: string,
  status?: ConversationStatus
) {
  const [conversations, setConversations] = useState<WABAConversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!companyId) return;
    
    setIsLoading(true);
    try {
      const data = await fetchConversations(companyId, status);
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Erro ao carregar conversas");
    } finally {
      setIsLoading(false);
    }
  }, [companyId, status]);

  // Create conversation
  const createNewConversation = useCallback(async (
    data: CreateConversationData
  ): Promise<WABAConversation | null> => {
    try {
      const conversation = await createConversation(data);
      setConversations((prev) => [conversation, ...prev]);
      return conversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Erro ao criar conversa");
      return null;
    }
  }, []);

  // Update status
  const updateStatus = useCallback(async (
    conversationId: string,
    newStatus: ConversationStatus
  ): Promise<void> => {
    try {
      await updateConversationStatus(conversationId, newStatus);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, status: newStatus, updated_at: new Date().toISOString() }
            : conv
        )
      );
      
      // If status changed, remove from current list if filtering
      if (status && newStatus !== status) {
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  }, [status]);

  // Open conversation (move from pending to open)
  const openConversation = useCallback(async (conversationId: string): Promise<void> => {
    try {
      await updateConversationStatus(conversationId, "open");
      await updateUnreadCount(conversationId, 0);
      
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { 
                ...conv, 
                status: "open", 
                unread_count: 0,
                updated_at: new Date().toISOString() 
              }
            : conv
        )
      );
      
      // Remove from pending list if filtering by pending
      if (status === "pending") {
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
      }
    } catch (error) {
      console.error("Error opening conversation:", error);
      toast.error("Erro ao abrir conversa");
    }
  }, [status]);

  // Resolve conversation
  const resolveConversation = useCallback(async (conversationId: string): Promise<void> => {
    try {
      await updateConversationStatus(conversationId, "resolved");
      
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, status: "resolved", updated_at: new Date().toISOString() }
            : conv
        )
      );
      
      // Remove from current list if filtering by open/pending
      if (status === "open" || status === "pending") {
        setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));
      }
    } catch (error) {
      console.error("Error resolving conversation:", error);
      toast.error("Erro ao resolver conversa");
    }
  }, [status]);

  // Reset unread count
  const resetUnreadCount = useCallback(async (conversationId: string): Promise<void> => {
    try {
      await updateUnreadCount(conversationId, 0);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error("Error resetting unread count:", error);
    }
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!companyId) return;

    // Load initial data
    loadConversations();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`waba_conversations:${companyId}:${status || "all"}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "waba_conversations",
          filter: `company_id=eq.${companyId}`,
        },
        async (payload) => {
          const newConv = payload.new as Record<string, unknown>;
          
          // Fetch full conversation with contact
          const { data: fullConv } = await supabase
            .from("waba_conversations")
            .select(`
              *,
              contact:waba_contacts(*),
              last_message:waba_messages(id, content, direction, message_type, created_at, status)
            `)
            .eq("id", newConv.id)
            .single();

          if (fullConv) {
            const transformed = {
              ...fullConv,
              contact: Array.isArray(fullConv.contact) ? fullConv.contact[0] : fullConv.contact,
              last_message: Array.isArray(fullConv.last_message) ? fullConv.last_message[0] : fullConv.last_message,
            } as WABAConversation;

            // Only add if matches status filter
            if (!status || transformed.status === status) {
              setConversations((prev) => {
                if (prev.some((c) => c.id === transformed.id)) return prev;
                return [transformed, ...prev];
              });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "waba_conversations",
          filter: `company_id=eq.${companyId}`,
        },
        async (payload) => {
          const updatedConv = payload.new as Record<string, unknown>;
          
          // Fetch full conversation with contact and last message
          const { data: fullConv } = await supabase
            .from("waba_conversations")
            .select(`
              *,
              contact:waba_contacts(*),
              last_message:waba_messages(id, content, direction, message_type, created_at, status)
            `)
            .eq("id", updatedConv.id)
            .single();

          if (fullConv) {
            const transformed = {
              ...fullConv,
              contact: Array.isArray(fullConv.contact) ? fullConv.contact[0] : fullConv.contact,
              last_message: Array.isArray(fullConv.last_message) ? fullConv.last_message[0] : fullConv.last_message,
            } as WABAConversation;

            setConversations((prev) => {
              const exists = prev.some((c) => c.id === transformed.id);
              
              // If status doesn't match filter, remove from list
              if (status && transformed.status !== status) {
                return prev.filter((c) => c.id !== transformed.id);
              }
              
              // Update or add to list
              if (exists) {
                return prev.map((c) =>
                  c.id === transformed.id ? transformed : c
                );
              } else {
                return [transformed, ...prev];
              }
            });
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [companyId, status, loadConversations, supabase]);

  return {
    conversations,
    isLoading,
    loadConversations,
    createNewConversation,
    updateStatus,
    openConversation,
    resolveConversation,
    resetUnreadCount,
    findOrCreateContact,
    findOrCreateConversation,
  };
}

// Hook for single conversation
export function useWABAConversation(conversationId?: string) {
  const [conversation, setConversation] = useState<WABAConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const loadConversation = useCallback(async () => {
    if (!conversationId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("waba_conversations")
        .select(`
          *,
          contact:waba_contacts(*),
          last_message:waba_messages(id, content, direction, message_type, created_at, status)
        `)
        .eq("id", conversationId)
        .single();

      if (error) throw error;
      
      if (data) {
        setConversation({
          ...data,
          contact: Array.isArray(data.contact) ? data.contact[0] : data.contact,
          last_message: Array.isArray(data.last_message) ? data.last_message[0] : data.last_message,
        } as WABAConversation);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, supabase]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  return { conversation, isLoading, reload: loadConversation };
}
