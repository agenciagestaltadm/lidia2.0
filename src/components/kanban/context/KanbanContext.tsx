"use client";

import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from "react";
import { KanbanCard, KanbanColumn, KanbanBoard, KanbanPriority, KanbanCardType } from "@/hooks/use-kanban";

// ============================================
// TYPES
// ============================================

export interface KanbanFilters {
  search: string;
  priorities: KanbanPriority[];
  types: KanbanCardType[];
  assignees: string[];
  labels: string[];
  dueDateRange: { from?: Date; to?: Date } | null;
  showCompleted: boolean;
}

export interface KanbanUIState {
  selectedBoardId: string | null;
  isNavigating: boolean;
  activeDragId: string | null;
  dragType: "card" | "column" | null;
  expandedColumns: Set<string>;
  selectedCardId: string | null;
  isFiltersOpen: boolean;
  viewMode: "board" | "list" | "calendar";
  sidebarOpen: boolean;
}

export interface KanbanState {
  filters: KanbanFilters;
  ui: KanbanUIState;
  optimisticUpdates: Map<string, KanbanCard>;
  pendingOperations: Array<{
    id: string;
    type: "move" | "update" | "delete" | "create";
    data: unknown;
    timestamp: number;
    retryCount: number;
  }>;
}

export type KanbanAction =
  | { type: "SET_FILTERS"; payload: Partial<KanbanFilters> }
  | { type: "RESET_FILTERS" }
  | { type: "SET_SELECTED_BOARD"; payload: string | null }
  | { type: "SET_NAVIGATING"; payload: boolean }
  | { type: "SET_ACTIVE_DRAG"; payload: { id: string | null; type: "card" | "column" | null } }
  | { type: "TOGGLE_COLUMN_EXPAND"; payload: string }
  | { type: "SET_SELECTED_CARD"; payload: string | null }
  | { type: "TOGGLE_FILTERS_PANEL" }
  | { type: "SET_VIEW_MODE"; payload: "board" | "list" | "calendar" }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "ADD_OPTIMISTIC_UPDATE"; payload: { id: string; card: KanbanCard } }
  | { type: "REMOVE_OPTIMISTIC_UPDATE"; payload: string }
  | { type: "ADD_PENDING_OPERATION"; payload: KanbanState["pendingOperations"][0] }
  | { type: "REMOVE_PENDING_OPERATION"; payload: string }
  | { type: "INCREMENT_RETRY"; payload: string };

interface KanbanContextValue {
  state: KanbanState;
  dispatch: React.Dispatch<KanbanAction>;
  // Helper functions
  setFilters: (filters: Partial<KanbanFilters>) => void;
  resetFilters: () => void;
  setSelectedBoard: (boardId: string | null) => void;
  setNavigating: (isNavigating: boolean) => void;
  setActiveDrag: (id: string | null, type: "card" | "column" | null) => void;
  toggleColumnExpand: (columnId: string) => void;
  setSelectedCard: (cardId: string | null) => void;
  toggleFiltersPanel: () => void;
  setViewMode: (mode: "board" | "list" | "calendar") => void;
  toggleSidebar: () => void;
  addOptimisticUpdate: (id: string, card: KanbanCard) => void;
  removeOptimisticUpdate: (id: string) => void;
  // Computed values
  hasActiveFilters: boolean;
  activeFiltersCount: number;
}

// ============================================
// INITIAL STATE
// ============================================

const initialFilters: KanbanFilters = {
  search: "",
  priorities: [],
  types: [],
  assignees: [],
  labels: [],
  dueDateRange: null,
  showCompleted: true,
};

const initialUIState: KanbanUIState = {
  selectedBoardId: null,
  isNavigating: false,
  activeDragId: null,
  dragType: null,
  expandedColumns: new Set(),
  selectedCardId: null,
  isFiltersOpen: false,
  viewMode: "board",
  sidebarOpen: true,
};

const initialState: KanbanState = {
  filters: initialFilters,
  ui: initialUIState,
  optimisticUpdates: new Map(),
  pendingOperations: [],
};

// ============================================
// REDUCER
// ============================================

