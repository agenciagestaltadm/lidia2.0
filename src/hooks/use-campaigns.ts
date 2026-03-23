"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { 
  BulkCampaign, 
  BulkCampaignFormData, 
  BulkCampaignRecipient,
  CampaignStats,
  CampaignFilters,
  CampaignProgress,
  ContactSelectionMode,
  CSVContact
} from "@/types/campaigns";
import { toast } from "sonner";

// Query keys
export const campaignKeys = {
  all: ["campaigns"] as const,
  list: (filters?: CampaignFilters) => [...campaignKeys.all, "list", filters] as const,
  detail: (id: string) => [...campaignKeys.all, "detail", id] as const,
  recipients: (campaignId: string) => [...campaignKeys.all, "recipients", campaignId] as const,
  stats: (campaignId: string) => [...campaignKeys.all, "stats", campaignId] as const,
  progress: (campaignId: string) => [...campaignKeys.all, "progress", campaignId] as const,
};

// Fetch campaigns with filters
async function fetchCampaigns(
  companyId?: string, 
  filters?: CampaignFilters
): Promise<BulkCampaign[]> {
  if (!companyId) return [];
  
  const supabase = createClient();
  
  let query = supabase
    .from("bulk_campaigns")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.ilike("name", `%${filters.search}%`);
  }

  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as BulkCampaign[]) || [];
}

// Fetch single campaign
async function fetchCampaign(campaignId: string): Promise<BulkCampaign | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("bulk_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (error) throw error;
  return data as BulkCampaign | null;
}

// Fetch campaign recipients
async function fetchCampaignRecipients(
  campaignId: string
): Promise<BulkCampaignRecipient[]> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("bulk_campaign_recipients")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as BulkCampaignRecipient[]) || [];
}

// Fetch campaign stats
async function fetchCampaignStats(campaignId: string): Promise<CampaignStats | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("bulk_campaign_stats")
    .select("*")
    .eq("campaign_id", campaignId)
    .single();

  if (error) throw error;
  return data as CampaignStats | null;
}

// Create campaign
async function createCampaign(
  data: BulkCampaignFormData & { company_id: string; created_by: string }
): Promise<BulkCampaign> {
  const supabase = createClient();

  const { data: campaign, error } = await supabase
    .from("bulk_campaigns")
    .insert({
      company_id: data.company_id,
      waba_config_id: data.waba_config_id,
      name: data.name,
      description: data.description || null,
      template_id: data.template_id || null,
      custom_message: data.custom_message || null,
      template_variables: data.template_variables || [],
      min_interval_seconds: data.min_interval_seconds,
      max_interval_seconds: data.max_interval_seconds,
      scheduled_at: data.scheduled_at || null,
      contact_selection_mode: data.contact_selection_mode,
      selected_contact_ids: data.selected_contact_ids || null,
      csv_data: data.csv_data || null,
      status: data.scheduled_at ? 'scheduled' : 'draft',
      created_by: data.created_by,
    })
    .select()
    .single();

  if (error) throw error;
  return campaign as BulkCampaign;
}

// Start campaign
async function startCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`/api/bulk/campaigns/${campaignId}/start`, {
    method: 'POST',
  });

  return response.json();
}

// Pause campaign
async function pauseCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(`/api/bulk/campaigns/${campaignId}/pause`, {
    method: 'POST',
  });

  return response.json();
}

