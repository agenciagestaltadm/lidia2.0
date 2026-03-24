"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ============================================================
// TIPOS
// ============================================================

export type KanbanPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type KanbanCardType = "TASK" | "BUG" | "FEATURE" | "EPIC" | "STORY";
export type BoardRole = "ADMIN" | "MANAGER" | "MEMBER" | "VIEWER";

export interface KanbanBoard {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_archived: boolean;
  is_public: boolean;
  settings: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
  columns?: KanbanColumn[];
  members?: KanbanBoardMember[];
}

export interface KanbanColumn {
  id: string;
  board_id: string;
  name: string;
  order: number;
  color: string | null;
  wip_limit: number | null;
  is_done_column: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  cards?: KanbanCard[];
}

export interface KanbanCard {
  id: string;
  column_id: string;
  board_id: string;
  company_id: string;
  title: string;
  description: string | null;
  order: number;
  priority: KanbanPriority;
  card_type: KanbanCardType;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  cover_image_url: string | null;
  is_archived: boolean;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
  labels?: KanbanLabel[];
  members?: KanbanCardMember[];
  comments?: KanbanComment[];
  attachments?: KanbanAttachment[];
  checklists?: KanbanChecklist[];
}

export interface KanbanLabel {
  id: string;
  company_id: string;
  name: string;
  color: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface KanbanBoardMember {
  id: string;
  board_id: string;
  user_id: string;
  role: BoardRole;
  permissions: Record<string, boolean>;
  joined_at: string;
  invited_by: string | null;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface KanbanCardMember {
  card_id: string;
  user_id: string;
  assigned_by: string | null;
  assigned_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface KanbanComment {
  id: string;
  card_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface KanbanAttachment {
  id: string;
  card_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  storage_bucket: string;
  thumbnail_url: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface KanbanChecklist {
  id: string;
  card_id: string;
  title: string;
  order: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  items?: KanbanChecklistItem[];
}

export interface KanbanChecklistItem {
  id: string;
  checklist_id: string;
  content: string;
  is_completed: boolean;
  order: number;
  completed_by: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface KanbanActivity {
  id: string;
  company_id: string;
  board_id: string | null;
  card_id: string | null;
  user_id: string;
  action_type: string;
  action_data: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export interface CreateBoardInput {
  name: string;
  description?: string;
  is_public?: boolean;
  settings?: Record<string, unknown>;
}

export interface UpdateBoardInput {
  name?: string;
  description?: string;
  is_public?: boolean;
  is_archived?: boolean;
  settings?: Record<string, unknown>;
}

export interface CreateColumnInput {
  board_id: string;
  name: string;
  color?: string;
  wip_limit?: number;
  is_done_column?: boolean;
}

export interface UpdateColumnInput {
  name?: string;
  color?: string;
  wip_limit?: number;
  is_done_column?: boolean;
  order?: number;
}

export interface CreateCardInput {
  column_id: string;
  board_id: string;
  title: string;
  description?: string;
  priority?: KanbanPriority;
  card_type?: KanbanCardType;
  due_date?: string;
  start_date?: string;
  estimated_hours?: number;
  label_ids?: string[];
  member_ids?: string[];
}

export interface UpdateCardInput {
  title?: string;
  description?: string;
  column_id?: string;
  priority?: KanbanPriority;
  card_type?: KanbanCardType;
  due_date?: string | null;
  start_date?: string | null;
  completed_at?: string | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  cover_image_url?: string | null;
  is_archived?: boolean;
}

export interface MoveCardInput {
  card_id: string;
  new_column_id: string;
  new_order: number;
}

// ============================================================
// HOOKS - BOARDS
// ============================================================

export function useBoards(companyId?: string) {
  const supabase = useMemo(() => createClient(), []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kanban-boards", companyId],
    queryFn: async () => {
      let query = supabase
        .from("kanban_boards")
        .select(`
          *,
          members:kanban_board_members(
            id,
            user_id,
            role,
            user:profiles(user_id, email, full_name, avatar_url)
          )
        `)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as KanbanBoard[];
    },
    enabled: !!companyId,
  });

  return {
    boards: data || [],
    isLoading,
    error,
    refetch,
  };
}

export function useBoard(boardId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kanban-board", boardId],
    queryFn: async () => {
      if (!boardId) return null;

      const { data, error } = await supabase
        .from("kanban_boards")
        .select(`
          *,
          columns:kanban_columns(*, cards:kanban_cards(*)),
          members:kanban_board_members(
            id,
            user_id,
            role,
            permissions,
            user:profiles(user_id, email, full_name, avatar_url)
          )
        `)
        .eq("id", boardId)
        .single();

      if (error) throw error;
      return data as KanbanBoard;
    },
    enabled: !!boardId,
  });

  const createBoard = useMutation({
    mutationFn: async (input: CreateBoardInput) => {
      const { data, error } = await supabase
        .from("kanban_boards")
        .insert({
          name: input.name,
          description: input.description,
          is_public: input.is_public ?? false,
          settings: input.settings || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Quadro criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-boards"] });
    },
    onError: (error) => {
      toast.error("Erro ao criar quadro: " + error.message);
    },
  });

  const updateBoard = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateBoardInput }) => {
      const { data, error } = await supabase
        .from("kanban_boards")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Quadro atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-boards"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-board"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar quadro: " + error.message);
    },
  });

  const deleteBoard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("kanban_boards")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Quadro excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-boards"] });
    },
    onError: (error) => {
      toast.error("Erro ao excluir quadro: " + error.message);
    },
  });

  return {
    board: data,
    isLoading,
    error,
    refetch,
    createBoard,
    updateBoard,
    deleteBoard,
  };
}

