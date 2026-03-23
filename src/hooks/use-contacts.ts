"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./use-auth";
import type { Contact, ContactFormData, ContactFilters, ContactStats, ContactStatus } from "@/types/contacts";
import { toast } from "sonner";

// Query keys
export const contactKeys = {
  all: ["contacts"] as const,
  list: (filters?: ContactFilters) => [...contactKeys.all, "list", filters] as const,
  stats: () => [...contactKeys.all, "stats"] as const,
  detail: (id: string) => [...contactKeys.all, "detail", id] as const,
};

// Fetch contacts with filters
async function fetchContacts(filters?: ContactFilters): Promise<Contact[]> {
  const supabase = createClient();

  let query = supabase
    .from("contacts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains("tags", filters.tags);
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase().trim();
    query = query.or(
      `name.ilike.%${searchLower}%,email.ilike.%${searchLower}%,phone.ilike.%${filters.search}%,company.ilike.%${searchLower}%`
    );
  }

  if (filters?.dateFilter && filters.dateFilter !== "all") {
    const now = new Date();
    let dateThreshold: string;

    switch (filters.dateFilter) {
      case "today":
        dateThreshold = now.toISOString().split("T")[0];
        query = query.gte("last_contact_at", dateThreshold);
        break;
      case "week": {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateThreshold = weekAgo.toISOString();
        query = query.gte("last_contact_at", dateThreshold);
        break;
      }
      case "month": {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateThreshold = monthAgo.toISOString();
        query = query.gte("last_contact_at", dateThreshold);
        break;
      }
    }
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as Contact[]) || [];
}

// Fetch contact stats
async function fetchContactStats(): Promise<ContactStats> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("id, status, created_at");

  if (error) throw error;

  const contacts = data || [];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    total: contacts.length,
    active: contacts.filter((c) => c.status === "active").length,
    inactive: contacts.filter((c) => c.status === "inactive").length,
    leads: contacts.filter((c) => c.status === "lead").length,
    clients: contacts.filter((c) => c.status === "client").length,
    prospects: contacts.filter((c) => c.status === "prospect").length,
    newThisMonth: contacts.filter((c) => new Date(c.created_at) >= monthStart).length,
  };
}

// Create contact
async function createContact(data: ContactFormData & { company_id?: string; created_by?: string }) {
  const supabase = createClient();

  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({
      name: data.name,
      email: data.email || null,
      phone: data.phone,
      company: data.company || null,
      company_id: data.company_id || null,
      tags: data.tags || [],
      notes: data.notes || null,
      status: data.status,
      source: data.source,
      created_by: data.created_by || null,
    })
    .select()
    .single();

  if (error) throw error;
  return contact as Contact;
}

// Update contact
async function updateContact(id: string, data: Partial<ContactFormData>) {
  const supabase = createClient();

  const updateData: Record<string, unknown> = { ...data };
  if (updateData.email === "") updateData.email = null;
  if (updateData.company === "") updateData.company = null;
  if (updateData.notes === "") updateData.notes = null;

  const { data: contact, error } = await supabase
    .from("contacts")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return contact as Contact;
}

// Delete contact
async function deleteContact(id: string) {
  const supabase = createClient();

  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Fetch all unique tags from contacts
async function fetchContactTags(): Promise<string[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("tags");

  if (error) throw error;

  const allTags = new Set<string>();
  (data || []).forEach((contact) => {
    (contact.tags || []).forEach((tag: string) => {
      allTags.add(tag);
    });
  });

  return Array.from(allTags).sort();
}

// Hooks

export function useContacts(filters?: ContactFilters) {
  return useQuery({
    queryKey: contactKeys.list(filters),
    queryFn: () => fetchContacts(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useContactStats() {
  return useQuery({
    queryKey: contactKeys.stats(),
    queryFn: fetchContactStats,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useContactTags() {
  return useQuery({
    queryKey: [...contactKeys.all, "tags"],
    queryFn: fetchContactTags,
    staleTime: 60 * 1000,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (data: ContactFormData) =>
      createContact({
        ...data,
        company_id: user?.companyId,
        created_by: user?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
      toast.success("Contato criado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating contact:", error);
      toast.error("Erro ao criar contato");
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContactFormData> }) =>
      updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
      toast.success("Contato atualizado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error updating contact:", error);
      toast.error("Erro ao atualizar contato");
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactKeys.all });
      toast.success("Contato excluído com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error deleting contact:", error);
      toast.error("Erro ao excluir contato");
    },
  });
}

export function useContactsRealtime() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!user?.companyId) return;

    const channel = supabase
      .channel("contacts-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contacts",
          filter: `company_id=eq.${user.companyId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: contactKeys.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.companyId, queryClient, supabase]);
}
