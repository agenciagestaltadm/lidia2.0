export { useAuth } from "./use-auth";
export { usePermissions } from "./use-permissions";
export { useSupabaseQuery } from "./use-supabase-query";

// Export WABA and Bulk Campaign hooks
export {
  useWABAConfigs,
  useWABAConfig,
  useCreateWABAConfig,
  useUpdateWABAConfig,
  useDeleteWABAConfig,
  useTestWABAConnection,
  useSyncTemplates,
} from "./use-waba";

export {
  useTemplates,
  useTemplate,
  useCreateTemplate,
  useDeleteTemplate,
  useCheckTemplateStatus,
  extractTemplateVariables,
  buildTemplateComponentsWithVariables,
} from "./use-templates";

export {
  useCampaigns,
  useCampaign,
  useCampaignRecipients,
  useCampaignStats,
  useCampaignProgress,
  useCreateCampaign,
  useStartCampaign,
  usePauseCampaign,
  useCancelCampaign,
  useDeleteCampaign,
} from "./use-campaigns";
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

// Export audio analyzer hook
export { useAudioAnalyzer, type AudioAnalyzerConfig } from "./useAudioAnalyzer";

// Export atendimento hooks
export {
  useSalesFunnel,
  useFunnelStats,
  useCreateDeal,
  useUpdateDeal,
  useDeleteDeal,
  useMoveDeal,
  useFunnelRealtime,
  funnelKeys,
} from "./use-sales-funnel";

export {
  useProtocols,
  useProtocolStats,
  useCreateProtocol,
  useResolveProtocol,
  useProtocolsRealtime,
  protocolKeys,
} from "./use-protocols";

export {
  useRatings,
  useRatingStats,
  useRequestRating,
  useRatingsRealtime,
  ratingKeys,
} from "./use-ratings";

export {
  useNotes,
  useNotesByContact,
  useNoteStats,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useTogglePinNote,
  useNotesRealtime,
  noteKeys,
} from "./use-notes";

// Export contacts hooks
export {
  useContacts,
  useContactStats,
  useContactTags,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useContactsRealtime,
  contactKeys,
} from "./use-contacts";

// Export WhatsApp hooks
export { useWhatsAppChat } from "./use-whatsapp-chat";
export { useWhatsAppContacts } from "./use-whatsapp-contacts";
export { useWhatsAppMessages } from "./use-whatsapp-messages";
export { useWhatsAppSessions } from "./use-whatsapp-sessions";