// ============================================================
// HOOKS - COLUMNS
// ============================================================

export function useColumns(boardId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kanban-columns", boardId],
    queryFn: async () => {
      if (!boardId) return [];

      const { data, error } = await supabase
        .from("kanban_columns")
        .select(`
          *,
          cards:kanban_cards(
            *,
            labels:kanban_card_labels(label:kanban_labels(*)),
            members:kanban_card_members(user:profiles(user_id, email, full_name, avatar_url))
          )
        `)
        .eq("board_id", boardId)
        .order("order", { ascending: true });

      if (error) throw error;
      return data as KanbanColumn[];
    },
    enabled: !!boardId,
  });

  const createColumn = useMutation({
    mutationFn: async (input: CreateColumnInput) => {
      // Get current max order
      const { data: maxOrder } = await supabase
        .from("kanban_columns")
        .select("order")
        .eq("board_id", input.board_id)
        .order("order", { ascending: false })
        .limit(1)
        .single();

      const { data, error } = await supabase
        .from("kanban_columns")
        .insert({
          ...input,
          order: (maxOrder?.order ?? -1) + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Coluna criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
    },
    onError: (error) => {
      toast.error("Erro ao criar coluna: " + error.message);
    },
  });

  const updateColumn = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateColumnInput }) => {
      const { data, error } = await supabase
        .from("kanban_columns")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar coluna: " + error.message);
    },
  });

  const deleteColumn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("kanban_columns")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Coluna excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
    },
    onError: (error) => {
      toast.error("Erro ao excluir coluna: " + error.message);
    },
  });

  const reorderColumns = useMutation({
    mutationFn: async (columnIds: string[]) => {
      const updates = columnIds.map((id, index) =>
        supabase
          .from("kanban_columns")
          .update({ order: index })
          .eq("id", id)
      );

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
    },
  });

  return {
    columns: data || [],
    isLoading,
    error,
    refetch,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
  };
}

// ============================================================
// HOOKS - CARDS
// ============================================================

export function useCards(columnId: string | null) {
  const supabase = useMemo(() => createClient(), []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kanban-cards", columnId],
    queryFn: async () => {
      if (!columnId) return [];

      const { data, error } = await supabase
        .from("kanban_cards")
        .select(`
          *,
          labels:kanban_card_labels(label:kanban_labels(*)),
          members:kanban_card_members(user:profiles(user_id, email, full_name, avatar_url))
        `)
        .eq("column_id", columnId)
        .eq("is_archived", false)
        .order("order", { ascending: true });

      if (error) throw error;
      return data as KanbanCard[];
    },
    enabled: !!columnId,
  });

  return {
    cards: data || [],
    isLoading,
    error,
    refetch,
  };
}

