"use client";

import { cn } from "@/lib/utils";
import { spacing, borders } from "@/styles/kanban-tokens";

// Skeleton for a single column
export function KanbanColumnSkeleton() {
  return (
    <div className={cn(
      spacing.column.width,
      "shrink-0 flex flex-col",
      "bg-slate-100/50 dark:bg-slate-800/30",
      spacing.column.borderRadius,
      borders.column,
      "animate-pulse"
    )}>
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600" />
            <div className="h-4 w-24 bg-slate-300 dark:bg-slate-600 rounded" />
            <div className="h-5 w-8 bg-slate-300 dark:bg-slate-600 rounded-full" />
          </div>
          <div className="h-8 w-8 bg-slate-300 dark:bg-slate-600 rounded" />
        </div>
      </div>
      
      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "bg-white dark:bg-slate-800",
              "rounded-lg p-3",
              borders.card
            )}
          >
            <div className="flex gap-1.5 mb-3">
              <div className="h-1.5 w-8 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3" />
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-700/50">
        <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-lg w-full" />
      </div>
    </div>
  );
}

// Skeleton for the entire board
export function KanbanBoardSkeleton() {
  return (
    <div className="h-full flex gap-4 p-4 overflow-x-auto">
      {[1, 2, 3, 4].map((i) => (
        <KanbanColumnSkeleton key={i} />
      ))}
    </div>
  );
}

// Empty state for column
export function KanbanColumnEmpty({ onAddCard }: { onAddCard?: () => void }) {
  return (
    <div
      onClick={onAddCard}
      className={cn(
        "flex flex-col items-center justify-center",
        "p-8 rounded-lg",
        "border-2 border-dashed border-slate-200 dark:border-slate-700",
        "text-center cursor-pointer",
        "hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50",
        "transition-colors duration-200"
      )}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <svg
          className="w-6 h-6 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Nenhum card nesta coluna
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
        Clique para adicionar
      </p>
    </div>
  );
}
