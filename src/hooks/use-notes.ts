"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Note, NoteStats, NoteCategory } from "@/types/atendimento";
import { toast } from "sonner";

// Query keys
export const noteKeys = {
  all: ["notes"] as const,
  list: (filters?: Record<string, unknown>) => [...noteKeys.all, "list", filters] as const,
  stats: () => [...noteKeys.all, "stats"] as const,
  detail: (id: string) => [...noteKeys.all, "detail", id] as const,
  byContact: (contactId: string) => [...noteKeys.all, "contact", contactId] as const,
};

// Fetch notes with filters
async function fetchNotes(filters?: {
  category?: NoteCategory;
  contactId?: string;
  search?: string;
  pinned?: boolean;
  limit?: number;
  offset?: number;
}) {
  const supabase = createClient();
  
  let query = supabase
    .from("notes")
    .select(`
      *,
      contact:contacts(name, phone, avatar),
      creator:profiles(name, avatar)
    `, { count: "exact" })
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false });

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }
  
  if (filters?.contactId) {
    query = query.eq("contact_id", filters.contactId);
  }
  
  if (filters?.pinned !== undefined) {
    query = query.eq("pinned", filters.pinned);
  }
  
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error, count } = await query;
  
  if (error) throw error;
  
  const notes: Note[] = (data || []).map((item) => ({
    id: item.id,
    contact_id: item.contact_id,
    contact_name: item.contact?.name || "Unknown",
    contact_phone: item.contact?.phone || "",
    contact_avatar: item.contact?.avatar,
    content: item.content,
    category: item.category,
    created_by: item.created_by,
    created_by_name: item.creator?.name || "Unknown",
    created_by_avatar: item.creator?.avatar,
    created_at: item.created_at,
    updated_at: item.updated_at,
    pinned: item.pinned,
    tags: item.tags,
    conversation_id: item.conversation_id,
  }));
  
  return { notes, count: count || 0 };
}

// Fetch note stats
async function fetchNoteStats(): Promise<NoteStats> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("notes")
    .select("category, pinned, created_at");
  
  if (error) throw error;
  
  const stats: NoteStats = {
    total_notes: data?.length || 0,
    notes_by_category: {
      general: 0,
      important: 0,
      followup: 0,
      complaint: 0,
      sale: 0,
      support: 0,
    },
    recent_notes_count: 0,
    pinned_count: 0,
  };
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  data?.forEach((note) => {
    if (note.category) {
      stats.notes_by_category[note.category as NoteCategory]++;
    }
    
    if (note.pinned) {
      stats.pinned_count++;
    }
    
    if (note.created_at && new Date(note.created_at) > sevenDaysAgo) {
      stats.recent_notes_count++;
    }
  });
  
  return stats;
}

// Create note
async function createNote(data: {
  contact_id: string;
  content: string;
  category: NoteCategory;
  created_by: string;
  pinned?: boolean;
  tags?: string[];
  conversation_id?: string;
}) {
  const supabase = createClient();
  
  const { data: note, error } = await supabase
    .from("notes")
    .insert({
      contact_id: data.contact_id,
      content: data.content,
      category: data.category,
      created_by: data.created_by,
      pinned: data.pinned || false,
      tags: data.tags,
      conversation_id: data.conversation_id,
    })
    .select()
    .single();
  
  if (error) throw error;
  return note;
}

// Update note
async function updateNote(id: string, updates: Partial<Note>) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("notes")
    .update({
      content: updates.content,
      category: updates.category,
      pinned: updates.pinned,
      tags: updates.tags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Delete note
async function deleteNote(id: string) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
}

// Toggle pin
async function togglePinNote(id: string, pinned: boolean) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("notes")
    .update({
      pinned,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ============================================
// Hooks
// ============================================

export function useNotes(filters?: {
  category?: NoteCategory;
  contactId?: string;
  search?: string;
  pinned?: boolean;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: noteKeys.list(filters),
    queryFn: () => fetchNotes(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useNotesByContact(contactId: string) {
  return useQuery({
    queryKey: noteKeys.byContact(contactId),
    queryFn: () => fetchNotes({ contactId }),
    staleTime: 5 * 60 * 1000,
    enabled: !!contactId,
  });
}

export function useNoteStats() {
  return useQuery({
    queryKey: noteKeys.stats(),
    queryFn: fetchNoteStats,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createNote,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
      if (variables.contact_id) {
        queryClient.invalidateQueries({ queryKey: noteKeys.byContact(variables.contact_id) });
      }
      toast.success("Nota criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar nota", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Note> }) =>
      updateNote(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: noteKeys.byContact(data.contact_id) });
      toast.success("Nota atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar nota", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
      toast.success("Nota removida");
    },
    onError: (error) => {
      toast.error("Erro ao remover nota", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    },
  });
}

export function useTogglePinNote() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      togglePinNote(id, pinned),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
      queryClient.invalidateQueries({ queryKey: noteKeys.byContact(data.contact_id) });
      toast.success(variables.pinned ? "Nota fixada" : "Nota desfixada");
    },
    onError: (error) => {
      toast.error("Erro ao alterar nota", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    },
  });
}

// Realtime subscription
export function useNotesRealtime() {
  const queryClient = useQueryClient();
  
  return {
    subscribe: () => {
      const supabase = createClient();
      
      const subscription = supabase
        .channel("notes_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notes" },
          () => {
            queryClient.invalidateQueries({ queryKey: noteKeys.all });
          }
        )
        .subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
    },
  };
}