function kanbanReducer(state: KanbanState, action: KanbanAction): KanbanState {
  switch (action.type) {
    case "SET_FILTERS":
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case "RESET_FILTERS":
      return {
        ...state,
        filters: initialFilters,
      };

    case "SET_SELECTED_BOARD":
      return {
        ...state,
        ui: { ...state.ui, selectedBoardId: action.payload },
      };

    case "SET_NAVIGATING":
      return {
        ...state,
        ui: { ...state.ui, isNavigating: action.payload },
      };

    case "SET_ACTIVE_DRAG":
      return {
        ...state,
        ui: {
          ...state.ui,
          activeDragId: action.payload.id,
          dragType: action.payload.type,
        },
      };

    case "TOGGLE_COLUMN_EXPAND": {
      const newExpanded = new Set(state.ui.expandedColumns);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return {
        ...state,
        ui: { ...state.ui, expandedColumns: newExpanded },
      };
    }

    case "SET_SELECTED_CARD":
      return {
        ...state,
        ui: { ...state.ui, selectedCardId: action.payload },
      };

    case "TOGGLE_FILTERS_PANEL":
      return {
        ...state,
        ui: { ...state.ui, isFiltersOpen: !state.ui.isFiltersOpen },
      };

    case "SET_VIEW_MODE":
      return {
        ...state,
        ui: { ...state.ui, viewMode: action.payload },
      };

    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
      };

    case "ADD_OPTIMISTIC_UPDATE": {
      const newOptimistic = new Map(state.optimisticUpdates);
      newOptimistic.set(action.payload.id, action.payload.card);
      return {
        ...state,
        optimisticUpdates: newOptimistic,
      };
    }

    case "REMOVE_OPTIMISTIC_UPDATE": {
      const newOptimistic = new Map(state.optimisticUpdates);
      newOptimistic.delete(action.payload);
      return {
        ...state,
        optimisticUpdates: newOptimistic,
      };
    }

    case "ADD_PENDING_OPERATION":
      return {
        ...state,
        pendingOperations: [...state.pendingOperations, action.payload],
      };

    case "REMOVE_PENDING_OPERATION":
      return {
        ...state,
        pendingOperations: state.pendingOperations.filter(
          (op) => op.id !== action.payload
        ),
      };

    case "INCREMENT_RETRY":
      return {
        ...state,
        pendingOperations: state.pendingOperations.map((op) =>
          op.id === action.payload
            ? { ...op, retryCount: op.retryCount + 1 }
            : op
        ),
      };

    default:
      return state;
  }
}

// ============================================
// CONTEXT
// ============================================

const KanbanContext = createContext<KanbanContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface KanbanProviderProps {
  children: ReactNode;
  initialBoardId?: string | null;
}

