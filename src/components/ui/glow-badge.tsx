"use client";

import { cn } from "@/lib/utils";

interface GlowBadgeProps {
  children: React.ReactNode;
  variant?: "green" | "emerald" | "default";
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
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      glow: "shadow-[0_0_10px_rgba(16,185,129,0.3)]",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      glow: "shadow-[0_0_10px_rgba(16,185,129,0.3)]",
    },
    default: {
      bg: "bg-white/5",
      border: "border-white/10",
      text: "text-slate-300",
      glow: "",
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
            variant === "green" && "bg-emerald-400",
            variant === "emerald" && "bg-emerald-400",
          )}
        />
      )}
      {children}
    </span>
  );
}
