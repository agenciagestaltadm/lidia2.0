export { useAuth } from "./use-auth";
export { usePermissions } from "./use-permissions";
export { useSupabaseQuery } from "./use-supabase-query";
export { useSuperDashboard } from "./use-super-dashboard";
export { usePlans } from "./use-plans";
export { useCompanies } from "./use-companies";
export { useCompanyUsers } from "./use-company-users";
export { useAuditLogs } from "./use-audit-logs";
export { useChannels } from "./use-channels";
export { useSystemSettings } from "./use-system-settings";
export { useCompanyEmails, type CompanyEmail } from "./use-company-emails";
export {
  useSidebarState, 
  SIDEBAR_WIDTHS, 
  SIDEBAR_TRANSITIONS, 
  SIDEBAR_EASING 
} from "./use-sidebar-state";

export {
  useAttendanceByStatus,
  useAttendanceByUser,
  useAttendanceByChannel,
  useAttendanceByChannelType,
  useAttendanceByQueue,
  useAttendanceByDemand,
  useAttendanceEvolution,
  useChannelEvolution,
  useValuesEvolution,
  useSummaryMetrics,
  useTeamPerformance,
  type DateRange,
  type PieChartData,
  type TimeSeriesData,
  type SummaryMetrics,
  type TeamMemberPerformance,
  CHART_COLORS,
} from "./use-analytics";

export {
  useDashboardLayout,
  type WidgetType,
  type WidgetConfig,
  type DashboardLayout,
} from "./use-dashboard-layout";

// Export useDateRangePicker from analytics components
export { useDateRangePicker } from "@/components/analytics/DateRangePicker";
