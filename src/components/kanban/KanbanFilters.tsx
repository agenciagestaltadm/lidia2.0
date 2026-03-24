"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type PriorityFilter = "LOW" | "MEDIUM" | "HIGH" | "URGENT" | null;
type DateFilter = "today" | "week" | "overdue" | null;

export interface FilterState {
  priority: PriorityFilter;
  dateFilter: DateFilter;
  members: string[];
  labels: string[];
}

interface KanbanFiltersProps {
  onClose: () => void;
  boardId: string;
  onFilterChange?: (filters: FilterState) => void;
}

export function KanbanFilters({ onClose, boardId, onFilterChange }: KanbanFiltersProps) {
  const [selectedPriority, setSelectedPriority] = useState<PriorityFilter>(null);
  const [selectedDate, setSelectedDate] = useState<DateFilter>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  // Notify parent when filters change
  useEffect(() => {
    onFilterChange?.({
      priority: selectedPriority,
      dateFilter: selectedDate,
      members: selectedMembers,
      labels: selectedLabels,
    });
  }, [selectedPriority, selectedDate, selectedMembers, selectedLabels, onFilterChange]);

  const priorities = [
    { value: "LOW" as const, label: "Baixa", color: "bg-slate-500" },
    { value: "MEDIUM" as const, label: "Média", color: "bg-amber-500" },
    { value: "HIGH" as const, label: "Alta", color: "bg-orange-500" },
    { value: "URGENT" as const, label: "Urgente", color: "bg-red-500" },
  ];

  const dateFilters = [
    { value: "today" as const, label: "Vence Hoje" },
    { value: "week" as const, label: "Esta Semana" },
    { value: "overdue" as const, label: "Atrasados" },
  ];

  const hasActiveFilters =
    selectedPriority || selectedDate || selectedMembers.length > 0 || selectedLabels.length > 0;

  const clearFilters = () => {
    setSelectedPriority(null);
    setSelectedDate(null);
    setSelectedMembers([]);
    setSelectedLabels([]);
  };

  return (
    <GlassCard className="p-4" hover={false}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">
          Filtros
        </h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpar
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Priority Filter */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Prioridade</Label>
          <div className="flex flex-wrap gap-2">
            {priorities.map((priority) => (
              <button
                key={priority.value}
                onClick={() =>
                  setSelectedPriority(
                    selectedPriority === priority.value ? null : priority.value
                  )
                }
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  selectedPriority === priority.value
                    ? "ring-2 ring-offset-1 ring-emerald-500"
                    : "",
                  priority.color,
                  "text-white"
                )}
              >
                {priority.label}
              </button>
            ))}
          </div>
        </div>

        {/* Due Date Filter */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Data de Vencimento</Label>
          <div className="flex flex-wrap gap-2">
            {dateFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() =>
                  setSelectedDate(
                    selectedDate === filter.value ? null : filter.value
                  )
                }
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  "border border-slate-200 dark:border-slate-700",
                  selectedDate === filter.value
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-300"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Members Filter */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Membros</Label>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Selecione membros para filtrar...
          </div>
        </div>

        {/* Labels Filter */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Etiquetas</Label>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Selecione etiquetas para filtrar...
          </div>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-end">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            Aplicar Filtros
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
