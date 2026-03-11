"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Protocol, ProtocolStats } from "@/types/atendimento";
import { toast } from "sonner";

// Query keys
export const protocolKeys = {
  all: ["protocols"] as const,
  list: (filters?: Record<string, unknown>) => [...protocolKeys.all, "list", filters] as const,
  stats: () => [...protocolKeys.all, "stats"] as const,
  detail: (id: string) => [...protocolKeys.all, "detail", id] as const,
};

// Generate unique protocol code
function generateProtocolCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Fetch protocols with filters
async function fetchProtocols(filters?: {
  status?: 'active' | 'expired' | 'resolved';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = createClient();
  
  let query = supabase
    .from("protocols")
    .select(`
      *,
      contact:contacts(name, phone, avatar),
      sender:profiles(name)
    `, { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  
  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }
  
  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }
  
  if (filters?.search) {
    query = query.or(`code.ilike.%${filters.search}%,contact.name.ilike.%${filters.search}%`);
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  
  if (error) throw error;
  
  const protocols: Protocol[] = (data || []).map((item) => ({
    id: item.id,
    code: item.code,
    conversation_id: item.conversation_id,
    contact_id: item.contact_id,
    contact_name: item.contact?.name || "Unknown",
    contact_phone: item.contact?.phone || "",
    contact_avatar: item.contact?.avatar,
    message: item.message,
    sent_by: item.sent_by,
    sent_by_name: item.sender?.name || "Unknown",
    sent_at: item.sent_at,
    created_at: item.created_at,
    status: item.status,
    expires_at: item.expires_at,
    resolved_at: item.resolved_at,
    resolved_by: item.resolved_by,
    notes: item.notes,
  }));
  
  return { protocols, count: count || 0 };
}

// Fetch protocol stats
async function fetchProtocolStats(): Promise<ProtocolStats> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("protocols")
    .select("status, created_at, resolved_at");
  
  if (error) throw error;
  
  const stats: ProtocolStats = {
    total_protocols: data?.length || 0,
    active_count: 0,
    expired_count: 0,
    resolved_count: 0,
    avg_resolution_time_hours: 0,
  };
  
  let totalResolutionHours = 0;
  let resolvedCount = 0;
  
  data?.forEach((protocol) => {
    if (protocol.status === "active") stats.active_count++;
    if (protocol.status === "expired") stats.expired_count++;
    if (protocol.status === "resolved") {
      stats.resolved_count++;
      if (protocol.resolved_at && protocol.created_at) {
        const resolved = new Date(protocol.resolved_at);
        const created = new Date(protocol.created_at);
        const hours = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
        totalResolutionHours += hours;
        resolvedCount++;
      }
    }
  });
  
  stats.avg_resolution_time_hours = resolvedCount > 0 ? totalResolutionHours / resolvedCount : 0;
  
  return stats;
}

// Create protocol
async function createProtocol(data: {
  conversation_id: string;
  contact_id: string;
  message: string;
  sent_by: string;
}) {
  const supabase = createClient();
  
  const code = generateProtocolCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration
  
  const { data: protocol, error } = await supabase
    .from("protocols")
    .insert({
      code,
      conversation_id: data.conversation_id,
      contact_id: data.contact_id,
      message: data.message,
      sent_by: data.sent_by,
      sent_at: new Date().toISOString(),
      status: "active",
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;
  return protocol;
}

// Resolve protocol
async function resolveProtocol(id: string, resolvedBy: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("protocols")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// Hooks
// ============================================

export function useProtocols(filters?: {
  status?: 'active' | 'expired' | 'resolved';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: protocolKeys.list(filters),
    queryFn: () => fetchProtocols(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProtocolStats() {
  return useQuery({
    queryKey: protocolKeys.stats(),
    queryFn: fetchProtocolStats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateProtocol() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createProtocol,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: protocolKeys.all });
      toast.success("Protocolo gerado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar protocolo", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    },
  });
}

export function useResolveProtocol() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, resolvedBy }: { id: string; resolvedBy: string }) =>
      resolveProtocol(id, resolvedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: protocolKeys.all });
      toast.success("Protocolo resolvido!");
    },
    onError: (error) => {
      toast.error("Erro ao resolver protocolo", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    },
  });
}

// Realtime subscription
export function useProtocolsRealtime() {
  const queryClient = useQueryClient();
  
  return {
    subscribe: () => {
      const supabase = createClient();
      
      const subscription = supabase
        .channel("protocols_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "protocols" },
          () => {
            queryClient.invalidateQueries({ queryKey: protocolKeys.all });
          }
        )
        .subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
    },
  };
}
