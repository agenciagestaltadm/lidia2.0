"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { KanbanCard as KanbanCardType } from "@/hooks/use-kanban";
import { cn } from "@/lib/utils";
import {
  Calendar,
  CheckSquare,
  Clock,
  Paperclip,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface KanbanCardProps {
  card: KanbanCardType;
  onClick?: () => void;
  isOverlay?: boolean;
}

const priorityColors = {
  LOW: "bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
  HIGH: "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30",
  URGENT: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
};

const priorityLabels = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export function KanbanCard({ card, onClick, isOverlay = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "card",
      card,
    },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const labels = (card.labels?.map((cl) => (cl as unknown as { label: { id: string; name: string; color: string } }).label) || []) as { id: string; name: string; color: string }[];
  const members = (card.members?.map((cm) => (cm as unknown as { user: { id: string; email: string; full_name: string | null; avatar_url: string | null } }).user) || []) as { id: string; email: string; full_name: string | null; avatar_url: string | null }[];
  const commentsCount = card.comments?.length || 0;
  const attachmentsCount = card.attachments?.length || 0;
  const checklists = card.checklists || [];

  // Calcular progresso dos checklists
  const checklistProgress = checklists.reduce(
    (acc, checklist) => {
      const items = checklist.items || [];
      acc.total += items.length;
      acc.completed += items.filter((i) => i.is_completed).length;
      return acc;
    },
    { total: 0, completed: 0 }
  );

  const hasChecklistItems = checklistProgress.total > 0;
  const checklistPercentage = hasChecklistItems
    ? Math.round((checklistProgress.completed / checklistProgress.total) * 100)
    : 0;

  // Formatar data de vencimento
  const getDueDateDisplay = () => {
    if (!card.due_date) return null;

    const date = new Date(card.due_date);
    const isOverdue = isPast(date) && !card.completed_at && !isToday(date);

    let displayText = "";
    if (isToday(date)) {
      displayText = "Hoje";
    } else if (isTomorrow(date)) {
      displayText = "Amanhã";
    } else {
      displayText = format(date, "dd MMM", { locale: ptBR });
    }

    return {
      text: displayText,
      isOverdue,
      isComplete: !!card.completed_at,
    };
  };

  const dueDate = getDueDateDisplay();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "group relative bg-white dark:bg-slate-800/50",
        "border border-slate-200 dark:border-slate-700/50",
        "rounded-lg p-3 cursor-pointer",
        "hover:shadow-md hover:border-emerald-500/30",
        "transition-all duration-200",
        isDragging && "opacity-50 rotate-2",
        isOverlay && "shadow-xl rotate-2 scale-105 cursor-grabbing",
        card.completed_at && "opacity-60"
      )}
    >
      {/* Cover Image */}
      {card.cover_image_url && (
        <div className="mb-3 -mx-3 -mt-3 rounded-t-lg overflow-hidden">
          <img
            src={card.cover_image_url}
            alt={card.title}
            className="w-full h-24 object-cover"
          />
        </div>
      )}

      {/* Labels */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {labels.slice(0, 4).map((label) => (
            <div
              key={label.id}
              className="h-1.5 w-8 rounded-full"
              style={{ backgroundColor: label.color }}
              title={label.name}
            />
          ))}
          {labels.length > 4 && (
            <span className="text-xs text-slate-500">+{labels.length - 4}</span>
          )}
        </div>
      )}

      {/* Title */}
      <h4
        className={cn(
          "font-medium text-sm text-slate-800 dark:text-slate-200 mb-2",
          card.completed_at && "line-through text-slate-500"
        )}
      >
        {card.title}
      </h4>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {/* Priority Badge */}
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full border",
            priorityColors[card.priority]
          )}
        >
          {priorityLabels[card.priority]}
        </span>

        {/* Due Date */}
        {dueDate && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
              dueDate.isComplete
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                : dueDate.isOverdue
                ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
            )}
          >
            <Clock className="w-3 h-3" />
            {dueDate.text}
          </span>
        )}
      </div>

      {/* Footer with icons and avatars */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          {/* Checklist */}
          {hasChecklistItems && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                checklistPercentage === 100
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400"
              )}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {checklistProgress.completed}/{checklistProgress.total}
            </span>
          )}

          {/* Comments */}
          {commentsCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <MessageSquare className="w-3.5 h-3.5" />
              {commentsCount}
            </span>
          )}

          {/* Attachments */}
          {attachmentsCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Paperclip className="w-3.5 h-3.5" />
              {attachmentsCount}
            </span>
          )}
        </div>

        {/* Members */}
        {members.length > 0 && (
          <div className="flex -space-x-2">
            {members.slice(0, 3).map((member, index) => (
              <Avatar
                key={member?.id || index}
                className="w-6 h-6 border-2 border-white dark:border-slate-800"
              >
                <AvatarImage src={member?.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                  {member?.full_name?.charAt(0).toUpperCase() ||
                    member?.email?.charAt(0).toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
            ))}
            {members.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs text-slate-600 dark:text-slate-400 border-2 border-white dark:border-slate-800">
                +{members.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
