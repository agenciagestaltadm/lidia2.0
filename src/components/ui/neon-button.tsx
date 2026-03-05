"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface NeonButtonProps extends HTMLMotionProps<"button"> {
  variant?: "green" | "ghost";
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
    ghost: "bg-white/5 text-white hover:bg-white/10 border border-white/10",
  };

  const glowStyles = {
    green: "shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]",
    ghost: "hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]",
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
