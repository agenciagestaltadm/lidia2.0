"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  is_active: boolean;
  limits: {
    max_users: number;
    max_channels: number;
    max_bulk_messages_per_day: number;
    max_contacts: number;
    max_attendances_per_month: number;
  };
  features: string[];
  created_at: string;
  updated_at: string;
}

export interface PlanHistory {
  id: string;
  plan_id: string;
  action: "CREATED" | "UPDATED" | "DELETED" | "ACTIVATED" | "DEACTIVATED";
  changes: Record<string, { old: unknown; new: unknown }>;
  performed_by: string;
  created_at: string;
}

interface PlansState {
  plans: Plan[];
  loading: boolean;
  error: string | null;
}

interface PlanFormData {
  name: string;
  description?: string;
  price?: number;
  is_active?: boolean;
  limits?: Partial<Plan["limits"]>;
  features?: string[];
}

export function usePlans() {
  const [state, setState] = useState<PlansState>({
    plans: [],
    loading: true,
    error: null,
  });

  const supabase = createClient();

  const fetchPlans = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("price", { ascending: true });

      if (error) throw error;

      setState({
        plans: (data as Plan[]) || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error("Error fetching plans:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Erro ao carregar planos",
      }));
    }
  }, [supabase]);

  const createPlan = useCallback(
    async (planData: PlanFormData): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        const { data, error } = await supabase
          .from("plans")
          .insert({
            ...planData,
            limits: {
              max_users: 1,
              max_channels: 1,
              max_bulk_messages_per_day: 100,
              max_contacts: 1000,
              max_attendances_per_month: 1000,
              ...planData.limits,
            },
            features: planData.features || [],
          })
          .select()
          .single();

        if (error) throw error;

        // Add to history
        await supabase.from("plan_history").insert({
          plan_id: data.id,
          action: "CREATED",
          changes: { data: { old: null, new: data } },
          performed_by: userId,
        });

        await fetchPlans();
        return { success: true };
      } catch (err) {
        console.error("Error creating plan:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao criar plano",
        };
      }
    },
    [supabase, fetchPlans]
  );

  const updatePlan = useCallback(
    async (
      planId: string,
      planData: Partial<PlanFormData>
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        // Get current plan for history
        const { data: currentPlan } = await supabase
          .from("plans")
          .select("*")
          .eq("id", planId)
          .single();

        const { data, error } = await supabase
          .from("plans")
          .update({
            ...planData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", planId)
          .select()
          .single();

        if (error) throw error;

        // Calculate changes
        const changes: Record<string, { old: unknown; new: unknown }> = {};
        Object.keys(planData).forEach((key) => {
          const k = key as keyof Plan;
          if (JSON.stringify(currentPlan[k]) !== JSON.stringify(planData[k as keyof PlanFormData])) {
            changes[key] = {
              old: currentPlan[k],
              new: planData[k as keyof PlanFormData],
            };
          }
        });

        // Add to history
        await supabase.from("plan_history").insert({
          plan_id: planId,
          action: "UPDATED",
          changes,
          performed_by: userId,
        });

        await fetchPlans();
        return { success: true };
      } catch (err) {
        console.error("Error updating plan:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao atualizar plano",
        };
      }
    },
    [supabase, fetchPlans]
  );

  const deletePlan = useCallback(
    async (planId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        // Check if plan has companies
        const { count } = await supabase
          .from("companies")
          .select("*", { count: "exact", head: true })
          .eq("plan_id", planId);

        if (count && count > 0) {
          return {
            success: false,
            error: "Não é possível excluir um plano com empresas associadas",
          };
        }

        const { error } = await supabase.from("plans").delete().eq("id", planId);

        if (error) throw error;

        // Add to history
        await supabase.from("plan_history").insert({
          plan_id: planId,
          action: "DELETED",
          changes: {},
          performed_by: userId,
        });

        await fetchPlans();
        return { success: true };
      } catch (err) {
        console.error("Error deleting plan:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao excluir plano",
        };
      }
    },
    [supabase, fetchPlans]
  );

  const togglePlanStatus = useCallback(
    async (planId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        const { error } = await supabase
          .from("plans")
          .update({
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq("id", planId);

        if (error) throw error;

        // Add to history
        await supabase.from("plan_history").insert({
          plan_id: planId,
          action: isActive ? "ACTIVATED" : "DEACTIVATED",
          changes: { is_active: { old: !isActive, new: isActive } },
          performed_by: userId,
        });

        await fetchPlans();
        return { success: true };
      } catch (err) {
        console.error("Error toggling plan status:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao alterar status",
        };
      }
    },
    [supabase, fetchPlans]
  );

  const getPlanHistory = useCallback(
    async (planId: string): Promise<PlanHistory[]> => {
      try {
        const { data, error } = await supabase
          .from("plan_history")
          .select("*")
          .eq("plan_id", planId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        return (data as PlanHistory[]) || [];
      } catch (err) {
        console.error("Error fetching plan history:", err);
        return [];
      }
    },
    [supabase]
  );

  const getActiveCompaniesCount = useCallback(
    async (planId: string): Promise<number> => {
      try {
        const { count, error } = await supabase
          .from("companies")
          .select("*", { count: "exact", head: true })
          .eq("plan_id", planId)
          .eq("is_active", true);

        if (error) throw error;

        return count || 0;
      } catch (err) {
        console.error("Error fetching active companies count:", err);
        return 0;
      }
    },
    [supabase]
  );

  // Subscribe to real-time changes
  useEffect(() => {
    fetchPlans();

    const subscription = supabase
      .channel("plans-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plans" },
        () => fetchPlans()
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchPlans, supabase]);

  return {
    ...state,
    refetch: fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
    togglePlanStatus,
    getPlanHistory,
    getActiveCompaniesCount,
  };
}
