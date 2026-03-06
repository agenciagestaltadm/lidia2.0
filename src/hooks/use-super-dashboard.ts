"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface DashboardMetrics {
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  totalUsers: number;
  onlineUsers: number;
  totalPlans: number;
  activePlans: number;
  inactivePlans: number;
  monthlyRecurringRevenue: number;
  totalChannels: number;
  connectedChannels: number;
  totalAttendances: number;
  attendancesThisMonth: number;
}

interface GrowthDataPoint {
  month: string;
  companies: number;
  users: number;
  revenue: number;
  [key: string]: string | number;
}

interface DashboardState {
  metrics: DashboardMetrics;
  growthData: GrowthDataPoint[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const initialMetrics: DashboardMetrics = {
  totalCompanies: 0,
  activeCompanies: 0,
  inactiveCompanies: 0,
  totalUsers: 0,
  onlineUsers: 0,
  totalPlans: 0,
  activePlans: 0,
  inactivePlans: 0,
  monthlyRecurringRevenue: 0,
  totalChannels: 0,
  connectedChannels: 0,
  totalAttendances: 0,
  attendancesThisMonth: 0,
};

export function useSuperDashboard() {
  const [state, setState] = useState<DashboardState>({
    metrics: initialMetrics,
    growthData: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const supabase = createClient();

  const fetchMetrics = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch companies data
      const { count: totalCompanies } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true });

      const { count: activeCompanies } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Fetch users data
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Count online users (active in last 15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { count: onlineUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gt("last_sign_in_at", fifteenMinutesAgo);

      // Fetch plans data
      const { count: totalPlans } = await supabase
        .from("plans")
        .select("*", { count: "exact", head: true });

      const { count: activePlans } = await supabase
        .from("plans")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Calculate MRR from active companies with plans
      const { data: companiesWithPlans } = await supabase
        .from("companies")
        .select("plan_id")
        .eq("is_active", true)
        .not("plan_id", "is", null);

      let monthlyRecurringRevenue = 0;
      if (companiesWithPlans && companiesWithPlans.length > 0) {
        const planIds = companiesWithPlans.map((c) => c.plan_id);
        const { data: plansData } = await supabase
          .from("plans")
          .select("id, price")
          .in("id", planIds);

        if (plansData) {
          const planPrices = new Map(plansData.map((p) => [p.id, p.price || 0]));
          monthlyRecurringRevenue = companiesWithPlans.reduce((sum, company) => {
            return sum + (planPrices.get(company.plan_id) || 0);
          }, 0);
        }
      }

      // Fetch channels data
      const { count: totalChannels } = await supabase
        .from("channels")
        .select("*", { count: "exact", head: true });

      const { count: connectedChannels } = await supabase
        .from("channels")
        .select("*", { count: "exact", head: true })
        .eq("status", "CONNECTED");

      // Fetch attendances/tickets data
      const { count: totalAttendances } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true });

      // Get first day of current month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { count: attendancesThisMonth } = await supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .gte("created_at", firstDayOfMonth.toISOString());

      // Fetch growth data for last 6 months
      const growthData = await fetchGrowthData();

      setState({
        metrics: {
          totalCompanies: totalCompanies || 0,
          activeCompanies: activeCompanies || 0,
          inactiveCompanies: (totalCompanies || 0) - (activeCompanies || 0),
          totalUsers: totalUsers || 0,
          onlineUsers: onlineUsers || 0,
          totalPlans: totalPlans || 0,
          activePlans: activePlans || 0,
          inactivePlans: (totalPlans || 0) - (activePlans || 0),
          monthlyRecurringRevenue,
          totalChannels: totalChannels || 0,
          connectedChannels: connectedChannels || 0,
          totalAttendances: totalAttendances || 0,
          attendancesThisMonth: attendancesThisMonth || 0,
        },
        growthData,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.error("Error fetching dashboard metrics:", err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Erro ao carregar métricas",
      }));
    }
  }, [supabase]);

  const fetchGrowthData = async (): Promise<GrowthDataPoint[]> => {
    const data: GrowthDataPoint[] = [];
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Companies created in this month
      const { count: companiesCount } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .lte("created_at", monthEnd.toISOString());

      // Users created in this month
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .lte("created_at", monthEnd.toISOString());

      // Revenue calculation for this month (simplified)
      const { data: companiesWithPlans } = await supabase
        .from("companies")
        .select("plan_id")
        .eq("is_active", true)
        .lte("created_at", monthEnd.toISOString())
        .not("plan_id", "is", null);

      let revenue = 0;
      if (companiesWithPlans && companiesWithPlans.length > 0) {
        const planIds = companiesWithPlans.map((c) => c.plan_id);
        const { data: plansData } = await supabase
          .from("plans")
          .select("id, price")
          .in("id", planIds);

        if (plansData) {
          const planPrices = new Map(plansData.map((p) => [p.id, p.price || 0]));
          revenue = companiesWithPlans.reduce((sum, company) => {
            return sum + (planPrices.get(company.plan_id) || 0);
          }, 0);
        }
      }

      data.push({
        month: months[date.getMonth()],
        companies: companiesCount || 0,
        users: usersCount || 0,
        revenue,
      });
    }

    return data;
  };

  // Subscribe to real-time changes
  useEffect(() => {
    fetchMetrics();

    // Subscribe to companies changes
    const companiesSubscription = supabase
      .channel("companies-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "companies" },
        () => fetchMetrics()
      )
      .subscribe();

    // Subscribe to profiles changes
    const profilesSubscription = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchMetrics()
      )
      .subscribe();

    // Subscribe to plans changes
    const plansSubscription = supabase
      .channel("plans-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plans" },
        () => fetchMetrics()
      )
      .subscribe();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);

    return () => {
      companiesSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
      plansSubscription.unsubscribe();
      clearInterval(interval);
    };
  }, [fetchMetrics, supabase]);

  const refetch = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    ...state,
    refetch,
  };
}
