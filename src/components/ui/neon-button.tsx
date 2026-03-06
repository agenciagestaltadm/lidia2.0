"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface NeonButtonProps extends HTMLMotionProps<"button"> {
  variant?: "green" | "ghost" | "red" | "blue" | "purple";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export function NeonButton({
  className,
  variant = "green",
  size = "md",
  glow = true,
  loading = false,
  disabled,
  children,
  ...props
}: NeonButtonProps) {
  const baseStyles = "relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 rounded-lg overflow-hidden";
  
  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const variantStyles = {
    green: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white",
    ghost: "dark:bg-white/5 bg-slate-100 dark:text-white text-slate-700 hover:dark:bg-white/10 hover:bg-slate-200 border dark:border-white/10 border-slate-200",
    red: "bg-gradient-to-r from-red-500 to-red-600 text-white",
    blue: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
    purple: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
  };

  const glowStyles = {
    green: "dark:shadow-[0_0_20px_rgba(16,185,129,0.4)] shadow-[0_0_20px_rgba(16,185,129,0.3)] dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]",
    ghost: "dark:hover:shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    red: "dark:shadow-[0_0_20px_rgba(239,68,68,0.4)] shadow-[0_0_20px_rgba(239,68,68,0.3)] dark:hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]",
    blue: "dark:shadow-[0_0_20px_rgba(59,130,246,0.4)] shadow-[0_0_20px_rgba(59,130,246,0.3)] dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]",
    purple: "dark:shadow-[0_0_20px_rgba(139,92,246,0.4)] shadow-[0_0_20px_rgba(139,92,246,0.3)] dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]",
  };

  return (
    <motion.button
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        glow && glowStyles[variant],
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
        className
      )}
      whileTap={{ scale: 0.95 }}
      disabled={disabled || loading}
      {...props}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      {/* Loading spinner */}
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      
      {/* Button content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