export function KanbanProvider({ children, initialBoardId }: KanbanProviderProps) {
  const [state, dispatch] = useReducer(kanbanReducer, {
    ...initialState,
    ui: {
      ...initialUIState,
      selectedBoardId: initialBoardId ?? null,
    },
  });

  // Memoized helper functions
  const setFilters = useCallback((filters: Partial<KanbanFilters>) => {
    dispatch({ type: "SET_FILTERS", payload: filters });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: "RESET_FILTERS" });
  }, []);

  const setSelectedBoard = useCallback((boardId: string | null) => {
    dispatch({ type: "SET_SELECTED_BOARD", payload: boardId });
  }, []);

  const setNavigating = useCallback((isNavigating: boolean) => {
    dispatch({ type: "SET_NAVIGATING", payload: isNavigating });
  }, []);

  const setActiveDrag = useCallback(
    (id: string | null, type: "card" | "column" | null) => {
      dispatch({ type: "SET_ACTIVE_DRAG", payload: { id, type } });
    },
    []
  );

  const toggleColumnExpand = useCallback((columnId: string) => {
    dispatch({ type: "TOGGLE_COLUMN_EXPAND", payload: columnId });
  }, []);

  const setSelectedCard = useCallback((cardId: string | null) => {
    dispatch({ type: "SET_SELECTED_CARD", payload: cardId });
  }, []);

  const toggleFiltersPanel = useCallback(() => {
    dispatch({ type: "TOGGLE_FILTERS_PANEL" });
  }, []);

  const setViewMode = useCallback((mode: "board" | "list" | "calendar") => {
    dispatch({ type: "SET_VIEW_MODE", payload: mode });
  }, []);

  const toggleSidebar = useCallback(() => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  }, []);

  const addOptimisticUpdate = useCallback((id: string, card: KanbanCard) => {
    dispatch({ type: "ADD_OPTIMISTIC_UPDATE", payload: { id, card } });
  }, []);

  const removeOptimisticUpdate = useCallback((id: string) => {
    dispatch({ type: "REMOVE_OPTIMISTIC_UPDATE", payload: id });
  }, []);

  // Computed values
  const hasActiveFilters = useMemo(() => {
    return (
      state.filters.search !== "" ||
      state.filters.priorities.length > 0 ||
      state.filters.types.length > 0 ||
      state.filters.assignees.length > 0 ||
      state.filters.labels.length > 0 ||
      state.filters.dueDateRange !== null ||
      !state.filters.showCompleted
    );
  }, [state.filters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (state.filters.search) count++;
    if (state.filters.priorities.length) count++;
    if (state.filters.types.length) count++;
    if (state.filters.assignees.length) count++;
    if (state.filters.labels.length) count++;
    if (state.filters.dueDateRange) count++;
    if (!state.filters.showCompleted) count++;
    return count;
  }, [state.filters]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      setFilters,
      resetFilters,
      setSelectedBoard,
      setNavigating,
      setActiveDrag,
      toggleColumnExpand,
      setSelectedCard,
      toggleFiltersPanel,
      setViewMode,
      toggleSidebar,
      addOptimisticUpdate,
      removeOptimisticUpdate,
      hasActiveFilters,
      activeFiltersCount,
    }),
    [
      state,
      setFilters,
      resetFilters,
      setSelectedBoard,
      setNavigating,
      setActiveDrag,
      toggleColumnExpand,
      setSelectedCard,
      toggleFiltersPanel,
      setViewMode,
      toggleSidebar,
      addOptimisticUpdate,
      removeOptimisticUpdate,
      hasActiveFilters,
      activeFiltersCount,
    ]
  );

  return (
    <KanbanContext.Provider value={value}>
      {children}
    </KanbanContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useKanbanContext(): KanbanContextValue {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error("useKanbanContext must be used within a KanbanProvider");
  }
  return context;
}

// ============================================
// SELECTOR HOOKS
// ============================================

export function useKanbanFilters(): {
  filters: KanbanFilters;
  setFilters: (filters: Partial<KanbanFilters>) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  activeFiltersCount: number;
} {
  const { state, setFilters, resetFilters, hasActiveFilters, activeFiltersCount } =
    useKanbanContext();

  return {
    filters: state.filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
    activeFiltersCount,
  };
}

export function useKanbanUI(): {
  ui: KanbanUIState;
  setSelectedBoard: (boardId: string | null) => void;
  setNavigating: (isNavigating: boolean) => void;
  setActiveDrag: (id: string | null, type: "card" | "column" | null) => void;
  toggleColumnExpand: (columnId: string) => void;
  setSelectedCard: (cardId: string | null) => void;
  toggleFiltersPanel: () => void;
  setViewMode: (mode: "board" | "list" | "calendar") => void;
  toggleSidebar: () => void;
} {
  const {
    state,
    setSelectedBoard,
    setNavigating,
    setActiveDrag,
    toggleColumnExpand,
    setSelectedCard,
    toggleFiltersPanel,
    setViewMode,
    toggleSidebar,
  } = useKanbanContext();

  return {
    ui: state.ui,
    setSelectedBoard,
    setNavigating,
    setActiveDrag,
    toggleColumnExpand,
    setSelectedCard,
    toggleFiltersPanel,
    setViewMode,
    toggleSidebar,
  };
}

export function useKanbanOptimistic(): {
  optimisticUpdates: Map<string, KanbanCard>;
  addOptimisticUpdate: (id: string, card: KanbanCard) => void;
  removeOptimisticUpdate: (id: string) => void;
} {
  const { state, addOptimisticUpdate, removeOptimisticUpdate } = useKanbanContext();

  return {
    optimisticUpdates: state.optimisticUpdates,
    addOptimisticUpdate,
    removeOptimisticUpdate,
  };
}
