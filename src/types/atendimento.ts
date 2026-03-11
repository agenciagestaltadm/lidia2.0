/**
 * Types for WhatsLidia Atendimento Module
 * Sales Funnel, Protocols, Ratings, Notes
 */

// ============================================
// Sales Funnel Types
// ============================================

export type FunnelStage = 
  | 'new' 
  | 'qualified' 
  | 'proposal' 
  | 'negotiation' 
  | 'closed_won' 
  | 'closed_lost';

export interface SalesFunnelDeal {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  contact_avatar?: string;
  stage: FunnelStage;
  probability: number;
  estimated_value: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  assigned_name?: string;
  assigned_avatar?: string;
  expected_close_date?: string;
  last_activity?: string;
  tags?: string[];
}

export interface FunnelStageConfig {
  id: FunnelStage;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  probability: number;
  icon: string;
}

export interface FunnelStats {
  total_deals: number;
  total_value: number;
  weighted_value: number;
  conversion_rate: number;
  avg_deal_value: number;
  deals_by_stage: Record<FunnelStage, number>;
  value_by_stage: Record<FunnelStage, number>;
}

// ============================================
// Protocol Types
// ============================================

export interface Protocol {
  id: string;
  code: string;
  conversation_id: string;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  contact_avatar?: string;
  message: string;
  sent_by: string;
  sent_by_name: string;
  sent_at: string;
  created_at: string;
  status: 'active' | 'expired' | 'resolved';
  expires_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  notes?: string;
}

export interface ProtocolHistory {
  protocol_id: string;
  code: string;
  action: 'created' | 'sent' | 'viewed' | 'resolved';
  performed_by: string;
  performed_at: string;
  details?: string;
}

export interface ProtocolStats {
  total_protocols: number;
  active_count: number;
  expired_count: number;
  resolved_count: number;
  avg_resolution_time_hours: number;
}

// ============================================
// Rating Types
// ============================================

export type RatingType = 'nps' | 'stars' | 'csat';
export type RatingStatus = 'pending' | 'responded' | 'expired';

export interface Rating {
  id: string;
  conversation_id: string;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  contact_avatar?: string;
  type: RatingType;
  status: RatingStatus;
  score?: number;
  max_score: number;
  feedback?: string;
  requested_by: string;
  requested_by_name: string;
  requested_at: string;
  responded_at?: string;
  created_at: string;
  expires_at?: string;
  message_sent?: string;
}

export interface RatingStats {
  total_requests: number;
  total_responses: number;
  response_rate: number;
  avg_nps_score: number;
  avg_star_rating: number;
  nps_distribution: {
    promoters: number;
    passives: number;
    detractors: number;
  };
  ratings_by_period: {
    period: string;
    count: number;
    avg_score: number;
  }[];
}

export interface NPSCategory {
  score: number;
  category: 'promoter' | 'passive' | 'detractor';
  label: string;
  color: string;
}

// ============================================
// Note Types
// ============================================

export type NoteCategory = 'general' | 'important' | 'followup' | 'complaint' | 'sale' | 'support';

export interface Note {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  contact_avatar?: string;
  content: string;
  category: NoteCategory;
  created_by: string;
  created_by_name: string;
  created_by_avatar?: string;
  created_at: string;
  updated_at: string;
  pinned?: boolean;
  tags?: string[];
  conversation_id?: string;
}

export interface NoteCategoryConfig {
  id: NoteCategory;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export interface NoteStats {
  total_notes: number;
  notes_by_category: Record<NoteCategory, number>;
  recent_notes_count: number;
  pinned_count: number;
}

// ============================================
// Common Filters & Pagination
// ============================================

export interface DateRangeFilter {
  from?: string;
  to?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiError {
  code: string;
  message: string;
  details?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: string;
    request_id: string;
  };
}

// ============================================
// Realtime Event Types
// ============================================

export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimePayload<T> {
  eventType: RealtimeEventType;
  new: T | null;
  old: T | null;
  schema: string;
  table: string;
}

// ============================================
// Dashboard Widget Types
// ============================================

export interface AtendimentoDashboardData {
  funnel: FunnelStats;
  protocols: ProtocolStats;
  ratings: RatingStats;
  notes: NoteStats;
  recent_activities: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'funnel_move' | 'protocol_sent' | 'rating_received' | 'note_created';
  description: string;
  contact_name: string;
  performed_by: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
