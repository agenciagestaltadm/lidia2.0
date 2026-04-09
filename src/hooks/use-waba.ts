"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { WABAConfig, WABAConfigFormData } from "@/types/waba";
import { toast } from "sonner";

// Query keys
export const wabaKeys = {
  all: ["waba"] as const,
  configs: (companyId?: string) => [...wabaKeys.all, "configs", companyId] as const,
  config: (id: string) => [...wabaKeys.all, "config", id] as const,
  connections: (companyId?: string) => [...wabaKeys.all, "connections", companyId] as const,
  connection: (id: string) => [...wabaKeys.all, "connection", id] as const,
};

// Fetch WABA configs for a company
async function fetchWABAConfigs(companyId?: string): Promise<WABAConfig[]> {
  if (!companyId) return [];
  
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("waba_configs")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as WABAConfig[]) || [];
}

// Fetch single WABA config
async function fetchWABAConfig(configId: string): Promise<WABAConfig | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("waba_configs")
    .select("*")
    .eq("id", configId)
    .single();

  if (error) throw error;
  return data as WABAConfig | null;
}

// Create WABA config
async function createWABAConfig(
  data: WABAConfigFormData & { company_id: string; created_by: string }
): Promise<WABAConfig> {
  const supabase = createClient();

  const { data: config, error } = await supabase
    .from("waba_configs")
    .insert({
      company_id: data.company_id,
      name: data.name,
      phone_number_id: data.phone_number_id,
      business_account_id: data.business_account_id,
      access_token: data.access_token,
      webhook_url: data.webhook_url || null,
      status: 'pending',
      created_by: data.created_by,
    })
    .select()
    .single();

  if (error) throw error;
  return config as WABAConfig;
}

// Update WABA config
async function updateWABAConfig(
  configId: string,
  data: Partial<WABAConfigFormData>
): Promise<WABAConfig> {
  const supabase = createClient();

  const updateData: Record<string, unknown> = { ...data };
  if (data.access_token === '') delete updateData.access_token;

  const { data: config, error } = await supabase
    .from("waba_configs")
    .update(updateData)
    .eq("id", configId)
    .select()
    .single();

  if (error) throw error;
  return config as WABAConfig;
}

// Delete WABA config
async function deleteWABAConfig(configId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("waba_configs")
    .delete()
    .eq("id", configId);

  if (error) throw error;
}

// Test WABA connection
async function testWABAConnection(config: WABAConfigFormData): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const response = await fetch('/api/waba/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  return response.json();
}

// Sync templates from Meta
async function syncTemplates(configId: string): Promise<{
  success: boolean;
  synced_count?: number;
  error?: string;
}> {
  const response = await fetch(`/api/waba/templates/sync?configId=${configId}`, {
    method: 'POST',
  });

  return response.json();
}

// Hooks

export function useWABAConfigs(companyId?: string) {
  return useQuery({
    queryKey: wabaKeys.configs(companyId),
    queryFn: () => fetchWABAConfigs(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useWABAConfig(configId: string) {
  return useQuery({
    queryKey: wabaKeys.config(configId),
    queryFn: () => fetchWABAConfig(configId),
    enabled: !!configId,
  });
}

export function useCreateWABAConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWABAConfig,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: wabaKeys.configs(variables.company_id) 
      });
      toast.success("Configuração WABA criada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating WABA config:", error);
      toast.error("Erro ao criar configuração WABA");
    },
  });
}

export function useUpdateWABAConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ configId, data }: { configId: string; data: Partial<WABAConfigFormData> }) =>
      updateWABAConfig(configId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: wabaKeys.config(variables.configId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: wabaKeys.all 
      });
      toast.success("Configuração atualizada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error updating WABA config:", error);
      toast.error("Erro ao atualizar configuração");
    },
  });
}

export function useDeleteWABAConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWABAConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wabaKeys.all });
      toast.success("Configuração removida com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error deleting WABA config:", error);
      toast.error("Erro ao remover configuração");
    },
  });
}

export function useTestWABAConnection() {
  return useMutation({
    mutationFn: testWABAConnection,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Conexão testada com sucesso!");
      } else {
        toast.error(data.error || "Erro ao testar conexão");
      }
    },
    onError: (error: Error) => {
      console.error("Error testing WABA connection:", error);
      toast.error("Erro ao testar conexão");
    },
  });
}

export function useSyncTemplates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncTemplates,
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["waba", "templates"] });
        toast.success(`${data.synced_count} templates sincronizados!`);
      } else {
        toast.error(data.error || "Erro ao sincronizar templates");
      }
    },
    onError: (error: Error) => {
      console.error("Error syncing templates:", error);
      toast.error("Erro ao sincronizar templates");
    },
  });
}

