"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { createClient } from "@/lib/supabase/client";
import { format, startOfDay, endOfDay } from "date-fns";

// ============================================
// TYPES
// ============================================

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface PieChartData {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface SummaryMetrics {
  totalAttendances: number;
  active: number;
  receptive: number;
  newContacts: number;
  avgTMA: string;
  avgFirstResponse: string;
}

export interface TeamMemberPerformance {
  userId: string;
  userName: string;
  userEmail?: string;
  pending: number;
  attending: number;
  finished: number;
  total: number;
  avgRating?: number;
  avgFirstResponse?: string;
  avgTMA?: string;
}

// ============================================
// COLORS
// ============================================

export const CHART_COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
  "#64748b", // slate-500
];

// ============================================
// HOOKS
// ============================================

/**
 * Hook para buscar atendimentos por status
 */
export function useAttendanceByStatus(dateRange: DateRange) {
  const { user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["analytics", "attendance-by-status", dateRange, user?.companyId],
    queryFn: async (): Promise<PieChartData[]> => {
      if (!user?.companyId) return [];

      const { data, error } = await supabase
        .from("tickets")
        .select("status")
        .eq("company_id", user.companyId)
        .gte("created_at", format(startOfDay(dateRange.startDate), "yyyy-MM-dd'T'HH:mm:ss"))
        .lte("created_at", format(endOfDay(dateRange.endDate), "yyyy-MM-dd'T'HH:mm:ss"));

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((ticket) => {
        const status = ticket.status || "Não informado";
        counts[status] = (counts[status] || 0) + 1;
      });

      const total = Object.values(counts).reduce((a, b) => a + b, 0);

      return Object.entries(counts)
        .map(([name, value], index) => ({
          name: translateStatus(name),
          value,
          percentage: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0,
          color: CHART_COLORS[index % CHART_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value);
    },
    enabled: !!user?.companyId,
  });
}

/**
 * Hook para buscar atendimentos por usuário/agente
 */
export function useAttendanceByUser(dateRange: DateRange) {
  const { user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["analytics", "attendance-by-user", dateRange, user?.companyId],
    queryFn: async (): Promise<PieChartData[]> => {
      if (!user?.companyId) return [];

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          responsible_id,
          profiles!inner(full_name, email)
        `)
        .eq("company_id", user.companyId)
        .gte("created_at", format(startOfDay(dateRange.startDate), "yyyy-MM-dd'T'HH:mm:ss"))
        .lte("created_at", format(endOfDay(dateRange.endDate), "yyyy-MM-dd'T'HH:mm:ss"));

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((ticket: any) => {
        const userName = ticket.profiles?.full_name || "Não informado";
        counts[userName] = (counts[userName] || 0) + 1;
      });

      const total = Object.values(counts).reduce((a, b) => a + b, 0);

      return Object.entries(counts)
        .map(([name, value], index) => ({
          name,
          value,
          percentage: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0,
          color: CHART_COLORS[index % CHART_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value);
    },
    enabled: !!user?.companyId,
  });
}

/**
 * Hook para buscar atendimentos por canal
 */
export function useAttendanceByChannel(dateRange: DateRange) {
  const { user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["analytics", "attendance-by-channel", dateRange, user?.companyId],
    queryFn: async (): Promise<PieChartData[]> => {
      if (!user?.companyId) return [];

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          channel_id,
          channels!inner(name, type)
        `)
        .eq("company_id", user.companyId)
        .gte("created_at", format(startOfDay(dateRange.startDate), "yyyy-MM-dd'T'HH:mm:ss"))
        .lte("created_at", format(endOfDay(dateRange.endDate), "yyyy-MM-dd'T'HH:mm:ss"));

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((ticket: any) => {
        const channelName = ticket.channels?.name || "Não informado";
        counts[channelName] = (counts[channelName] || 0) + 1;
      });

      const total = Object.values(counts).reduce((a, b) => a + b, 0);

      return Object.entries(counts)
        .map(([name, value], index) => ({
          name,
          value,
          percentage: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0,
          color: CHART_COLORS[index % CHART_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value);
    },
    enabled: !!user?.companyId,
  });
}

/**
 * Hook para buscar atendimentos por tipo de canal (Conexão)
 */
export function useAttendanceByChannelType(dateRange: DateRange) {
  const { user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["analytics", "attendance-by-channel-type", dateRange, user?.companyId],
    queryFn: async (): Promise<PieChartData[]> => {
      if (!user?.companyId) return [];

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          channel_id,
          channels!inner(type)
        `)
        .eq("company_id", user.companyId)
        .gte("created_at", format(startOfDay(dateRange.startDate), "yyyy-MM-dd'T'HH:mm:ss"))
        .lte("created_at", format(endOfDay(dateRange.endDate), "yyyy-MM-dd'T'HH:mm:ss"));

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((ticket: any) => {
        const channelType = ticket.channels?.type || "Não informado";
        counts[channelType] = (counts[channelType] || 0) + 1;
      });

      const total = Object.values(counts).reduce((a, b) => a + b, 0);

      return Object.entries(counts)
        .map(([name, value], index) => ({
          name: translateChannelType(name),
          value,
          percentage: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0,
          color: CHART_COLORS[index % CHART_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value);
    },
    enabled: !!user?.companyId,
  });
}

/**
 * Hook para evolução temporal de atendimentos
 */
export function useAttendanceEvolution(dateRange: DateRange) {
  const { user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["analytics", "attendance-evolution", dateRange, user?.companyId],
    queryFn: async (): Promise<TimeSeriesData[]> => {
      if (!user?.companyId) return [];

      const { data, error } = await supabase
        .from("tickets")
        .select("created_at")
        .eq("company_id", user.companyId)
        .gte("created_at", format(startOfDay(dateRange.startDate), "yyyy-MM-dd'T'HH:mm:ss"))
        .lte("created_at", format(endOfDay(dateRange.endDate), "yyyy-MM-dd'T'HH:mm:ss"))
        .order("created_at");

      if (error) throw error;

      // Group by date
      const counts: Record<string, number> = {};
      const days: string[] = [];
      
      // Initialize all days in range
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, "dd/MM/yyyy");
        counts[dateStr] = 0;
        days.push(dateStr);
      }

      data?.forEach((ticket) => {
        const dateStr = format(new Date(ticket.created_at), "dd/MM/yyyy");
        if (counts[dateStr] !== undefined) {
          counts[dateStr]++;
        }
      });

      return days.map((date) => ({
        date,
        value: counts[date],
        label: date,
      }));
    },
    enabled: !!user?.companyId,
  });
}

/**
 * Hook para métricas de resumo
 */
export function useSummaryMetrics(dateRange: DateRange) {
  const { user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["analytics", "summary-metrics", dateRange, user?.companyId],
    queryFn: async (): Promise<SummaryMetrics> => {
      if (!user?.companyId) {
        return {
          totalAttendances: 0,
          active: 0,
          receptive: 0,
          newContacts: 0,
          avgTMA: "0 min",
          avgFirstResponse: "0 min",
        };
      }

      const startDate = format(startOfDay(dateRange.startDate), "yyyy-MM-dd'T'HH:mm:ss");
      const endDate = format(endOfDay(dateRange.endDate), "yyyy-MM-dd'T'HH:mm:ss");

      // Get tickets count
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("status")
        .eq("company_id", user.companyId)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (ticketsError) throw ticketsError;

      // Get new contacts count
      const { count: newContacts, error: contactsError } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("company_id", user.companyId)
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (contactsError) throw contactsError;

      const total = tickets?.length || 0;
      const open = tickets?.filter((t) => t.status === "OPEN").length || 0;
      const closed = tickets?.filter((t) => t.status === "CLOSED").length || 0;

      return {
        totalAttendances: total,
        active: open,
        receptive: closed,
        newContacts: newContacts || 0,
        avgTMA: "1 min",
        avgFirstResponse: "1 min",
      };
    },
    enabled: !!user?.companyId,
  });
}

/**
 * Hook para performance da equipe
 */
export function useTeamPerformance(dateRange: DateRange) {
  const { user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["analytics", "team-performance", dateRange, user?.companyId],
    queryFn: async (): Promise<TeamMemberPerformance[]> => {
      if (!user?.companyId) return [];

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          status,
          responsible_id,
          profiles!inner(id, full_name, email)
        `)
        .eq("company_id", user.companyId)
        .gte("created_at", format(startOfDay(dateRange.startDate), "yyyy-MM-dd'T'HH:mm:ss"))
        .lte("created_at", format(endOfDay(dateRange.endDate), "yyyy-MM-dd'T'HH:mm:ss"));

      if (error) throw error;

      const userStats: Record<string, TeamMemberPerformance> = {};

      data?.forEach((ticket: any) => {
        const profile = ticket.profiles;
        const userId = profile?.id || "unassigned";
        const userName = profile?.full_name || "Não informado";
        const userEmail = profile?.email;

        if (!userStats[userId]) {
          userStats[userId] = {
            userId,
            userName,
            userEmail,
            pending: 0,
            attending: 0,
            finished: 0,
            total: 0,
            avgFirstResponse: "-",
            avgTMA: "-",
          };
        }

        userStats[userId].total++;

        switch (ticket.status) {
          case "PENDING":
            userStats[userId].pending++;
            break;
          case "OPEN":
            userStats[userId].attending++;
            break;
          case "CLOSED":
            userStats[userId].finished++;
            break;
        }
      });

      // Retorna dados reais ou array vazio se não houver dados
      return Object.values(userStats).sort((a, b) => b.total - a.total);
    },
    enabled: !!user?.companyId,
  });
}

/**
 * Hook para atendimentos por fila (placeholder - usar channel como proxy)
 */
export function useAttendanceByQueue(dateRange: DateRange) {
  // Reutiliza os dados de canal como proxy para fila
  return useAttendanceByChannel(dateRange);
}

/**
 * Hook para atendimentos por demanda (placeholder)
 */
export function useAttendanceByDemand(dateRange: DateRange) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["analytics", "attendance-by-demand", dateRange, user?.companyId],
    queryFn: async (): Promise<PieChartData[]> => {
      // Retorna array vazio para mostrar estado "Sem dados"
      return [];
    },
    enabled: !!user?.companyId,
  });
}