export function useCard(cardId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kanban-card", cardId],
    queryFn: async () => {
      if (!cardId) return null;

      const { data, error } = await supabase
        .from("kanban_cards")
        .select(`
          *,
          labels:kanban_card_labels(label:kanban_labels(*)),
          members:kanban_card_members(user:profiles(user_id, email, full_name, avatar_url)),
          comments:kanban_comments(*, user:profiles(user_id, email, full_name, avatar_url)),
          attachments:kanban_attachments(*),
          checklists:kanban_checklists(*, items:kanban_checklist_items(*))
        `)
        .eq("id", cardId)
        .single();

      if (error) throw error;
      return data as KanbanCard;
    },
    enabled: !!cardId,
  });

  const createCard = useMutation({
    mutationFn: async (input: CreateCardInput) => {
      // Get current max order in column
      const { data: maxOrder } = await supabase
        .from("kanban_cards")
        .select("order")
        .eq("column_id", input.column_id)
        .order("order", { ascending: false })
        .limit(1)
        .single();

      const { data: card, error } = await supabase
        .from("kanban_cards")
        .insert({
          ...input,
          order: (maxOrder?.order ?? -1) + 1,
          priority: input.priority || "MEDIUM",
          card_type: input.card_type || "TASK",
        })
        .select()
        .single();

      if (error) throw error;

      // Add labels if provided
      if (input.label_ids?.length) {
        await supabase.from("kanban_card_labels").insert(
          input.label_ids.map((labelId) => ({
            card_id: card.id,
            label_id: labelId,
          }))
        );
      }

      // Add members if provided
      if (input.member_ids?.length) {
        await supabase.from("kanban_card_members").insert(
          input.member_ids.map((userId) => ({
            card_id: card.id,
            user_id: userId,
          }))
        );
      }

      return card;
    },
    onSuccess: () => {
      toast.success("Card criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-cards"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
    },
    onError: (error) => {
      toast.error("Erro ao criar card: " + error.message);
    },
  });

  const updateCard = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateCardInput }) => {
      const { data, error } = await supabase
        .from("kanban_cards")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Card atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-cards"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-card"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar card: " + error.message);
    },
  });

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("kanban_cards")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Card excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-cards"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
    },
    onError: (error) => {
      toast.error("Erro ao excluir card: " + error.message);
    },
  });

  const moveCard = useMutation({
    mutationFn: async (input: MoveCardInput) => {
      const { data, error } = await supabase.rpc("reorder_kanban_cards", {
        p_card_id: input.card_id,
        p_new_column_id: input.new_column_id,
        p_new_order: input.new_order,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-cards"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
    },
    onError: (error) => {
      toast.error("Erro ao mover card: " + error.message);
    },
  });

  return {
    card: data,
    isLoading,
    error,
    refetch,
    createCard,
    updateCard,
    deleteCard,
    moveCard,
  };
}

// ============================================================
// HOOKS - LABELS
// ============================================================

export function useLabels(companyId?: string) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kanban-labels", companyId],
    queryFn: async () => {
      let query = supabase
        .from("kanban_labels")
        .select("*")
        .order("name", { ascending: true });

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as KanbanLabel[];
    },
    enabled: !!companyId,
  });

  const createLabel = useMutation({
    mutationFn: async (input: { name: string; color: string; description?: string }) => {
      const { data, error } = await supabase
        .from("kanban_labels")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Etiqueta criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-labels"] });
    },
    onError: (error) => {
      toast.error("Erro ao criar etiqueta: " + error.message);
    },
  });

  const updateLabel = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<KanbanLabel> }) => {
      const { data, error } = await supabase
        .from("kanban_labels")
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Etiqueta atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-labels"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar etiqueta: " + error.message);
    },
  });

  const deleteLabel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("kanban_labels")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Etiqueta excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-labels"] });
    },
    onError: (error) => {
      toast.error("Erro ao excluir etiqueta: " + error.message);
    },
  });

  return {
    labels: data || [],
    isLoading,
    error,
    refetch,
    createLabel,
    updateLabel,
    deleteLabel,
  };
}

