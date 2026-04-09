"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// Available webhook events based on Meta WhatsApp Business API
export const WABA_WEBHOOK_EVENTS = [
  { id: "messages", label: "Mensagens", version: "v24.0", description: "Receber mensagens de usuários" },
  { id: "message_status", label: "Status de Mensagens", version: "v24.0", description: "Atualizações de status (enviado, entregue, lido)" },
  { id: "message_template_status_update", label: "Status de Templates", version: "v24.0", description: "Mudanças no status de templates" },
  { id: "account_alerts", label: "Alertas da Conta", version: "v24.0", description: "Alertas importantes da conta" },
  { id: "account_review_update", label: "Atualização de Revisão", version: "v24.0", description: "Atualizações de revisão da conta" },
  { id: "account_settings_update", label: "Configurações da Conta", version: "v24.0", description: "Mudanças nas configurações" },
  { id: "business_capability_update", label: "Capacidades do Negócio", version: "v24.0", description: "Atualizações de capacidades" },
  { id: "business_status_update", label: "Status do Negócio", version: "v24.0", description: "Mudanças no status do negócio" },
  { id: "phone_number_quality_update", label: "Qualidade do Número", version: "v24.0", description: "Atualizações de qualidade" },
  { id: "phone_number_name_update", label: "Nome do Número", version: "v24.0", description: "Mudanças no nome do número" },
  { id: "template_category_update", label: "Categoria de Templates", version: "v24.0", description: "Atualizações de categoria" },
] as const;

export type WABAWebhookEvent = typeof WABA_WEBHOOK_EVENTS[number]["id"];

export interface WebhookConfig {
  id: string;
  company_id: string;
  waba_config_id?: string;
  webhook_url: string;
  webhook_verify_token: string;
  webhook_events: WABAWebhookEvent[];
  account_uuid?: string;
  created_at: string;
  updated_at: string;
}

