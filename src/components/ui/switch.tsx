"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
  description?: string;
}

const sizeClasses = {
  sm: {
    container: "w-9 h-5",
    thumb: "w-3.5 h-3.5",
    translate: "translate-x-4",
  },
  md: {
    container: "w-11 h-6",
    thumb: "w-5 h-5",
    translate: "translate-x-5",
  },
  lg: {
    container: "w-14 h-7",
    thumb: "w-6 h-6",
    translate: "translate-x-7",
  },
};

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  size = "md",
  className,
  label,
  description,
}: SwitchProps) {
  const sizeStyle = sizeClasses[size];

  return (
    <label
      className={cn(
        "flex items-center gap-3 cursor-pointer",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      {/* Switch Container */}
      <motion.button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={cn(
          "relative rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
          sizeStyle.container,
          checked
            ? "bg-emerald-500 dark:bg-emerald-500"
            : "bg-slate-300 dark:bg-slate-700"
        )}
        whileTap={!disabled ? { scale: 0.95 } : undefined}
      >
        {/* Thumb */}
        <motion.div
          className={cn(
            "absolute top-0.5 left-0.5 rounded-full bg-white shadow-md",
            sizeStyle.thumb
          )}
          initial={false}
          animate={{
            x: checked
              ? size === "sm"
                ? 16
                : size === "md"
                ? 20
                : 26
              : 0,
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </motion.button>

      {/* Label and Description */}
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span
              className={cn(
                "text-sm font-medium",
                disabled
                  ? "dark:text-slate-500 text-slate-400"
                  : "dark:text-slate-200 text-slate-700"
              )}
            >
              {label}
            </span>
          )}
          {description && (
            <span className="text-xs dark:text-slate-500 text-slate-400">
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
}

export default Switch;