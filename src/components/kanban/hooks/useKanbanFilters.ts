"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useKanbanContext,
  KanbanFilters,
} from "../context/KanbanContext";
import { KanbanCard, KanbanPriority, KanbanCardType } from "@/hooks/use-kanban";

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const STORAGE_KEY = "kanban-filters";

export interface UseKanbanFiltersReturn {
  // Filter values
  search: string;
  priorities: KanbanPriority[];
  types: KanbanCardType[];
  assignees: string[];
  labels: string[];
  dueDateRange: { from?: Date; to?: Date } | null;
  showCompleted: boolean;

  // Debounced search for performance
  debouncedSearch: string;

  // Actions
  setSearch: (search: string) => void;
  setPriorities: (priorities: KanbanPriority[]) => void;
  togglePriority: (priority: KanbanPriority) => void;
  setTypes: (types: KanbanCardType[]) => void;
  toggleType: (type: KanbanCardType) => void;
  setAssignees: (assignees: string[]) => void;
  toggleAssignee: (assignee: string) => void;
  setLabels: (labels: string[]) => void;
  toggleLabel: (label: string) => void;
  setDueDateRange: (range: { from?: Date; to?: Date } | null) => void;
  setShowCompleted: (show: boolean) => void;
  resetFilters: () => void;

  // Filter state
  hasActiveFilters: boolean;
  activeFiltersCount: number;

  // Filter function
  filterCards: (cards: KanbanCard[]) => KanbanCard[];

  // Persistence
  saveFilters: () => void;
  loadFilters: () => void;
}

/**
 * Hook especializado para gerenciamento de filtros do Kanban
 * Inclui debounce na busca, persistência em localStorage e função de filtragem
 */
