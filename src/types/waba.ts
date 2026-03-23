// Types for WhatsApp Business API (WABA) integration

export type WABAConfigStatus = 'pending' | 'connected' | 'error' | 'disconnected';

export interface WABAConfig {
  id: string;
  company_id: string;
  name: string;
  phone_number_id: string;
  business_account_id: string;
  access_token: string;
  webhook_url: string | null;
  webhook_verify_token: string | null;
  status: WABAConfigStatus;
  last_sync_at: string | null;
  last_error: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WABAConfigFormData {
  name: string;
  phone_number_id: string;
  business_account_id: string;
  access_token: string;
  webhook_url?: string;
}

export type WABATemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type WABATemplateStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'FLAGGED' | 'DISABLED';

export interface WABATemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phone_number?: string;
}

export interface WABATemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  buttons?: WABATemplateButton[];
  example?: {
    header_text?: string[];
    body_text?: string[][];
  };
}

export interface WABATemplate {
  id: string;
  waba_config_id: string;
  template_id: string;
  name: string;
  category: WABATemplateCategory;
  language: string;
  status: WABATemplateStatus;
  content: Record<string, unknown>;
  components: WABATemplateComponent[];
  parameter_format: 'POSITIONAL' | 'NAMED';
  reason: string | null;
  quality_score: string | null;
  meta_created_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WABATemplateVariable {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  example?: string;
}

export interface TemplateCreateData {
  name: string;
  category: WABATemplateCategory;
  language: string;
  components: WABATemplateComponent[];
}

export interface MetaAPIResponse {
  success: boolean;
  data?: unknown;
  error?: {
    message: string;
    code?: string;
    type?: string;
  };
}

export interface WABAMessageResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}
