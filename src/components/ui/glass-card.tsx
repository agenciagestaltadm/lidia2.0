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
        "bg-[#0a0a0a]/80 backdrop-blur-xl",
        "border border-[#10b981]/10",
        "shadow-[0_4px_30px_rgba(0,0,0,0.5)]",
        "transition-all duration-300",
        glow === "green" && "hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
        glow === "blue" && "hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]",
        glow === "purple" && "hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]",
        glow === "amber" && "hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
        glow === "red" && "hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]",
        className
      )}
      initial="rest"
      whileHover={hover ? "hover" : undefined}
      whileTap={onClick ? cardTap : undefined}
      variants={hover ? cardHover : undefined}
      onClick={onClick}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-xl pointer-events-none">
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
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