// ============================================================
// HOOKS - COMMENTS
// ============================================================

export function useComments(cardId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kanban-comments", cardId],
    queryFn: async () => {
      if (!cardId) return [];

      const { data, error } = await supabase
        .from("kanban_comments")
        .select(`
          *,
          user:profiles(user_id, email, full_name, avatar_url)
        `)
        .eq("card_id", cardId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as KanbanComment[];
    },
    enabled: !!cardId,
  });

  const createComment = useMutation({
    mutationFn: async (input: { content: string; parent_id?: string }) => {
      if (!cardId) throw new Error("Card ID is required");

      const { data, error } = await supabase
        .from("kanban_comments")
        .insert({
          card_id: cardId,
          content: input.content,
          parent_id: input.parent_id || null,
        })
        .select(`
          *,
          user:profiles(user_id, email, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-comments"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-card"] });
    },
    onError: (error) => {
      toast.error("Erro ao criar comentário: " + error.message);
    },
  });

  const updateComment = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const { data, error } = await supabase
        .from("kanban_comments")
        .update({
          content,
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-comments"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar comentário: " + error.message);
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("kanban_comments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Comentário excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-comments"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-card"] });
    },
    onError: (error) => {
      toast.error("Erro ao excluir comentário: " + error.message);
    },
  });

  return {
    comments: data || [],
    isLoading,
    error,
    refetch,
    createComment,
    updateComment,
    deleteComment,
  };
}

// ============================================================
// HOOKS - CHECKLISTS
// ============================================================

export function useChecklists(cardId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kanban-checklists", cardId],
    queryFn: async () => {
      if (!cardId) return [];

      const { data, error } = await supabase
        .from("kanban_checklists")
        .select(`
          *,
          items:kanban_checklist_items(*)
        `)
        .eq("card_id", cardId)
        .order("order", { ascending: true });

      if (error) throw error;
      return data as KanbanChecklist[];
    },
    enabled: !!cardId,
  });

  const createChecklist = useMutation({
    mutationFn: async (input: { title: string }) => {
      if (!cardId) throw new Error("Card ID is required");

      const { data: maxOrder } = await supabase
        .from("kanban_checklists")
        .select("order")
        .eq("card_id", cardId)
        .order("order", { ascending: false })
        .limit(1)
        .single();

      const { data, error } = await supabase
        .from("kanban_checklists")
        .insert({
          card_id: cardId,
          title: input.title,
          order: (maxOrder?.order ?? -1) + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Checklist criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-checklists"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-card"] });
    },
    onError: (error) => {
      toast.error("Erro ao criar checklist: " + error.message);
    },
  });

  const deleteChecklist = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("kanban_checklists")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Checklist excluído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-checklists"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-card"] });
    },
    onError: (error) => {
      toast.error("Erro ao excluir checklist: " + error.message);
    },
  });

  // Checklist Items
  const createChecklistItem = useMutation({
    mutationFn: async ({ checklistId, content }: { checklistId: string; content: string }) => {
      const { data: maxOrder } = await supabase
        .from("kanban_checklist_items")
        .select("order")
        .eq("checklist_id", checklistId)
        .order("order", { ascending: false })
        .limit(1)
        .single();

      const { data, error } = await supabase
        .from("kanban_checklist_items")
        .insert({
          checklist_id: checklistId,
          content,
          order: (maxOrder?.order ?? -1) + 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-checklists"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-card"] });
    },
    onError: (error) => {
      toast.error("Erro ao criar item: " + error.message);
    },
  });

  const toggleChecklistItem = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const { data, error } = await supabase
        .from("kanban_checklist_items")
        .update({
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-checklists"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-card"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar item: " + error.message);
    },
  });

  const deleteChecklistItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("kanban_checklist_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-checklists"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-card"] });
    },
    onError: (error) => {
      toast.error("Erro ao excluir item: " + error.message);
    },
  });

  return {
    checklists: data || [],
    isLoading,
    error,
    refetch,
    createChecklist,
    deleteChecklist,
    createChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
  };
}

// ============================================================
// HOOKS - REALTIME
// ============================================================

export function useKanbanRealtime(boardId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!boardId) return;

    const channel = supabase
      .channel(`kanban-board-${boardId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kanban_cards",
          filter: `board_id=eq.${boardId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["kanban-cards"] });
          queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kanban_columns",
          filter: `board_id=eq.${boardId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      channel.unsubscribe();
    };
  }, [boardId, queryClient, supabase]);

  return { isConnected };
}

// ============================================================
// HOOKS - BOARD MEMBERS
// ============================================================

export function useBoardMembers(boardId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kanban-board-members", boardId],
    queryFn: async () => {
      if (!boardId) return [];

      const { data, error } = await supabase
        .from("kanban_board_members")
        .select(`
          *,
          user:profiles(user_id, email, full_name, avatar_url)
        `)
        .eq("board_id", boardId);

      if (error) throw error;
      return data as KanbanBoardMember[];
    },
    enabled: !!boardId,
  });

  const addMember = useMutation({
    mutationFn: async (input: { user_id: string; role: BoardRole }) => {
      if (!boardId) throw new Error("Board ID is required");

      const { data, error } = await supabase
        .from("kanban_board_members")
        .insert({
          board_id: boardId,
          user_id: input.user_id,
          role: input.role,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Membro adicionado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-board-members"] });
    },
    onError: (error) => {
      toast.error("Erro ao adicionar membro: " + error.message);
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("kanban_board_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Membro removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-board-members"] });
    },
    onError: (error) => {
      toast.error("Erro ao remover membro: " + error.message);
    },
  });

  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: BoardRole }) => {
      const { data, error } = await supabase
        .from("kanban_board_members")
        .update({ role })
        .eq("id", memberId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Papel atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-board-members"] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar papel: " + error.message);
    },
  });

  return {
    members: data || [],
    isLoading,
    error,
    refetch,
    addMember,
    removeMember,
    updateMemberRole,
  };
}

