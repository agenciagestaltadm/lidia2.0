"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface SystemSettingsState {
  settings: Record<string, string>;
  loading: boolean;
  error: string | null;
}

// Default settings (used as fallback)
const defaultSettings: Record<string, string> = {
  // General
  app_name: "LIDIA CRM",
  api_url: "https://api.lidia.com",
  timezone: "America/Sao_Paulo",
  
  // Security
  require_2fa: "false",
  block_suspicious_ips: "true",
  single_session: "false",
  
  // Database
  backup_enabled: "true",
  backup_frequency: "Diário",
  backup_retention_days: "30",
  last_backup: new Date().toISOString(),
  
  // Email
  smtp_host: "smtp.lidia.com",
  smtp_port: "587",
  smtp_email: "noreply@lidia.com",
  
  // Notifications
  notify_new_company: "true",
  notify_api_error: "true",
  notify_payment: "true",
  notify_suspicious_login: "true",
  notify_backup_complete: "false",
  notify_user_limit: "true",
};

export function useSystemSettings() {
  const [state, setState] = useState<SystemSettingsState>({
    settings: defaultSettings,
    loading: true,
    error: null,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), []);

  const fetchSettings = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Try to fetch from system_settings table
      const { data, error } = await supabase
        .from("system_settings")
        .select("*");

      if (error) {
        // If table doesn't exist, use defaults
        if (error.code === "42P01") {
          console.warn("system_settings table not found, using defaults");
          setState({
            settings: defaultSettings,
            loading: false,
            error: null,
          });
          return;
        }
        throw error;
      }

      // Convert array to object
      const settingsMap: Record<string, string> = { ...defaultSettings };
      if (data) {
        data.forEach((setting: SystemSetting) => {
          settingsMap[setting.key] = setting.value;
        });
      }

      setState({
        settings: settingsMap,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error("Error fetching system settings:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Erro ao carregar configurações",
      }));
    }
  }, [supabase]);

  const updateSetting = useCallback(
    async (key: string, value: string): Promise<{ success: boolean; error?: string }> => {
      try {
        // Try to upsert the setting
        const { error } = await supabase
          .from("system_settings")
          .upsert(
            { key, value, updated_at: new Date().toISOString() },
            { onConflict: "key" }
          );

        if (error) {
          // If table doesn't exist, just update local state
          if (error.code === "42P01") {
            setState((prev) => ({
              ...prev,
              settings: { ...prev.settings, [key]: value },
            }));
            return { success: true };
          }
          throw error;
        }

        // Update local state
        setState((prev) => ({
          ...prev,
          settings: { ...prev.settings, [key]: value },
        }));

        return { success: true };
      } catch (err) {
        console.error("Error updating setting:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao atualizar configuração",
        };
      }
    },
    [supabase]
  );

  const updateMultipleSettings = useCallback(
    async (updates: Record<string, string>): Promise<{ success: boolean; error?: string }> => {
      try {
        const promises = Object.entries(updates).map(([key, value]) =>
          supabase
            .from("system_settings")
            .upsert(
              { key, value, updated_at: new Date().toISOString() },
              { onConflict: "key" }
            )
        );

        const results = await Promise.all(promises);
        
        // Check for errors
        const errors = results.filter((r) => r.error);
        if (errors.length > 0) {
          // If all errors are "table not found", just update local state
          const allTableNotFound = errors.every((e) => e.error?.code === "42P01");
          if (allTableNotFound) {
            setState((prev) => ({
              ...prev,
              settings: { ...prev.settings, ...updates },
            }));
            return { success: true };
          }
          throw new Error("Some settings failed to update");
        }

        // Update local state
        setState((prev) => ({
          ...prev,
          settings: { ...prev.settings, ...updates },
        }));

        return { success: true };
      } catch (err) {
        console.error("Error updating settings:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao atualizar configurações",
        };
      }
    },
    [supabase]
  );

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const refetch = useCallback(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    ...state,
    refetch,
    updateSetting,
    updateMultipleSettings,
  };
}
