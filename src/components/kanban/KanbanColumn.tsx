"use client";

import { useMemo } from "react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GlassCard } from "@/components/ui/glass-card";
import { KanbanCard } from "./KanbanCard";
import { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from "@/hooks/use-kanban";
import { cn } from "@/lib/utils";
import { MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KanbanColumnProps {
  column: KanbanColumnType;
  onCardClick?: (card: KanbanCardType) => void;
  onAddCard?: () => void;
  isOverlay?: boolean;
}

export function KanbanColumn({
  column,
  onCardClick,
  onAddCard,
  isOverlay = false,
}: KanbanColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "column",
      column,
    },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cards = useMemo(() => column.cards || [], [column.cards]);

  const cardIds = useMemo(() => cards.map((c) => c.id), [cards]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-80 shrink-0 flex flex-col",
        isDragging && "opacity-50",
        isOverlay && "rotate-2 scale-105"
      )}
    >
      <GlassCard
        className="flex flex-col h-full max-h-full"
        hover={false}
      >
        {/* Header da Coluna */}
        <div
          className={cn(
            "flex items-center justify-between p-3 border-b",
            "border-slate-200/50 dark:border-slate-700/50",
            !isOverlay && "cursor-grab active:cursor-grabbing"
          )}
          {...attributes}
          {...listeners}
        >
          <div className="flex items-center gap-2">
            {column.color && (
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: column.color }}
              />
            )}
            <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
              {column.name}
            </h3>
            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {cards.length}
            </span>
            {column.wip_limit && (
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  cards.length > column.wip_limit
                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                )}
              >
                WIP: {cards.length}/{column.wip_limit}
              </span>
            )}
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>

        {/* Lista de Cards */}
        <ScrollArea className="flex-1 p-2">
          <SortableContext
            items={cardIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 min-h-[100px]">
              {cards.map((card) => (
                <KanbanCard
                  key={card.id}
                  card={card}
                  onClick={() => onCardClick?.(card)}
                />
              ))}
            </div>
          </SortableContext>
        </ScrollArea>

        {/* Footer - Botão Adicionar Card */}
        {!isOverlay && (
          <div className="p-2 border-t border-slate-200/50 dark:border-slate-700/50">
            <button
              onClick={onAddCard}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2",
                "text-sm text-slate-600 dark:text-slate-400",
                "hover:bg-slate-100 dark:hover:bg-slate-800",
                "rounded-lg transition-colors duration-200"
              )}
            >
              <Plus className="w-4 h-4" />
              Adicionar Card
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