// ============================================================
// HOOKS - CARD MEMBERS
// ============================================================

export function useCardMembers(cardId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const assignMember = useMutation({
    mutationFn: async (userId: string) => {
      if (!cardId) throw new Error("Card ID is required");

      const { data, error } = await supabase
        .from("kanban_card_members")
        .insert({
          card_id: cardId,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Membro atribuído com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["kanban-card"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-cards"] });
    },
    onError: (error) => {
      toast.error("Erro ao atribuir membro: " + error.message);
    },
  });

  const unassignMember = useMutation({
    mutationFn: async (userId: string) => {
      if (!cardId) throw new Error("Card ID is required");

      const { error } = await supabase
        .from("kanban_card_members")
        .delete()
        .eq("card_id", cardId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Membro removido do card!");
      queryClient.invalidateQueries({ queryKey: ["kanban-card"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-cards"] });
    },
    onError: (error) => {
      toast.error("Erro ao remover membro: " + error.message);
    },
  });

  return {
    assignMember,
    unassignMember,
  };
}

// ============================================================
// HOOKS - ACTIVITIES
// ============================================================

export function useActivities(boardId?: string, cardId?: string) {
  const supabase = useMemo(() => createClient(), []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kanban-activities", boardId, cardId],
    queryFn: async () => {
      let query = supabase
        .from("kanban_activities")
        .select(`
          *,
          user:profiles(user_id, email, full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (boardId) {
        query = query.eq("board_id", boardId);
      }

      if (cardId) {
        query = query.eq("card_id", cardId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as KanbanActivity[];
    },
    enabled: !!(boardId || cardId),
  });

  return {
    activities: data || [],
    isLoading,
    error,
    refetch,
  };
}
