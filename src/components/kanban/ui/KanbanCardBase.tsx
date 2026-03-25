"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { animations, shadows, borders } from "@/styles/kanban-tokens";

interface KanbanCardBaseProps {
  children: React.ReactNode;
  isDragging?: boolean;
  isOverlay?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  "data-dragging"?: boolean;
}

export const KanbanCardBase = memo(function KanbanCardBase({
  children,
  isDragging = false,
  isOverlay = false,
  isCompleted = false,
  onClick,
  className,
  style,
  id,
  ...props
}: KanbanCardBaseProps) {
  return (
    <motion.div
      layout
      initial={animations.card.initial}
      animate={animations.card.animate}
      exit={animations.card.exit}
      transition={animations.card.transition}
      onClick={onClick}
      id={id}
      style={style}
      className={cn(
        // Base styles
        "relative bg-white dark:bg-slate-800",
        "rounded-lg p-3 cursor-pointer",
        "transition-all duration-200",
        
        // Borders
        borders.card,
        borders.cardHover,
        
        // Shadows
        shadows.card,
        
        // States
        isDragging && [
          "opacity-50",
          "rotate-2",
          "scale-105",
          "shadow-xl",
        ],
        
        isOverlay && [
          "shadow-2xl",
          "rotate-2",
          "scale-105",
          "cursor-grabbing",
          "z-50",
        ],
        
        isCompleted && [
          "opacity-60",
          "bg-slate-50 dark:bg-slate-800/50",
        ],
        
        // Hover effects (only when not dragging)
        !isDragging && !isOverlay && [
          "hover:scale-[1.02]",
          "hover:shadow-md",
        ],
        
        className
      )}
      {...props}
    >
      {children}
      
      {/* Drag indicator line */}
      {isDragging && (
        <div className="absolute inset-x-0 top-0 h-1 bg-emerald-500 rounded-t-lg" />
      )}
    </motion.div>
  );
});

// Skeleton component for loading state
export function KanbanCardSkeleton() {
  return (
    <div className={cn(
      "relative bg-white dark:bg-slate-800",
      "rounded-lg p-3",
      borders.card,
      "animate-pulse"
    )}>
      {/* Header with labels */}
      <div className="flex gap-1.5 mb-3">
        <div className="h-1.5 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-1.5 w-6 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      
      {/* Title */}
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3" />
      
      {/* Priority badge */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
      
      {/* Footer with icons and avatars */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
        <div className="flex gap-2">
          <div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800" />
          <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800" />
        </div>
      </div>
    </div>
  );
}

// Empty state component
export function KanbanCardEmpty({ onClick }: { onClick?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "relative",
        "rounded-lg p-6",
        "border-2 border-dashed border-slate-200 dark:border-slate-700",
        "text-center cursor-pointer",
        "hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50",
        "transition-colors duration-200"
      )}
      onClick={onClick}
    >
      <p className="text-sm text-slate-500 dark:text-slate-400">
        + Adicionar card
      </p>
    </motion.div>
  );
}

export default KanbanCardBase;
