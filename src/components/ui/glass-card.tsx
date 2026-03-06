"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { cardHover, cardTap } from "@/lib/animations";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "green" | "blue" | "purple" | "amber" | "red" | "none";
  onClick?: () => void;
}

export function GlassCard({ 
  children, 
  className, 
  hover = true, 
  glow = "none",
  onClick 
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "relative rounded-xl overflow-hidden",
        "backdrop-blur-xl",
        "border transition-all duration-300",
        // Dark mode styles
        "dark:bg-[#0a0a0a]/80 dark:border-emerald-500/10",
        "dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)]",
        // Light mode styles
        "bg-white/80 border-slate-200/50",
        "shadow-[0_4px_30px_rgba(0,0,0,0.08)]",
        // Glow effects - Dark mode
        glow === "green" && "dark:hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
        glow === "blue" && "dark:hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
        glow === "purple" && "dark:hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]",
        glow === "amber" && "dark:hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
        glow === "red" && "dark:hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]",
        // Glow effects - Light mode
        glow === "green" && "hover:shadow-[0_0_30px_rgba(16,185,129,0.25)] hover:border-emerald-500/30",
        glow === "blue" && "hover:shadow-[0_0_30px_rgba(59,130,246,0.25)] hover:border-blue-500/30",
        glow === "purple" && "hover:shadow-[0_0_30px_rgba(139,92,246,0.25)] hover:border-purple-500/30",
        glow === "amber" && "hover:shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:border-amber-500/30",
        glow === "red" && "hover:shadow-[0_0_30px_rgba(239,68,68,0.25)] hover:border-red-500/30",
        className
      )}
      initial="rest"
      whileHover={hover ? "hover" : undefined}
      whileTap={onClick ? cardTap : undefined}
      variants={hover ? cardHover : undefined}
      onClick={onClick}
    >
      {/* Gradient border effect - Dark mode */}
      <div className="absolute inset-0 rounded-xl pointer-events-none dark:block hidden">
        <div 
          className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.2))",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            padding: "1px",
          }}
        />
      </div>
      
      {/* Gradient border effect - Light mode */}
      <div className="absolute inset-0 rounded-xl pointer-events-none dark:hidden block">
        <div 
          className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.3))",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            padding: "1px",
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
