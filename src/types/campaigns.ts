// Types for Bulk Messaging Campaigns

export type CampaignStatus = 
  | 'draft' 
  | 'scheduled' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'cancelled' 
  | 'failed';

export type RecipientStatus = 
  | 'pending' 
  | 'queued' 
  | 'sending' 
  | 'sent' 
  | 'delivered' 
  | 'read' 
  | 'failed';

export type ContactSelectionMode = 'all' | 'manual' | 'csv';

export interface BulkCampaign {
  id: string;
  company_id: string;
  waba_config_id: string;
  name: string;
  description: string | null;
  
  // Template or custom message
  template_id: string | null;
  custom_message: string | null;
  template_variables: Record<string, string>[];
  
  // Interval configuration
  min_interval_seconds: number;
  max_interval_seconds: number;
  
  // Scheduling
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  
  // Status
  status: CampaignStatus;
  
  // Statistics
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  
  // Contact selection
  contact_selection_mode: ContactSelectionMode;
  selected_contact_ids: string[] | null;
  csv_file_url: string | null;
  csv_data: CSVContact[] | null;
  
  // Error tracking
  last_error: string | null;
  error_details: Record<string, unknown> | null;
  
  // Meta
  created_by: string | null;
  cancelled_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BulkCampaignFormData {
  name: string;
  description?: string;
  waba_config_id: string;
  template_id?: string;
  custom_message?: string;
  template_variables?: Record<string, string>[];
  min_interval_seconds: number;
  max_interval_seconds: number;
  scheduled_at?: string | null;
  contact_selection_mode: ContactSelectionMode;
  selected_contact_ids?: string[];
  csv_data?: CSVContact[];
}

export interface CSVContact {
  name: string;
  phone: string;
  [key: string]: string;
}

export interface BulkCampaignRecipient {
  id: string;
  campaign_id: string;
  contact_id: string | null;
  
  // Recipient data (snapshot)
  name: string | null;
  phone: string;
  phone_normalized: string;
  
  // Template variables
  template_variables: Record<string, string>;
  
  // Status
  status: RecipientStatus;
  error_message: string | null;
  error_code: string | null;
  
  // Timestamps
  queued_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  failed_at: string | null;
  
  // Meta API
  meta_message_id: string | null;
  meta_response: Record<string, unknown> | null;
  
  // Retry
  retry_count: number;
  max_retries: number;
  
  created_at: string;
  updated_at: string;
}

export interface BulkMessageQueue {
  id: string;
  campaign_id: string;
  recipient_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  scheduled_for: string;
  processed_at: string | null;
  error_message: string | null;
  retry_count: number;
  priority: number;
  created_at: string;
}

export interface CampaignStats {
  campaign_id: string;
  company_id: string;
  name: string;
  status: CampaignStatus;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  send_rate: number;
  delivery_rate: number;
  read_rate: number;
  created_at: string;
  completed_at: string | null;
  duration_minutes: number | null;
}

export interface CampaignFilters {
  status?: CampaignStatus | 'all';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CampaignProgress {
  campaign_id: string;
  status: CampaignStatus;
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  pending: number;
  percentage: number;
  estimated_completion?: string;
}

export interface SendMessageRequest {
  campaign_id: string;
  recipient_id: string;
  to: string;
  template_name?: string;
  template_language?: string;
  template_variables?: Record<string, string>;
  custom_message?: string;
}

export interface SendMessageResponse {
  success: boolean;
  message_id?: string;
  error?: string;
  error_code?: string;
}

export interface SyncTemplatesResponse {
  success: boolean;
  synced_count: number;
  error?: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message?: string;
  error?: string;
}