// Generate a random 32-character verification token
export function generateVerifyToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// Build webhook URL dynamically based on current domain
export function buildWebhookUrl(accountId: string): string {
  if (typeof window === "undefined") {
    return `/api/webhook/whatsapp/${accountId}`;
  }
  
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}/api/webhook/whatsapp/${accountId}`;
}

// Get full webhook URL with domain
export function getFullWebhookUrl(accountId: string): string {
  return buildWebhookUrl(accountId);
}

// Hook for managing WABA webhooks
export function useWABAWebhook() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Generate and save a new verification token
  const regenerateToken = useCallback(async (configId: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const newToken = generateVerifyToken();
      
      const { error } = await supabase
        .from("waba_configs")
        .update({ 
          verify_token: newToken,
          updated_at: new Date().toISOString()
        })
        .eq("id", configId);

      if (error) throw error;
      
      toast.success("Novo token gerado com sucesso!");
      return newToken;
    } catch (error) {
      console.error("Error regenerating token:", error);
      toast.error("Erro ao gerar novo token");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Save webhook configuration
  const saveWebhook = useCallback(async (
    configId: string, 
    data: {
      webhook_url?: string;
      webhook_verify_token?: string;
      webhook_events?: WABAWebhookEvent[];
    }
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("waba_configs")
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq("id", configId);

      if (error) throw error;
      
      toast.success("Configuração do webhook salva!");
      return true;
    } catch (error) {
      console.error("Error saving webhook:", error);
      toast.error("Erro ao salvar configuração");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Update subscribed events
  const updateWebhookEvents = useCallback(async (
    configId: string,
    events: WABAWebhookEvent[]
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("waba_configs")
        .update({
          webhook_events: events,
          updated_at: new Date().toISOString()
        })
        .eq("id", configId);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error("Error updating webhook events:", error);
      toast.error("Erro ao atualizar eventos");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Copy text to clipboard
  const copyToClipboard = useCallback(async (text: string, label: string = "Texto"): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado para a área de transferência!`);
      return true;
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast.error("Erro ao copiar");
      return false;
    }
  }, []);

  // Initialize webhook for a new config
  const initializeWebhook = useCallback(async (configId: string, companyId: string): Promise<{
    webhookUrl: string;
    verifyToken: string;
  } | null> => {
    setIsLoading(true);
    try {
      // Generate account UUID if not exists
      const { data: config, error: fetchError } = await supabase
        .from("waba_configs")
        .select("account_uuid, verify_token")
        .eq("id", configId)
        .single();

      if (fetchError) throw fetchError;

      let accountUuid = config?.account_uuid;
      let verifyToken = config?.verify_token;

      // Generate new UUID if not exists
      if (!accountUuid) {
        // Generate UUID locally using crypto API
        accountUuid = crypto.randomUUID();
      }

      // Generate new token if not exists
      if (!verifyToken) {
        verifyToken = generateVerifyToken();
      }

      const webhookUrl = buildWebhookUrl(accountUuid);

      // Update config with webhook info
      const { error: updateError } = await supabase
        .from("waba_configs")
        .update({
          account_uuid: accountUuid,
          verify_token: verifyToken,
          webhook_url: webhookUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", configId);

      if (updateError) throw updateError;

      return {
        webhookUrl,
        verifyToken
      };
    } catch (error) {
      console.error("Error initializing webhook:", error);
      toast.error("Erro ao inicializar webhook");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Get webhook config by company
  const getWebhookConfig = useCallback(async (companyId: string): Promise<WebhookConfig | null> => {
    console.log("getWebhookConfig called for company:", companyId);
    try {
      console.log("Querying waba_configs table...");
      const { data, error } = await supabase
        .from("waba_configs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      console.log("Query result - data:", data, "error:", error);

      if (error) {
        console.log("Error code:", error.code);
        if (error.code === "PGRST116") return null; // No rows found
        throw error;
      }

      return {
        ...data,
        webhook_events: data.webhook_events || ["messages", "message_template_status_update", "account_alerts"]
      } as WebhookConfig;
    } catch (error) {
      console.error("Error fetching webhook config:", error);
      throw error; // Re-throw to let caller handle it
    }
  }, [supabase]);

  return {
    isLoading,
    generateVerifyToken,
    buildWebhookUrl,
    getFullWebhookUrl,
    regenerateToken,
    saveWebhook,
    updateWebhookEvents,
    copyToClipboard,
    initializeWebhook,
    getWebhookConfig,
    WABA_WEBHOOK_EVENTS
  };
}

// Hook for managing WABA connections (multiple connections per company)
export function useWABAConnections() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  // Create a new WABA connection
  const createConnection = useCallback(async (data: {
    company_id: string;
    name: string;
    phone_number_id: string;
    business_account_id: string;
    access_token: string;
    api_version?: string;
    created_by?: string;
  }): Promise<{ id: string; webhookUrl: string; verifyToken: string } | null> => {
    setIsLoading(true);
    try {
      const accountUuid = crypto.randomUUID();
      const verifyToken = generateVerifyToken();
      const webhookUrl = typeof window !== "undefined" 
        ? `${window.location.protocol}//${window.location.host}/api/webhook/whatsapp/${accountUuid}`
        : `/api/webhook/whatsapp/${accountUuid}`;

      const { data: connection, error } = await supabase
        .from("waba_connections")
        .insert({
          ...data,
          api_version: data.api_version || "v18.0",
          webhook_url: webhookUrl,
          webhook_verify_token: verifyToken,
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Conexão criada com sucesso!");
      
      return {
        id: connection.id,
        webhookUrl,
        verifyToken
      };
    } catch (error) {
      console.error("Error creating connection:", error);
      toast.error("Erro ao criar conexão");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Get connections by company
  const getConnections = useCallback(async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from("waba_connections")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching connections:", error);
      return [];
    }
  }, [supabase]);

  // Update connection status
  const updateStatus = useCallback(async (
    connectionId: string, 
    status: "pending" | "connected" | "error" | "disconnected",
    errorMessage?: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("waba_connections")
        .update({
          status,
          last_error: errorMessage || null,
          last_sync_at: status === "connected" ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString()
        })
        .eq("id", connectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating connection status:", error);
      return false;
    }
  }, [supabase]);

  // Delete connection
  const deleteConnection = useCallback(async (connectionId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("waba_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;
      
      toast.success("Conexão removida com sucesso!");
      return true;
    } catch (error) {
      console.error("Error deleting connection:", error);
      toast.error("Erro ao remover conexão");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Regenerate webhook token for connection
  const regenerateConnectionToken = useCallback(async (connectionId: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const newToken = generateVerifyToken();
      
      const { error } = await supabase
        .from("waba_connections")
        .update({ 
          webhook_verify_token: newToken,
          updated_at: new Date().toISOString()
        })
        .eq("id", connectionId);

      if (error) throw error;
      
      toast.success("Novo token gerado com sucesso!");
      return newToken;
    } catch (error) {
      console.error("Error regenerating token:", error);
      toast.error("Erro ao gerar novo token");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  return {
    isLoading,
    createConnection,
    getConnections,
    updateStatus,
    deleteConnection,
    regenerateConnectionToken
  };
}