/**
 * Hook para evolução por canal (placeholder - retorna dados mockados)
 */
export function useChannelEvolution(dateRange: DateRange) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["analytics", "channel-evolution", dateRange, user?.companyId],
    queryFn: async (): Promise<TimeSeriesData[]> => {
      // Gera dados mockados para cada dia do período
      const days: string[] = [];
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(format(d, "dd/MM/yyyy"));
      }

      return days.map((date) => ({
        date,
        value: 100,
        label: "100%",
      }));
    },
    enabled: !!user?.companyId,
  });
}

/**
 * Hook para evolução de valores (placeholder)
 */
export function useValuesEvolution(dateRange: DateRange) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["analytics", "values-evolution", dateRange, user?.companyId],
    queryFn: async (): Promise<TimeSeriesData[]> => {
      const days: string[] = [];
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(format(d, "dd/MM/yyyy"));
      }

      return days.map((date) => ({
        date,
        value: 0,
        label: "0",
      }));
    },
    enabled: !!user?.companyId,
  });
}

// ============================================
// UTILS
// ============================================

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    OPEN: "Abertos",
    PENDING: "Pendentes",
    CLOSED: "Fechados",
  };
  return translations[status] || status;
}

function translateChannelType(type: string): string {
  const translations: Record<string, string> = {
    WHATSAPP: "WhatsApp Official",
    EMAIL: "Email",
    SMS: "SMS",
    OTHER: "Outro",
  };
  return translations[type] || type;
}