export function useKanbanFilters(): UseKanbanFiltersReturn {
  const {
    state,
    setFilters,
    resetFilters: resetContextFilters,
    hasActiveFilters,
    activeFiltersCount,
  } = useKanbanContext();

  const { filters } = state;

  // Debounce search para não re-renderizar a cada keystroke
  const debouncedSearch = useDebounce(filters.search, 300);

  // Individual setters
  const setSearch = useCallback(
    (search: string) => {
      setFilters({ search });
    },
    [setFilters]
  );

  const setPriorities = useCallback(
    (priorities: KanbanPriority[]) => {
      setFilters({ priorities });
    },
    [setFilters]
  );

  const togglePriority = useCallback(
    (priority: KanbanPriority) => {
      const newPriorities = filters.priorities.includes(priority)
        ? filters.priorities.filter((p) => p !== priority)
        : [...filters.priorities, priority];
      setFilters({ priorities: newPriorities });
    },
    [filters.priorities, setFilters]
  );

  const setTypes = useCallback(
    (types: KanbanCardType[]) => {
      setFilters({ types });
    },
    [setFilters]
  );

  const toggleType = useCallback(
    (type: KanbanCardType) => {
      const newTypes = filters.types.includes(type)
        ? filters.types.filter((t) => t !== type)
        : [...filters.types, type];
      setFilters({ types: newTypes });
    },
    [filters.types, setFilters]
  );

  const setAssignees = useCallback(
    (assignees: string[]) => {
      setFilters({ assignees });
    },
    [setFilters]
  );

  const toggleAssignee = useCallback(
    (assignee: string) => {
      const newAssignees = filters.assignees.includes(assignee)
        ? filters.assignees.filter((a) => a !== assignee)
        : [...filters.assignees, assignee];
      setFilters({ assignees: newAssignees });
    },
    [filters.assignees, setFilters]
  );

  const setLabels = useCallback(
    (labels: string[]) => {
      setFilters({ labels });
    },
    [setFilters]
  );

  const toggleLabel = useCallback(
    (label: string) => {
      const newLabels = filters.labels.includes(label)
        ? filters.labels.filter((l) => l !== label)
        : [...filters.labels, label];
      setFilters({ labels: newLabels });
    },
    [filters.labels, setFilters]
  );

  const setDueDateRange = useCallback(
    (range: { from?: Date; to?: Date } | null) => {
      setFilters({ dueDateRange: range });
    },
    [setFilters]
  );

  const setShowCompleted = useCallback(
    (show: boolean) => {
      setFilters({ showCompleted: show });
    },
    [setFilters]
  );

  // Filter function
  const filterCards = useCallback(
    (cards: KanbanCard[]): KanbanCard[] => {
      return cards.filter((card) => {
        // Search filter
        if (debouncedSearch) {
          const searchLower = debouncedSearch.toLowerCase();
          const matchesSearch =
            card.title.toLowerCase().includes(searchLower) ||
            (card.description?.toLowerCase().includes(searchLower) ?? false);
          if (!matchesSearch) return false;
        }

        // Priority filter
        if (filters.priorities.length > 0) {
          if (!filters.priorities.includes(card.priority)) return false;
        }

        // Type filter
        if (filters.types.length > 0) {
          if (!filters.types.includes(card.card_type)) return false;
        }

        // Assignees filter
        if (filters.assignees.length > 0) {
          const cardAssignees = card.members?.map((a: { user_id: string }) => a.user_id) ?? [];
          const hasMatchingAssignee = filters.assignees.some((a) =>
            cardAssignees.includes(a)
          );
          if (!hasMatchingAssignee) return false;
        }

        // Labels filter
        if (filters.labels.length > 0) {
          const cardLabels = card.labels?.map((l: { id: string }) => l.id) ?? [];
          const hasMatchingLabel = filters.labels.some((l) =>
            cardLabels.includes(l)
          );
          if (!hasMatchingLabel) return false;
        }

        // Due date filter
        if (filters.dueDateRange) {
          if (!card.due_date) return false;
          const dueDate = new Date(card.due_date);
          if (filters.dueDateRange.from && dueDate < filters.dueDateRange.from)
            return false;
          if (filters.dueDateRange.to && dueDate > filters.dueDateRange.to)
            return false;
        }

        // Show completed filter (completed_at indicates completion)
        if (!filters.showCompleted && card.completed_at) {
          return false;
        }

        return true;
      });
    },
    [debouncedSearch, filters]
  );

  // Persistência em localStorage
  const saveFilters = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const filtersToSave = {
        ...filters,
        dueDateRange: filters.dueDateRange
          ? {
              from: filters.dueDateRange.from?.toISOString(),
              to: filters.dueDateRange.to?.toISOString(),
            }
          : null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtersToSave));
    } catch (error) {
      console.error("Failed to save filters:", error);
    }
  }, [filters]);

  const loadFilters = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFilters({
          ...parsed,
          dueDateRange: parsed.dueDateRange
            ? {
                from: parsed.dueDateRange.from
                  ? new Date(parsed.dueDateRange.from)
                  : undefined,
                to: parsed.dueDateRange.to
                  ? new Date(parsed.dueDateRange.to)
                  : undefined,
              }
            : null,
        });
      }
    } catch (error) {
      console.error("Failed to load filters:", error);
    }
  }, [setFilters]);

  // Auto-save filters when they change (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveFilters();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [filters, saveFilters]);

  // Load filters on mount
  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  return useMemo(
    () => ({
      search: filters.search,
      priorities: filters.priorities,
      types: filters.types,
      assignees: filters.assignees,
      labels: filters.labels,
      dueDateRange: filters.dueDateRange,
      showCompleted: filters.showCompleted,
      debouncedSearch,
      setSearch,
      setPriorities,
      togglePriority,
      setTypes,
      toggleType,
      setAssignees,
      toggleAssignee,
      setLabels,
      toggleLabel,
      setDueDateRange,
      setShowCompleted,
      resetFilters: resetContextFilters,
      hasActiveFilters,
      activeFiltersCount,
      filterCards,
      saveFilters,
      loadFilters,
    }),
    [
      filters,
      debouncedSearch,
      setSearch,
      setPriorities,
      togglePriority,
      setTypes,
      toggleType,
      setAssignees,
      toggleAssignee,
      setLabels,
      toggleLabel,
      setDueDateRange,
      setShowCompleted,
      resetContextFilters,
      hasActiveFilters,
      activeFiltersCount,
      filterCards,
      saveFilters,
      loadFilters,
    ]
  );
}
