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
  company_id: string;
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
  company_id: string;
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
        .select("*")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching boards:", error);
        throw error;
      }
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
        .select("*")
        .eq("id", boardId)
        .single();

      if (error) {
        console.error("Error fetching board:", error);
        throw error;
      }
      return data as KanbanBoard;
    },
    enabled: !!boardId,
  });

  const createBoard = useMutation({
    mutationFn: async (input: CreateBoardInput) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("kanban_boards")
        .insert({
          name: input.name,
          description: input.description,
          company_id: input.company_id,
          created_by: user.id,
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
        .select("*")
        .eq("board_id", boardId)
        .order("order", { ascending: true });

      if (error) {
        console.error("Error fetching columns:", error);
        throw error;
      }
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
        .select("*")
        .eq("column_id", columnId)
        .eq("is_archived", false)
        .order("order", { ascending: true });

      if (error) {
        console.error("Error fetching cards:", error);
        throw error;
      }
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

export function useCardsByBoard(boardId: string | null) {
  const supabase = useMemo(() => createClient(), []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kanban-board-cards", boardId],
    queryFn: async () => {
      if (!boardId) return [];

      const { data, error } = await supabase
        .from("kanban_cards")
        .select("*")
        .eq("board_id", boardId)
        .eq("is_archived", false)
        .order("order", { ascending: true });

      if (error) {
        console.error("Error fetching board cards:", error);
        throw error;
      }
      return data as KanbanCard[];
    },
    enabled: !!boardId,
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
      // Validação de campos obrigatórios
      if (!input.company_id) {
        throw new Error("Company ID é obrigatório para criar um card");
      }
      if (!input.column_id) {
        throw new Error("Coluna é obrigatória para criar um card");
      }
      if (!input.board_id) {
        throw new Error("Board é obrigatório para criar um card");
      }
      if (!input.title?.trim()) {
        throw new Error("Título do card é obrigatório");
      }

      // Get current max order in column
      const { data: maxOrder, error: orderError } = await supabase
        .from("kanban_cards")
        .select("order")
        .eq("column_id", input.column_id)
        .order("order", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orderError) {
        console.error("Erro ao buscar ordem máxima:", orderError);
        throw new Error("Erro ao preparar criação do card");
      }

      // Preparar dados do card com valores default
      const cardData = {
        column_id: input.column_id,
        board_id: input.board_id,
        company_id: input.company_id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        order: (maxOrder?.order ?? -1) + 1,
        priority: input.priority || "MEDIUM",
        card_type: input.card_type || "TASK",
        due_date: input.due_date || null,
        start_date: input.start_date || null,
        estimated_hours: input.estimated_hours || null,
      };

      const { data: card, error } = await supabase
        .from("kanban_cards")
        .insert(cardData)
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar card:", error);
        
        // Tratamento específico por código de erro
        if (error.code === "23503") {
          throw new Error("Coluna ou board não encontrados. Recarregue a página e tente novamente.");
        }
        if (error.code === "42501") {
          throw new Error("Você não tem permissão para criar cards neste board.");
        }
        if (error.code === "23502") {
          throw new Error("Dados incompletos. Verifique se todos os campos obrigatórios estão preenchidos.");
        }
        if (error.code === "PGRST116") {
          throw new Error("Erro de validação nos dados do card.");
        }
        
        throw new Error(error.message || "Erro desconhecido ao criar card");
      }

      if (!card) {
        throw new Error("Card não foi criado. Tente novamente.");
      }

      // Add labels if provided
      if (input.label_ids?.length) {
        const { error: labelError } = await supabase.from("kanban_card_labels").insert(
          input.label_ids.map((labelId) => ({
            card_id: card.id,
            label_id: labelId,
          }))
        );
        
        if (labelError) {
          console.error("Erro ao adicionar labels:", labelError);
          // Não falha a operação principal, apenas loga o erro
        }
      }

      // Add members if provided
      if (input.member_ids?.length) {
        const { error: memberError } = await supabase.from("kanban_card_members").insert(
          input.member_ids.map((userId) => ({
            card_id: card.id,
            user_id: userId,
          }))
        );
        
        if (memberError) {
          console.error("Erro ao adicionar membros:", memberError);
          // Não falha a operação principal, apenas loga o erro
        }
      }

      return card;
    },
    onSuccess: (data) => {
      toast.success(`Card "${data.title}" criado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["kanban-cards"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-board-cards"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar card");
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
    // Optimistic update
    onMutate: async (input) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["kanban-cards"] });
      await queryClient.cancelQueries({ queryKey: ["kanban-columns"] });

      // Snapshot the previous value
      const previousCards = queryClient.getQueryData<KanbanCard[]>(["kanban-cards"]);
      const previousColumns = queryClient.getQueryData<KanbanColumn[]>(["kanban-columns"]);

      // Optimistically update all card caches
      queryClient.setQueriesData<KanbanCard[]>({ queryKey: ["kanban-cards"] }, (old) => {
        if (!old) return old;
        return old.map((card) =>
          card.id === input.card_id
            ? { ...card, column_id: input.new_column_id, order: input.new_order }
            : card
        );
      });

      // Return a context object with the snapshotted value
      return { previousCards, previousColumns };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (error, input, context) => {
      if (context?.previousCards) {
        queryClient.setQueryData(["kanban-cards"], context.previousCards);
      }
      if (context?.previousColumns) {
        queryClient.setQueryData(["kanban-columns"], context.previousColumns);
      }
      toast.error("Erro ao mover card: " + error.message);
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban-cards"] });
      queryClient.invalidateQueries({ queryKey: ["kanban-columns"] });
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
      .subscribe((status: string) => {
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

// ============================================================
// HOOKS - CARD CONTACTS
// ============================================================

export interface KanbanCardContact {
  id: string;
  card_id: string;
  contact_id: string;
  created_at: string;
  contact: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    avatar: string | null;
  };
}

export function useCardContacts(cardId: string | null) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kanban-card-contacts", cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kanban_card_contacts")
        .select(`
          *,
          contact:contacts(id, name, phone, email, avatar)
        `)
        .eq("card_id", cardId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as KanbanCardContact[];
    },
    enabled: !!cardId,
  });

  const addContact = useMutation({
    mutationFn: async (contactId: string) => {
      const { data, error } = await supabase
        .from("kanban_card_contacts")
        .insert({
          card_id: cardId!,
          contact_id: contactId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Contato adicionado ao card!");
      queryClient.invalidateQueries({ queryKey: ["kanban-card-contacts"] });
    },
    onError: (error) => {
      toast.error("Erro ao adicionar contato: " + error.message);
    },
  });

  const removeContact = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from("kanban_card_contacts")
        .delete()
        .eq("id", contactId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contato removido do card!");
      queryClient.invalidateQueries({ queryKey: ["kanban-card-contacts"] });
    },
    onError: (error) => {
      toast.error("Erro ao remover contato: " + error.message);
    },
  });

  return {
    contacts: data || [],
    isLoading,
    error,
    refetch,
    addContact,
    removeContact,
  };
}
