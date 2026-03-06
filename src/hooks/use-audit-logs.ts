"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface AuditLog {
  id: string;
  action: string;
  actor_id: string;
  actor?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  company_id: string | null;
  company?: {
    id: string;
    name: string;
  };
  target_id: string | null;
  target_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface AuditLogsState {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

interface AuditLogFilters {
  action?: string;
  companyId?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
}

export function useAuditLogs(pageSize: number = 50) {
  const [state, setState] = useState<AuditLogsState>({
    logs: [],
    loading: true,
    error: null,
    totalCount: 0,
  });
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<AuditLogFilters>({});

  const supabase = createClient();

  const fetchLogs = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      let query = supabase
        .from("audit_logs")
        .select(
          `
          *,
          actor:actor_id (id, email, full_name),
          company:company_id (id, name)
        `,
          { count: "exact" }
        );

      // Apply filters
      if (filters.action) {
        query = query.eq("action", filters.action);
      }
      if (filters.companyId) {
        query = query.eq("company_id", filters.companyId);
      }
      if (filters.targetType) {
        query = query.eq("target_type", filters.targetType);
      }
      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate);
      }

      // Pagination
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      setState({
        logs: (data as AuditLog[]) || [],
        loading: false,
        error: null,
        totalCount: count || 0,
      });
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Erro ao carregar logs",
      }));
    }
  }, [supabase, page, pageSize, filters]);

  const createLog = useCallback(
    async (
      action: string,
      metadata: Record<string, unknown> = {},
      targetId?: string,
      targetType?: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const actorId = userData.user?.id;

        const { error } = await supabase.from("audit_logs").insert({
          action,
          actor_id: actorId,
          target_id: targetId,
          target_type: targetType,
          metadata,
        });

        if (error) throw error;

        await fetchLogs();
        return { success: true };
      } catch (err) {
        console.error("Error creating audit log:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao criar log",
        };
      }
    },
    [supabase, fetchLogs]
  );

  const getUniqueActions = useCallback(async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("action")
        .order("action");

      if (error) throw error;

      const actions = [...new Set(data?.map((d) => d.action))];
      return actions;
    } catch (err) {
      console.error("Error fetching unique actions:", err);
      return [];
    }
  }, [supabase]);

  const getUniqueTargetTypes = useCallback(async (): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("target_type")
        .not("target_type", "is", null)
        .order("target_type");

      if (error) throw error;

      const types = [...new Set(data?.map((d) => d.target_type).filter(Boolean))];
      return types as string[];
    } catch (err) {
      console.error("Error fetching unique target types:", err);
      return [];
    }
  }, [supabase]);

  const exportLogs = useCallback(
    async (format: "json" | "csv" = "json"): Promise<{ success: boolean; data?: string; error?: string }> => {
      try {
        const { data, error } = await supabase
          .from("audit_logs")
          .select(`
            *,
            actor:actor_id (email, full_name),
            company:company_id (name)
          `)
          .order("created_at", { ascending: false })
          .limit(10000);

        if (error) throw error;

        if (format === "csv") {
          const headers = ["Data", "Ação", "Usuário", "Empresa", "Tipo", "Detalhes"];
          const rows = (data || []).map((log: AuditLog) => [
            new Date(log.created_at).toLocaleString("pt-BR"),
            log.action,
            log.actor?.full_name || log.actor?.email || "Sistema",
            log.company?.name || "-",
            log.target_type || "-",
            JSON.stringify(log.metadata),
          ]);
          const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
          return { success: true, data: csv };
        }

        return { success: true, data: JSON.stringify(data, null, 2) };
      } catch (err) {
        console.error("Error exporting logs:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao exportar logs",
        };
      }
    },
    [supabase]
  );

  const nextPage = useCallback(() => {
    if ((page + 1) * pageSize < state.totalCount) {
      setPage((p) => p + 1);
    }
  }, [page, pageSize, state.totalCount]);

  const prevPage = useCallback(() => {
    if (page > 0) {
      setPage((p) => p - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(0, newPage));
  }, []);

  const updateFilters = useCallback((newFilters: AuditLogFilters) => {
    setFilters(newFilters);
    setPage(0); // Reset to first page when filters change
  }, []);

  // Subscribe to real-time changes
  useEffect(() => {
    fetchLogs();

    const subscription = supabase
      .channel("audit-logs-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        () => fetchLogs()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchLogs, supabase]);

  const totalPages = Math.ceil(state.totalCount / pageSize);

  return {
    ...state,
    page,
    pageSize,
    totalPages,
    filters,
    nextPage,
    prevPage,
    goToPage,
    updateFilters,
    refetch: fetchLogs,
    createLog,
    getUniqueActions,
    getUniqueTargetTypes,
    exportLogs,
  };
}
