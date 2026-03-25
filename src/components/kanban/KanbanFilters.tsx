"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  X,
  Calendar,
  CheckSquare,
  Square,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useKanbanFilters } from "./hooks/useKanbanFilters";
import { KanbanPriority, KanbanCardType } from "@/hooks/use-kanban";
import { colors } from "@/styles/kanban-tokens";
import { cn } from "@/lib/utils";

// Legacy FilterState type for backward compatibility
export interface FilterState {
  search: string;
  priorities: KanbanPriority[];
  types: KanbanCardType[];
  assignees: string[];
  labels: string[];
  // Extended properties for compatibility with existing code
  priority?: string[];
  dateFilter?: { from?: Date; to?: Date } | null;
}

// Legacy props for backward compatibility
interface LegacyKanbanFiltersProps {
  onClose?: () => void;
  boardId?: string;
  onFilterChange?: (filters: FilterState) => void;
}

// Priority filter button
function PriorityFilterButton({
  priority,
  isSelected,
  onClick,
  count,
}: {
  priority: KanbanPriority;
  isSelected: boolean;
  onClick: () => void;
  count?: number;
}) {
  const config = colors.priority[priority];
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border",
        isSelected
          ? cn(config.bg, config.text, config.border, "shadow-sm")
          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
      )}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.bgSolid.replace('bg-', '').replace('-500', '') }} />
      {config.label}
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
          {count}
        </Badge>
      )}
    </motion.button>
  );
}

// Type filter button
function TypeFilterButton({
  type,
  isSelected,
  onClick,
}: {
  type: KanbanCardType;
  isSelected: boolean;
  onClick: () => void;
}) {
  const config = colors.cardType[type];
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border",
        isSelected
          ? cn(config.bg, config.text, "border-current shadow-sm")
          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
      )}
    >
      {config.label}
    </motion.button>
  );
}

interface KanbanFiltersProps extends LegacyKanbanFiltersProps {
  totalCards?: number;
  filteredCards?: number;
}

export function KanbanFilters({ 
  totalCards = 0, 
  filteredCards = 0,
  onClose,
  boardId,
  onFilterChange 
}: KanbanFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    search,
    debouncedSearch,
    priorities,
    types,
    showCompleted,
    setSearch,
    togglePriority,
    toggleType,
    setShowCompleted,
    resetFilters,
    hasActiveFilters,
    activeFiltersCount,
  } = useKanbanFilters();

  const priorityOptions: KanbanPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  const typeOptions: KanbanCardType[] = ["TASK", "BUG", "FEATURE", "EPIC", "STORY"];

  // Call onFilterChange when filters change (for backward compatibility)
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({
        search,
        priorities,
        types,
        assignees: [],
        labels: [],
        priority: priorities,
        dateFilter: null,
      });
    }
  }, [search, priorities, types, onFilterChange]);

  return (
    <div className="w-full space-y-3">
      {/* Main filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-10 h-10 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters button with badge */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "gap-2 relative",
            hasActiveFilters && "border-violet-500 text-violet-600"
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge 
              variant="default" 
              className="ml-1 bg-violet-500 text-white text-[10px] px-1.5 py-0"
            >
              {activeFiltersCount}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </Button>

        {/* Show completed toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowCompleted(!showCompleted)}
          className={cn(
            "gap-2",
            !showCompleted && "text-amber-600"
          )}
        >
          {showCompleted ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          {showCompleted ? "Ocultar concluídos" : "Mostrando ativos"}
        </Button>

        {/* Reset filters */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="gap-2 text-gray-500 hover:text-gray-700"
              >
                <RotateCcw className="w-4 h-4" />
                Limpar
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        {hasActiveFilters && (
          <span className="text-sm text-gray-500 ml-auto">
            {filteredCards} de {totalCards} cards
          </span>
        )}
      </div>

      {/* Expanded filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
              {/* Priority filters */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Prioridade
                </label>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map((priority) => (
                    <PriorityFilterButton
                      key={priority}
                      priority={priority}
                      isSelected={priorities.includes(priority)}
                      onClick={() => togglePriority(priority)}
                    />
                  ))}
                </div>
              </div>

              {/* Type filters */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tipo
                </label>
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((type) => (
                    <TypeFilterButton
                      key={type}
                      type={type}
                      isSelected={types.includes(type)}
                      onClick={() => toggleType(type)}
                    />
                  ))}
                </div>
              </div>

              {/* Active filters summary */}
              {hasActiveFilters && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {activeFiltersCount} filtro{activeFiltersCount !== 1 ? "s" : ""} ativo
                      {activeFiltersCount !== 1 ? "s" : ""}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="text-xs h-8"
                    >
                      Limpar todos
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search indicator */}
      {debouncedSearch && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-lg text-sm"
        >
          <Search className="w-4 h-4" />
          <span>
            Buscando por: <strong>"{debouncedSearch}"</strong>
          </span>
          <button
            onClick={() => setSearch("")}
            className="ml-auto text-violet-500 hover:text-violet-700"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </div>
  );
}
