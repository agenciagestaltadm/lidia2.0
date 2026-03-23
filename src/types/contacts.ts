// Types for contacts module based on Supabase contacts table

export type ContactStatus = 'active' | 'inactive' | 'lead' | 'client' | 'prospect';
export type ContactSource = 'manual' | 'whatsapp' | 'instagram' | 'facebook' | 'email' | 'website';

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  avatar: string | null;
  company: string | null;
  company_id: string | null;
  tags: string[];
  notes: string | null;
  status: ContactStatus;
  source: ContactSource;
  last_contact_at: string | null;
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  tags: string[];
  notes: string;
  status: ContactStatus;
  source: ContactSource;
}

export interface ContactFilters {
  search?: string;
  status?: ContactStatus | 'all';
  tags?: string[];
  dateFilter?: 'all' | 'today' | 'week' | 'month';
}

export interface ContactStats {
  total: number;
  active: number;
  inactive: number;
  leads: number;
  clients: number;
  prospects: number;
  newThisMonth: number;
}
