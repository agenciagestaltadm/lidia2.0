"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WipLimitIndicatorProps {
  current: number;
  limit: number | null;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
}

export function WipLimitIndicator({
  current,
  limit,
  showCount = true,
  size = "md",
}: WipLimitIndicatorProps) {
  if (!limit || limit <= 0) return null;

  const percentage = (current / limit) * 100;
  const isWarning = percentage >= 80 && percentage < 100;
  const isExceeded = percentage >= 100;
  const isNormal = percentage < 80;

  const sizeClasses = {
    sm: {
      container: "h-4 text-[10px]",
      icon: "w-3 h-3",
      badge: "px-1.5 py-0",
      bar: "h-1",
    },
    md: {
      container: "h-5 text-xs",
      icon: "w-4 h-4",
      badge: "px-2 py-0.5",
      bar: "h-1.5",
    },
    lg: {
      container: "h-6 text-sm",
      icon: "w-5 h-5",
      badge: "px-2.5 py-1",
      bar: "h-2",
    },
  };

  const classes = sizeClasses[size];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center gap-2 rounded-lg transition-colors duration-200",
        classes.container,
        isExceeded && "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
        isWarning && "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300",
        isNormal && "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
      )}
    >
      {/* Status Icon */}
      <motion.div
        animate={isExceeded ? { scale: [1, 1.2, 1] } : {}}
        transition={{ repeat: isExceeded ? Infinity : 0, duration: 1.5 }}
      >
        {isExceeded ? (
          <XCircle className={cn(classes.icon, "text-red-500")} />
        ) : isWarning ? (
          <AlertTriangle className={cn(classes.icon, "text-amber-500")} />
        ) : (
          <CheckCircle2 className={cn(classes.icon, "text-emerald-500")} />
        )}
      </motion.div>

      {/* Count */}
      {showCount && (
        <span className="font-medium tabular-nums">
          {current}
          <span className="text-gray-400 mx-0.5">/</span>
          {limit}
        </span>
      )}

      {/* Progress Bar */}
      <div className={cn("flex-1 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700", classes.bar)}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full transition-colors duration-300",
            isExceeded && "bg-red-500",
            isWarning && "bg-amber-500",
            isNormal && "bg-emerald-500"
          )}
        />
      </div>

      {/* Status Badge */}
      {isExceeded && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 rounded",
            classes.badge
          )}
        >
          Excedido
        </motion.span>
      )}
      {isWarning && !isExceeded && (
        <motion.span
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 rounded",
            classes.badge
          )}
        >
          Quase
        </motion.span>
      )}
    </motion.div>
  );
}

// Compact version for column headers
export function WipLimitBadge({
  current,
  limit,
}: {
  current: number;
  limit: number | null;
}) {
  if (!limit || limit <= 0) return null;

  const percentage = (current / limit) * 100;
  const isWarning = percentage >= 80 && percentage < 100;
  const isExceeded = percentage >= 100;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={cn(
        "flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
        isExceeded && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
        isWarning && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
        !isWarning && !isExceeded && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      )}
    >
      <span className="tabular-nums">{current}</span>
      <span className="text-gray-400">/</span>
      <span className="tabular-nums">{limit}</span>
      {isExceeded && (
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          ⚠️
        </motion.span>
      )}
    </motion.div>
  );
}

// Tooltip content for WIP limit explanation
export function WipLimitTooltip({
  current,
  limit,
  columnName,
}: {
  current: number;
  limit: number | null;
  columnName: string;
}) {
  if (!limit || limit <= 0) {
    return (
      <div className="text-sm">
        <p className="font-medium">{columnName}</p>
        <p className="text-gray-500">Sem limite WIP definido</p>
      </div>
    );
  }

  const percentage = (current / limit) * 100;
  const isExceeded = percentage >= 100;
  const remaining = limit - current;

  return (
    <div className="space-y-2 text-sm max-w-xs">
      <p className="font-medium">{columnName}</p>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Cards:</span>
          <span className="font-medium">{current} / {limit}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Ocupação:</span>
          <span className={cn(
            "font-medium",
            isExceeded ? "text-red-500" : percentage >= 80 ? "text-amber-500" : "text-emerald-500"
          )}>
            {percentage.toFixed(0)}%
          </span>
        </div>
        {remaining > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Disponível:</span>
            <span className="font-medium text-emerald-600">{remaining} vagas</span>
          </div>
        )}
        {remaining === 0 && (
          <p className="text-xs text-amber-600">Limite atingido</p>
        )}
        {remaining < 0 && (
          <p className="text-xs text-red-600 font-medium">⚠️ {Math.abs(remaining)} cards acima do limite</p>
        )}
      </div>
    </div>
  );
}
