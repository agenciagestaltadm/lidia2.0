"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Company {
  id: string;
  name: string;
  document: string | null;
  logo_url: string | null;
  plan_id: string | null;
  settings: Record<string, unknown>;
  is_active: boolean;
  max_users: number;
  max_connections: number;
  identity: string | null;
  is_trial: boolean;
  trial_period: number;
  trial_end_date: string | null;
  created_at: string;
  updated_at: string;
  plan?: {
    id: string;
    name: string;
    price: number | null;
  };
}

interface CompaniesState {
  companies: Company[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

interface CompanyFormData {
  name: string;
  document?: string | null;
  plan_id?: string | null;
  is_active?: boolean;
  max_users?: number;
  max_connections?: number;
  identity?: string | null;
  is_trial?: boolean;
  trial_period?: number;
  settings?: Record<string, unknown>;
}

export interface CompanyMetrics {
  messages: {
    sent: number;
    received: number;
  };
  attendances: {
    open: number;
    closed: number;
    pending: number;
    total: number;
  };
  contacts: number;
  users: number;
  connections: number;
}

export function useCompanies() {
  const [state, setState] = useState<CompaniesState>({
    companies: [],
    loading: true,
    error: null,
    totalCount: 0,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useMemo(() => createClient(), []);

  const fetchCompanies = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch companies with plan details
      const { data, error } = await supabase
        .from("companies")
        .select(`
          *,
          plan:plan_id (id, name, price)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get total count
      const { count } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true });

      setState({
        companies: (data as Company[]) || [],
        loading: false,
        error: null,
        totalCount: count || 0,
      });
    } catch (err) {
      console.error("Error fetching companies:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Erro ao carregar empresas",
      }));
    }
  }, [supabase]);

  const createCompany = useCallback(
    async (companyData: CompanyFormData): Promise<{ success: boolean; data?: Company; error?: string }> => {
      try {
        // Remove campos undefined/null que podem causar erro
        const cleanData = Object.fromEntries(
          Object.entries(companyData).filter(([_, v]) => v !== undefined)
        );

        // Insert sem o join de plan
        const { data, error } = await supabase
          .from("companies")
          .insert(cleanData)
          .select()
          .single();

        if (error) {
          console.error("Supabase error creating company:", error);
          throw new Error(error.message || error.code || "Erro ao criar empresa");
        }

        await fetchCompanies();
        return { success: true, data: data as Company };
      } catch (err) {
        console.error("Error creating company:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao criar empresa",
        };
      }
    },
    [supabase, fetchCompanies]
  );

  const updateCompany = useCallback(
    async (
      companyId: string,
      companyData: Partial<CompanyFormData>
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const { error } = await supabase
          .from("companies")
          .update({
            ...companyData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", companyId);

        if (error) throw error;

        await fetchCompanies();
        return { success: true };
      } catch (err) {
        console.error("Error updating company:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao atualizar empresa",
        };
      }
    },
    [supabase, fetchCompanies]
  );

  const deleteCompany = useCallback(
    async (companyId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        // Check if company has users
        const { count: usersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId);

        if (usersCount && usersCount > 0) {
          return {
            success: false,
            error: "Não é possível excluir uma empresa com usuários associados",
          };
        }

        const { error } = await supabase
          .from("companies")
          .delete()
          .eq("id", companyId);

        if (error) throw error;

        await fetchCompanies();
        return { success: true };
      } catch (err) {
        console.error("Error deleting company:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao excluir empresa",
        };
      }
    },
    [supabase, fetchCompanies]
  );

  const toggleCompanyStatus = useCallback(
    async (companyId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> => {
      try {
        const { error } = await supabase
          .from("companies")
          .update({
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", companyId);

        if (error) throw error;

        await fetchCompanies();
        return { success: true };
      } catch (err) {
        console.error("Error toggling company status:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao alterar status",
        };
      }
    },
    [supabase, fetchCompanies]
  );

  const getCompanyUsers = useCallback(
    async (companyId: string) => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("company_id", companyId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        return { success: true, data: data || [] };
      } catch (err) {
        console.error("Error fetching company users:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao carregar usuários",
          data: [],
        };
      }
    },
    [supabase]
  );

  const getCompanyStats = useCallback(
    async (companyId: string) => {
      try {
        const [usersCount, contactsCount, ticketsCount, channelsCount] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("company_id", companyId),
          supabase.from("contacts").select("*", { count: "exact", head: true }).eq("company_id", companyId),
          supabase.from("tickets").select("*", { count: "exact", head: true }).eq("company_id", companyId),
          supabase.from("channels").select("*", { count: "exact", head: true }).eq("company_id", companyId),
        ]);

        return {
          success: true,
          stats: {
            users: usersCount.count || 0,
            contacts: contactsCount.count || 0,
            tickets: ticketsCount.count || 0,
            channels: channelsCount.count || 0,
          },
        };
      } catch (err) {
        console.error("Error fetching company stats:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao carregar estatísticas",
          stats: { users: 0, contacts: 0, tickets: 0, channels: 0 },
        };
      }
    },
    [supabase]
  );

  const getCompanyMetrics = useCallback(
    async (companyId: string): Promise<{ success: boolean; metrics?: CompanyMetrics; error?: string }> => {
      try {
        // Buscar contagem de usuários
        const { count: usersCount, error: usersError } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId);

        if (usersError) throw usersError;

        // Buscar contagem de contatos
        const { count: contactsCount, error: contactsError } = await supabase
          .from("contacts")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId);

        if (contactsError) throw contactsError;

        // Buscar contagem de conexões/canais
        const { count: connectionsCount, error: connectionsError } = await supabase
          .from("channels")
          .select("*", { count: "exact", head: true })
          .eq("company_id", companyId);

        if (connectionsError) throw connectionsError;

        // Buscar atendimentos por status
        const { data: ticketsData, error: ticketsError } = await supabase
          .from("tickets")
          .select("status")
          .eq("company_id", companyId);

        if (ticketsError) throw ticketsError;

        const attendances = {
          open: ticketsData?.filter((t) => t.status === "OPEN").length || 0,
          closed: ticketsData?.filter((t) => t.status === "CLOSED").length || 0,
          pending: ticketsData?.filter((t) => t.status === "PENDING").length || 0,
          total: ticketsData?.length || 0,
        };

        // Buscar mensagens enviadas e recebidas (da tabela messages se existir, ou usar tickets como proxy)
        // Por enquanto, vamos usar uma estimativa baseada em tickets e contatos
        const messages = {
          sent: (ticketsData?.length || 0) * 3, // Estimativa: 3 mensagens por ticket
          received: (ticketsData?.length || 0) * 2, // Estimativa: 2 mensagens por ticket
        };

        return {
          success: true,
          metrics: {
            messages,
            attendances,
            contacts: contactsCount || 0,
            users: usersCount || 0,
            connections: connectionsCount || 0,
          },
        };
      } catch (err) {
        console.error("Error fetching company metrics:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao carregar métricas",
        };
      }
    },
    [supabase]
  );

  // Subscribe to real-time changes
  useEffect(() => {
    fetchCompanies();

    const subscription = supabase
      .channel("companies-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "companies" },
        () => fetchCompanies()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchCompanies, supabase]);

  return {
    ...state,
    refetch: fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    toggleCompanyStatus,
    getCompanyUsers,
    getCompanyStats,
    getCompanyMetrics,
  };
}
