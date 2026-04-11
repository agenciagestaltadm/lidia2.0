"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { SalesFunnelDeal, FunnelStats, FunnelStage } from "@/types/atendimento";
import { toast } from "sonner";

const SUPABASE_TIMEOUT = 15000;

// Query keys
export const funnelKeys = {
  all: ["sales-funnel"] as const,
  deals: (filters?: Record<string, unknown>) => [...funnelKeys.all, "deals", filters] as const,
  stats: () => [...funnelKeys.all, "stats"] as const,
  deal: (id: string) => [...funnelKeys.all, "deal", id] as const,
};

// Fetch deals with filters
async function fetchDeals(filters?: {
  stage?: FunnelStage;
  assignedTo?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const supabase = createClient();
  
  let query = supabase
    .from("sales_funnel")
    .select(`
      *,
      contact:contacts(name, phone, avatar),
      assignee:profiles(name, avatar)
    `)
    .order("updated_at", { ascending: false });

  if (filters?.stage) {
    query = query.eq("stage", filters.stage);
  }
  
  if (filters?.assignedTo) {
    query = query.eq("assigned_to", filters.assignedTo);
  }
  
  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }
  
  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  
  // Transform data
  return (data || []).map((item: any): SalesFunnelDeal => ({
    id: item.id,
    contact_id: item.contact_id,
    contact_name: item.contact?.name || "Unknown",
    contact_phone: item.contact?.phone || "",
    contact_avatar: item.contact?.avatar,
    stage: item.stage,
    probability: item.probability,
    estimated_value: item.estimated_value,
    notes: item.notes,
    created_at: item.created_at,
    updated_at: item.updated_at,
    assigned_to: item.assigned_to,
    assigned_name: item.assignee?.name,
    assigned_avatar: item.assignee?.avatar,
    expected_close_date: item.expected_close_date,
    last_activity: item.last_activity,
    tags: item.tags,
  }));
}

// Fetch funnel stats
async function fetchFunnelStats(): Promise<FunnelStats> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("sales_funnel_stats")
    .select("*")
    .single();
  
  if (error) {
    // If RPC doesn't exist, calculate manually
    const { data: deals } = await supabase.from("sales_funnel").select("stage, estimated_value, probability");
    
    const stats: FunnelStats = {
      total_deals: deals?.length || 0,
      total_value: 0,
      weighted_value: 0,
      conversion_rate: 0,
      avg_deal_value: 0,
      deals_by_stage: { new: 0, qualified: 0, proposal: 0, negotiation: 0, closed_won: 0, closed_lost: 0 },
      value_by_stage: { new: 0, qualified: 0, proposal: 0, negotiation: 0, closed_won: 0, closed_lost: 0 },
    };
    
    deals?.forEach((deal: any) => {
      stats.total_value += deal.estimated_value;
      stats.weighted_value += deal.estimated_value * (deal.probability / 100);
      stats.deals_by_stage[deal.stage as FunnelStage]++;
      stats.value_by_stage[deal.stage as FunnelStage] += deal.estimated_value;
    });
    
    stats.avg_deal_value = stats.total_deals > 0 ? stats.total_value / stats.total_deals : 0;
    
    const won = stats.deals_by_stage.closed_won;
    const lost = stats.deals_by_stage.closed_lost;
    stats.conversion_rate = won + lost > 0 ? (won / (won + lost)) * 100 : 0;
    
    return stats;
  }
  
  return data;
}

// Create deal
async function createDeal(deal: Omit<SalesFunnelDeal, "id" | "created_at" | "updated_at">) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("sales_funnel")
    .insert({
      contact_id: deal.contact_id,
      stage: deal.stage,
      probability: deal.probability,
      estimated_value: deal.estimated_value,
      notes: deal.notes,
      assigned_to: deal.assigned_to,
      expected_close_date: deal.expected_close_date,
      tags: deal.tags,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Update deal
async function updateDeal(id: string, updates: Partial<SalesFunnelDeal>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("sales_funnel")
    .update({
      stage: updates.stage,
      probability: updates.probability,
      estimated_value: updates.estimated_value,
      notes: updates.notes,
      assigned_to: updates.assigned_to,
      expected_close_date: updates.expected_close_date,
      tags: updates.tags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Delete deal
async function deleteDeal(id: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("sales_funnel")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
}

// Move deal to stage
async function moveDealToStage(id: string, stage: FunnelStage) {
  const stageProbabilities: Record<FunnelStage, number> = {
    new: 10,
    qualified: 25,
    proposal: 50,
    negotiation: 75,
    closed_won: 100,
    closed_lost: 0,
  };
  
  return updateDeal(id, {
    stage,
    probability: stageProbabilities[stage],
  });
}

// ============================================
// Hooks
// ============================================

export function useSalesFunnel(filters?: {
  stage?: FunnelStage;
  assignedTo?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: funnelKeys.deals(filters),
    queryFn: () => fetchDeals(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useFunnelStats() {
  return useQuery({
    queryKey: funnelKeys.stats(),
    queryFn: fetchFunnelStats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: funnelKeys.all });
      toast.success("Negócio criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar negócio", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<SalesFunnelDeal> }) =>
      updateDeal(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: funnelKeys.all });
      queryClient.invalidateQueries({ queryKey: funnelKeys.deal(variables.id) });
      toast.success("Negócio atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: funnelKeys.all });
      toast.success("Negócio removido");
    },
    onError: (error) => {
      toast.error("Erro ao remover", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    },
  });
}

export function useMoveDeal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: FunnelStage }) =>
      moveDealToStage(id, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: funnelKeys.all });
      toast.success("Negócio movido!");
    },
    onError: (error) => {
      toast.error("Erro ao mover negócio", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    },
  });
}

// Realtime subscription hook
export function useFunnelRealtime() {
  const queryClient = useQueryClient();
  
  return {
    subscribe: () => {
      const supabase = createClient();
      
      const subscription = supabase
        .channel("sales_funnel_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "sales_funnel" },
          () => {
            queryClient.invalidateQueries({ queryKey: funnelKeys.all });
          }
        )
        .subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
    },
  };
}
