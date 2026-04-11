"use client";

import { useCallback, useState, useEffect, useRef } from "react";
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

// Build webhook URL for Edge Function
export function buildWebhookUrl(accountId: string): string {
  // Edge Function URL pattern (always uses the cloud Supabase URL):
  // https://<project-ref>.supabase.co/functions/v1/whatsapp-webhook/<account_uuid>
  //
  // IMPORTANT: Even in local development, the webhook URL must be publicly accessible
  // because Facebook/Meta servers need to reach it. The Supabase Edge Function runs
  // in the cloud, not locally.

  // Try to get project ref from dedicated env var first
  let supabaseProjectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || null;

  // Fallback: extract from NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseProjectRef) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ||
      (typeof window !== "undefined" ? window.__NEXT_DATA__?.props?.pageProps?.supabaseUrl : "");
    if (supabaseUrl) {
      try {
        const hostname = new URL(supabaseUrl).hostname;
        // Extract project ref: e.g. "mnesrdqzowtasvyqsjjn.supabase.co" -> "mnesrdqzowtasvyqsjjn"
        const match = hostname.match(/^([a-z0-9]+)\.supabase\.co$/);
        if (match) {
          supabaseProjectRef = match[1];
        }
      } catch {
        // Invalid URL, ignore
      }
    }
  }

  if (supabaseProjectRef) {
    return `https://${supabaseProjectRef}.supabase.co/functions/v1/whatsapp-webhook/${accountId}`;
  }

  // Final fallback (should not happen if NEXT_PUBLIC_SUPABASE_URL is set)
  console.warn("[buildWebhookUrl] Could not determine Supabase project ref. Using fallback.");
  return `https://mnesrdqzowtasvyqsjjn.supabase.co/functions/v1/whatsapp-webhook/${accountId}`;
}

// Get full webhook URL with domain
export function getFullWebhookUrl(accountId: string): string {
  return buildWebhookUrl(accountId);
}

