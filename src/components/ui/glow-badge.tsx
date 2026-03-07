"use client";

import { cn } from "@/lib/utils";

interface GlowBadgeProps {
  children: React.ReactNode;
  variant?: "green" | "emerald" | "red" | "blue" | "amber" | "purple" | "default";
  size?: "sm" | "md";
  pulse?: boolean;
  className?: string;
}

export function GlowBadge({
  children,
  variant = "default",
  size = "md",
  pulse = false,
  className,
}: GlowBadgeProps) {
  const variantStyles = {
    green: {
      // Dark mode
      bg: "dark:bg-emerald-500/10 bg-emerald-500/15",
      border: "dark:border-emerald-500/30 border-emerald-500/40",
      text: "dark:text-emerald-400 text-emerald-600",
      glow: "dark:shadow-[0_0_10px_rgba(16,185,129,0.3)] shadow-[0_0_10px_rgba(16,185,129,0.25)]",
      dot: "dark:bg-emerald-400 bg-emerald-500",
    },
    emerald: {
      bg: "dark:bg-emerald-500/10 bg-emerald-500/15",
      border: "dark:border-emerald-500/30 border-emerald-500/40",
      text: "dark:text-emerald-400 text-emerald-600",
      glow: "dark:shadow-[0_0_10px_rgba(16,185,129,0.3)] shadow-[0_0_10px_rgba(16,185,129,0.25)]",
      dot: "dark:bg-emerald-400 bg-emerald-500",
    },
    red: {
      bg: "dark:bg-red-500/10 bg-red-500/15",
      border: "dark:border-red-500/30 border-red-500/40",
      text: "dark:text-red-400 text-red-600",
      glow: "dark:shadow-[0_0_10px_rgba(239,68,68,0.3)] shadow-[0_0_10px_rgba(239,68,68,0.25)]",
      dot: "dark:bg-red-400 bg-red-500",
    },
    blue: {
      bg: "dark:bg-blue-500/10 bg-blue-500/15",
      border: "dark:border-blue-500/30 border-blue-500/40",
      text: "dark:text-blue-400 text-blue-600",
      glow: "dark:shadow-[0_0_10px_rgba(59,130,246,0.3)] shadow-[0_0_10px_rgba(59,130,246,0.25)]",
      dot: "dark:bg-blue-400 bg-blue-500",
    },
    amber: {
      bg: "dark:bg-amber-500/10 bg-amber-500/15",
      border: "dark:border-amber-500/30 border-amber-500/40",
      text: "dark:text-amber-400 text-amber-600",
      glow: "dark:shadow-[0_0_10px_rgba(245,158,11,0.3)] shadow-[0_0_10px_rgba(245,158,11,0.25)]",
      dot: "dark:bg-amber-400 bg-amber-500",
    },
    purple: {
      bg: "dark:bg-purple-500/10 bg-purple-500/15",
      border: "dark:border-purple-500/30 border-purple-500/40",
      text: "dark:text-purple-400 text-purple-600",
      glow: "dark:shadow-[0_0_10px_rgba(168,85,247,0.3)] shadow-[0_0_10px_rgba(168,85,247,0.25)]",
      dot: "dark:bg-purple-400 bg-purple-500",
    },
    default: {
      bg: "dark:bg-white/5 bg-slate-100",
      border: "dark:border-white/10 border-slate-200",
      text: "dark:text-slate-300 text-slate-600",
      glow: "",
      dot: "",
    },
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  const styles = variantStyles[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium border",
        "backdrop-blur-sm",
        sizeStyles[size],
        styles.bg,
        styles.border,
        styles.text,
        styles.glow,
        pulse && "animate-pulse",
        className
      )}
    >
      {variant !== "default" && (
        <span 
          className={cn(
            "w-1.5 h-1.5 rounded-full mr-1.5",
            styles.dot,
          )}
        />
      )}
      {children}
    </span>
  );
}
