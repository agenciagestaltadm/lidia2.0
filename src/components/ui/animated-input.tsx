"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ className, label, error, icon, iconRight, type = "text", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <motion.label
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            {label}
          </motion.label>
        )}
        
        <motion.div
          className={cn(
            "relative flex items-center",
            "bg-white/[0.03] backdrop-blur-sm",
            "border border-white/[0.08] rounded-lg",
            "transition-all duration-300",
            "focus-within:border-emerald-500/50 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.1)]",
            error && "border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
            className
          )}
          whileTap={{ scale: 0.995 }}
        >
          {icon && (
            <div className="absolute left-3 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            type={type}
            className={cn(
              "w-full bg-transparent text-white placeholder:text-slate-500",
              "outline-none",
              icon ? "pl-10" : "pl-4",
              iconRight ? "pr-10" : "pr-4",
              "py-3",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
            {...props}
          />
          
          {iconRight && (
            <div className="absolute right-3">
              {iconRight}
            </div>
          )}
          
          {/* Animated border gradient on focus */}
          <div 
            className="absolute inset-0 rounded-lg pointer-events-none opacity-0 focus-within:opacity-100 transition-opacity duration-300"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))",
              mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              maskComposite: "exclude",
              padding: "1px",
            }}
          />
        </motion.div>
        
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}
      </div>
    );
  }
);

AnimatedInput.displayName = "AnimatedInput";