// Hook for managing WABA webhooks
export function useWABAWebhook() {
  const [isLoading, setIsLoading] = useState(false);

  // Generate and save a new verification token
  const regenerateToken = useCallback(async (configId: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const newToken = generateVerifyToken();
      
      const { error } = await supabase
        .from("waba_configs")
        .update({ 
          verify_token: newToken,
          webhook_verify_token: newToken,
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
  }, []);

  // Save webhook configuration
  const saveWebhook = useCallback(async (
    configId: string, 
    data: {
      webhook_url?: string;
      verify_token?: string;
      webhook_events?: WABAWebhookEvent[];
    }
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const updateData: Record<string, unknown> = {
        ...data,
        updated_at: new Date().toISOString()
      };
      // Also update webhook_verify_token when verify_token is provided
      if (data.verify_token) {
        updateData.webhook_verify_token = data.verify_token;
      }

      const { error } = await supabase
        .from("waba_configs")
        .update(updateData)
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
  }, []);

  // Update subscribed events
  const updateWebhookEvents = useCallback(async (
    configId: string,
    events: WABAWebhookEvent[]
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const supabase = createClient();
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
  }, []);

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
      const supabase = createClient();
      // Generate account UUID if not exists
      const { data: config, error: fetchError } = await supabase
        .from("waba_configs")
        .select("account_uuid, verify_token")
        .eq("id", configId)
        .single();

      if (fetchError) throw fetchError;

      let accountUuid = config?.account_uuid;
      let verifyToken = config?.verify_token;

      console.log("[initializeWebhook] Current config:", {
        hasAccountUuid: !!accountUuid,
        hasVerifyToken: !!verifyToken,
      });

      // Generate new UUID if not exists
      if (!accountUuid) {
        // Generate UUID locally using crypto API
        accountUuid = crypto.randomUUID();
        console.log("[initializeWebhook] Generated new account_uuid:", accountUuid);
      }

      // Generate new token if not exists
      if (!verifyToken) {
        verifyToken = generateVerifyToken();
        console.log("[initializeWebhook] Generated new verify_token:", verifyToken);
      }

      const webhookUrl = buildWebhookUrl(accountUuid);
      console.log("[initializeWebhook] Webhook URL:", webhookUrl);

      // Update config with webhook info
      const { error: updateError } = await supabase
        .from("waba_configs")
        .update({
          account_uuid: accountUuid,
          verify_token: verifyToken,
          webhook_verify_token: verifyToken,
          webhook_url: webhookUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", configId);

      if (updateError) {
        console.error("[initializeWebhook] Error updating config:", updateError);
        throw updateError;
      }

      console.log("[initializeWebhook] Config saved successfully");

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
  }, []);

  // Get webhook config by company
  const getWebhookConfig = useCallback(async (companyId: string): Promise<WebhookConfig | null> => {
    console.log("getWebhookConfig called for company:", companyId);
    try {
      const supabase = createClient();
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
  }, []);

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
  const isSubmittingRef = useRef(false);

  // Create a new WABA connection
  const createConnection = useCallback(async (data: {
    company_id: string;
    name: string;
    phone_number_id: string;
    business_account_id: string;
    access_token: string;
    api_version?: string;
  }): Promise<{ id: string; webhookUrl: string; verifyToken: string } | null> => {
    // Prevent double submission
    if (isSubmittingRef.current) {
      console.warn("[createConnection] Submission already in progress, ignoring duplicate call");
      return null;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);

    // Safety timeout - force reset after 30s to prevent infinite loading
    const safetyTimeoutId = setTimeout(() => {
      if (isSubmittingRef.current) {
        console.error("[createConnection] Timeout after 30s - forcing reset");
        isSubmittingRef.current = false;
        setIsLoading(false);
        toast.error("A operação demorou demais. Tente novamente.");
      }
    }, 30000);

    try {
      const supabase = createClient();

      // Get the REAL auth user ID (not profiles.id which is a different UUID)
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
      }

      const accountUuid = crypto.randomUUID();
      const verifyToken = generateVerifyToken();
      const webhookUrl = buildWebhookUrl(accountUuid);

      console.log("[createConnection] Creating connection with:", {
        accountUuid,
        webhookUrl,
        authUserId: authUser.id,
        companyId: data.company_id
      });

      const insertData: Record<string, unknown> = {
        company_id: data.company_id,
        name: data.name,
        phone_number_id: data.phone_number_id,
        business_account_id: data.business_account_id,
        access_token: data.access_token,
        api_version: data.api_version || "v18.0",
        account_uuid: accountUuid,
        webhook_url: webhookUrl,
        webhook_verify_token: verifyToken,
        verify_token: verifyToken,
        created_by: authUser.id, // Use auth.users(id), NOT profiles.id
        status: "pending"
      };

      console.log("[createConnection] Inserting into waba_configs...");

      const { data: connection, error } = await supabase
        .from("waba_configs")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("[createConnection] Supabase insert error:", JSON.stringify({
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }, null, 2));
        throw error;
      }

      if (!connection) {
        console.error("[createConnection] Insert succeeded but no data returned - possible RLS SELECT issue");
        throw new Error("Conexão criada mas não foi possível ler os dados de volta. Verifique as políticas RLS.");
      }

      console.log("[createConnection] Connection created successfully:", connection.id);

      toast.success("Conexão criada com sucesso!");
      
      return {
        id: connection.id,
        webhookUrl,
        verifyToken
      };
    } catch (error) {
      console.error("[createConnection] Error creating connection:", error);
      const supabaseError = error as { message?: string; code?: string; details?: string; hint?: string };
      let errorMessage = "Erro ao criar conexão";
      
      if (supabaseError?.code === "23503") {
        errorMessage = "Erro de referência no banco de dados. Contate o suporte.";
      } else if (supabaseError?.code === "42501" || supabaseError?.message?.includes("policy")) {
        errorMessage = "Sem permissão para criar conexão. Verifique se seu usuário tem acesso.";
      } else if (supabaseError?.message) {
        errorMessage = supabaseError.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error("[createConnection] Final error message:", errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      clearTimeout(safetyTimeoutId);
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // Get connections by company
  const getConnections = useCallback(async (companyId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("waba_configs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching connections:", error);
      return [];
    }
  }, []);

  // Update connection status
  const updateStatus = useCallback(async (
    connectionId: string, 
    status: "pending" | "connected" | "error" | "disconnected",
    errorMessage?: string
  ): Promise<boolean> => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("waba_configs")
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
  }, []);

  // Delete connection
  const deleteConnection = useCallback(async (connectionId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("waba_configs")
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
  }, []);

  // Regenerate webhook token for connection
  const regenerateConnectionToken = useCallback(async (connectionId: string): Promise<string | null> => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const newToken = generateVerifyToken();
      
      const { error } = await supabase
        .from("waba_configs")
        .update({ 
          verify_token: newToken,
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
  }, []);

  return {
    isLoading,
    createConnection,
    getConnections,
    updateStatus,
    deleteConnection,
    regenerateConnectionToken
  };
}

// Hook for listing WABA configs in the connections page
export function useWABAConfigs() {
  const [wabaConfigs, setWabaConfigs] = useState<WABAConfigItem[]>([]);
  const [loading, setIsLoading] = useState(true);

  const fetchConfigs = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("waba_configs")
        .select("id, company_id, name, phone_number_id, business_account_id, status, account_uuid, verify_token, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWabaConfigs((data as WABAConfigItem[]) || []);
    } catch (error) {
      console.error("Error fetching WABA configs:", error);
      setWabaConfigs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteConnection = useCallback(async (connectionId: string): Promise<boolean> => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("waba_configs")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;
      toast.success("Conexão removida com sucesso!");
      await fetchConfigs();
      return true;
    } catch (error) {
      console.error("Error deleting WABA config:", error);
      toast.error("Erro ao remover conexão");
      return false;
    }
  }, [fetchConfigs]);

  // Fetch on mount
  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return {
    wabaConfigs,
    loading,
    refetch: fetchConfigs,
    deleteConnection,
  };
}

export interface WABAConfigItem {
  id: string;
  company_id: string;
  name: string;
  phone_number_id: string;
  business_account_id: string;
  status: string;
  account_uuid: string;
  verify_token: string;
  created_at: string;
  updated_at: string;
}
