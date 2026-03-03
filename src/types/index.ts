export type UserRole = "SUPER_USER" | "CLIENT_ADMIN" | "CLIENT_AGENT" | "CLIENT_VIEWER";

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  company_id: string | null;
  is_active: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  document: string | null;
  logo_url: string | null;
  plan_id: string | null;
  settings: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number | null;
  limits: {
    max_users: number;
    max_channels: number;
    max_bulk_messages_per_day: number;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  id: string;
  company_id: string;
  type: "WHATSAPP" | "EMAIL" | "SMS" | "OTHER";
  name: string;
  credentials: Record<string, unknown> | null;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  last_error: string | null;
  last_connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor_id: string;
  company_id: string | null;
  target_id: string | null;
  target_type: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface Contact {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  tags: string[];
  custom_fields: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Pipeline {
  id: string;
  company_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Stage {
  id: string;
  pipeline_id: string;
  name: string;
  order: number;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  company_id: string;
  contact_id: string;
  pipeline_id: string;
  stage_id: string;
  title: string;
  value: number | null;
  probability: number | null;
  responsible_id: string;
  expected_close_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  company_id: string;
  contact_id: string;
  channel_id: string | null;
  title: string;
  status: "OPEN" | "PENDING" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH";
  responsible_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}