// Cancel campaign
async function cancelCampaign(
  campaignId: string,
  cancelledBy: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.rpc('cancel_campaign', {
    p_campaign_id: campaignId,
    p_cancelled_by: cancelledBy,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// Delete campaign
async function deleteCampaign(campaignId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("bulk_campaigns")
    .delete()
    .eq("id", campaignId);

  if (error) throw error;
}

// Calculate campaign progress
function calculateProgress(campaign: BulkCampaign): CampaignProgress {
  const total = campaign.total_recipients;
  const sent = campaign.sent_count;
  const delivered = campaign.delivered_count;
  const read = campaign.read_count;
  const failed = campaign.failed_count;
  const pending = total - sent - failed;
  
  const percentage = total > 0 ? Math.round((sent / total) * 100) : 0;

  return {
    campaign_id: campaign.id,
    status: campaign.status,
    total,
    sent,
    delivered,
    read,
    failed,
    pending: Math.max(0, pending),
    percentage,
  };
}

// Hooks

export function useCampaigns(companyId?: string, filters?: CampaignFilters) {
  return useQuery({
    queryKey: campaignKeys.list(filters),
    queryFn: () => fetchCampaigns(companyId, filters),
    enabled: !!companyId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCampaign(campaignId: string) {
  return useQuery({
    queryKey: campaignKeys.detail(campaignId),
    queryFn: () => fetchCampaign(campaignId),
    enabled: !!campaignId,
  });
}

export function useCampaignRecipients(campaignId: string) {
  return useQuery({
    queryKey: campaignKeys.recipients(campaignId),
    queryFn: () => fetchCampaignRecipients(campaignId),
    enabled: !!campaignId,
    refetchInterval: (query) => {
      const data = query.state.data as BulkCampaignRecipient[] | undefined;
      if (!data) return false;
      
      // Check if all recipients are processed
      const hasPending = data.some(r => 
        r.status === 'pending' || r.status === 'queued' || r.status === 'sending'
      );
      
      return hasPending ? 5000 : false; // Poll every 5 seconds if pending
    },
  });
}

export function useCampaignStats(campaignId: string) {
  return useQuery({
    queryKey: campaignKeys.stats(campaignId),
    queryFn: () => fetchCampaignStats(campaignId),
    enabled: !!campaignId,
    refetchInterval: 5000, // Poll every 5 seconds
  });
}

export function useCampaignProgress(campaign: BulkCampaign | null | undefined) {
  return useQuery({
    queryKey: campaignKeys.progress(campaign?.id || ''),
    queryFn: () => campaign ? calculateProgress(campaign) : null,
    enabled: !!campaign,
    refetchInterval: (query) => {
      const data = query.state.data as CampaignProgress | undefined | null;
      if (!data) return false;
      
      // Continue polling if campaign is running or scheduled
      if (data.status === 'running' || data.status === 'scheduled') {
        return 3000; // Poll every 3 seconds
      }
      
      return false;
    },
    initialData: campaign ? calculateProgress(campaign) : undefined,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCampaign,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: campaignKeys.list() 
      });
      toast.success("Campanha criada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating campaign:", error);
      toast.error("Erro ao criar campanha");
    },
  });
}

export function useStartCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startCampaign,
    onSuccess: (result, campaignId) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: campaignKeys.detail(campaignId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: campaignKeys.list() 
        });
        toast.success("Campanha iniciada!");
      } else {
        toast.error(result.error || "Erro ao iniciar campanha");
      }
    },
    onError: (error: Error) => {
      console.error("Error starting campaign:", error);
      toast.error("Erro ao iniciar campanha");
    },
  });
}

export function usePauseCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: pauseCampaign,
    onSuccess: (result, campaignId) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: campaignKeys.detail(campaignId) 
        });
        toast.success("Campanha pausada!");
      } else {
        toast.error(result.error || "Erro ao pausar campanha");
      }
    },
    onError: (error: Error) => {
      console.error("Error pausing campaign:", error);
      toast.error("Erro ao pausar campanha");
    },
  });
}

export function useCancelCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, cancelledBy }: { campaignId: string; cancelledBy: string }) =>
      cancelCampaign(campaignId, cancelledBy),
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ 
          queryKey: campaignKeys.detail(variables.campaignId) 
        });
        queryClient.invalidateQueries({ 
          queryKey: campaignKeys.list() 
        });
        toast.success("Campanha cancelada!");
      } else {
        toast.error(result.error || "Erro ao cancelar campanha");
      }
    },
    onError: (error: Error) => {
      console.error("Error cancelling campaign:", error);
      toast.error("Erro ao cancelar campanha");
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      toast.success("Campanha removida com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error deleting campaign:", error);
      toast.error("Erro ao remover campanha");
    },
  });
}