// ============================================
// WABA CONNECTIONS (Multiple connections per company)
// ============================================

export interface WABAConnection {
  id: string;
  company_id: string;
  waba_config_id?: string;
  name: string;
  phone_number_id: string;
  business_account_id: string;
  api_version: string;
  webhook_url: string;
  webhook_verify_token: string;
  webhook_events: string[];
  status: "pending" | "connected" | "error" | "disconnected";
  last_sync_at?: string;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface WABAConnectionFormData {
  name: string;
  phone_number_id: string;
  business_account_id: string;
  access_token: string;
  api_version?: string;
}

// Fetch WABA connections for a company
async function fetchWABAConnections(companyId?: string): Promise<WABAConnection[]> {
  if (!companyId) return [];
  
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("waba_connections")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as WABAConnection[]) || [];
}

// Fetch single WABA connection
async function fetchWABAConnection(connectionId: string): Promise<WABAConnection | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("waba_connections")
    .select("*")
    .eq("id", connectionId)
    .single();

  if (error) throw error;
  return data as WABAConnection | null;
}

// Create WABA connection
async function createWABAConnection(
  data: WABAConnectionFormData & { company_id: string; created_by: string; webhook_url: string; webhook_verify_token: string }
): Promise<WABAConnection> {
  const supabase = createClient();

  const { data: connection, error } = await supabase
    .from("waba_connections")
    .insert({
      company_id: data.company_id,
      name: data.name,
      phone_number_id: data.phone_number_id,
      business_account_id: data.business_account_id,
      access_token: data.access_token,
      api_version: data.api_version || "v18.0",
      webhook_url: data.webhook_url,
      webhook_verify_token: data.webhook_verify_token,
      status: "pending",
      created_by: data.created_by,
    })
    .select()
    .single();

  if (error) throw error;
  return connection as WABAConnection;
}

// Update WABA connection
async function updateWABAConnection(
  connectionId: string,
  data: Partial<WABAConnectionFormData>
): Promise<WABAConnection> {
  const supabase = createClient();

  const updateData: Record<string, unknown> = { ...data };
  if (data.access_token === "") delete updateData.access_token;

  const { data: connection, error } = await supabase
    .from("waba_connections")
    .update(updateData)
    .eq("id", connectionId)
    .select()
    .single();

  if (error) throw error;
  return connection as WABAConnection;
}

// Delete WABA connection
async function deleteWABAConnection(connectionId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("waba_connections")
    .delete()
    .eq("id", connectionId);

  if (error) throw error;
}

// Update webhook events
async function updateConnectionWebhookEvents(
  connectionId: string,
  events: string[]
): Promise<WABAConnection> {
  const supabase = createClient();

  const { data: connection, error } = await supabase
    .from("waba_connections")
    .update({
      webhook_events: events,
      updated_at: new Date().toISOString()
    })
    .eq("id", connectionId)
    .select()
    .single();

  if (error) throw error;
  return connection as WABAConnection;
}

// Hooks for WABA Connections

export function useWABAConnections(companyId?: string) {
  return useQuery({
    queryKey: wabaKeys.connections(companyId),
    queryFn: () => fetchWABAConnections(companyId),
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWABAConnection(connectionId: string) {
  return useQuery({
    queryKey: wabaKeys.connection(connectionId),
    queryFn: () => fetchWABAConnection(connectionId),
    enabled: !!connectionId,
  });
}

export function useCreateWABAConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWABAConnection,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: wabaKeys.connections(variables.company_id) 
      });
      toast.success("Conexão WABA criada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating WABA connection:", error);
      toast.error("Erro ao criar conexão WABA");
    },
  });
}

export function useUpdateWABAConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ connectionId, data }: { connectionId: string; data: Partial<WABAConnectionFormData> }) =>
      updateWABAConnection(connectionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: wabaKeys.connection(variables.connectionId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: wabaKeys.all 
      });
      toast.success("Conexão atualizada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error updating WABA connection:", error);
      toast.error("Erro ao atualizar conexão");
    },
  });
}

export function useDeleteWABAConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWABAConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: wabaKeys.all });
      toast.success("Conexão removida com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error deleting WABA connection:", error);
      toast.error("Erro ao remover conexão");
    },
  });
}

export function useUpdateConnectionWebhookEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ connectionId, events }: { connectionId: string; events: string[] }) =>
      updateConnectionWebhookEvents(connectionId, events),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: wabaKeys.connection(variables.connectionId) 
      });
      toast.success("Eventos do webhook atualizados!");
    },
    onError: (error: Error) => {
      console.error("Error updating webhook events:", error);
      toast.error("Erro ao atualizar eventos");
    },
  });
}
