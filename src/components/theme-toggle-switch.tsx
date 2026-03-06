"use client";

import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

interface ThemeToggleSwitchProps {
  className?: string;
}

export function ThemeToggleSwitch({ className }: ThemeToggleSwitchProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative flex items-center justify-between w-14 h-7 rounded-full p-1 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isDark 
          ? "bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 border border-emerald-500/30" 
          : "bg-gradient-to-r from-amber-100 to-amber-200 border border-amber-300/50",
        className
      )}
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {/* Sun Icon */}
      <motion.div
        className="absolute left-1.5 flex items-center justify-center"
        initial={false}
        animate={{
          scale: isDark ? 0 : 1,
          opacity: isDark ? 0 : 1,
          rotate: isDark ? -90 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <Sun className="w-3.5 h-3.5 text-amber-600" />
      </motion.div>

      {/* Moon Icon */}
      <motion.div
        className="absolute right-1.5 flex items-center justify-center"
        initial={false}
        animate={{
          scale: isDark ? 1 : 0,
          opacity: isDark ? 1 : 0,
          rotate: isDark ? 0 : 90,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <Moon className="w-3.5 h-3.5 text-emerald-300" />
      </motion.div>

      {/* Sliding Circle */}
      <motion.div
        className={cn(
          "absolute w-5 h-5 rounded-full shadow-md flex items-center justify-center",
          isDark
            ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
            : "bg-gradient-to-br from-amber-300 to-amber-500"
        )}
        initial={false}
        animate={{
          x: isDark ? 26 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      >
        {/* Inner glow effect */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full",
            isDark ? "bg-emerald-400/30" : "bg-amber-400/30"
          )}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Stars decoration for dark mode */}
      {isDark && (
        <>
          <motion.span
            className="absolute left-2.5 top-1 w-0.5 h-0.5 bg-emerald-300 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
          />
          <motion.span
            className="absolute left-4 bottom-1.5 w-0.5 h-0.5 bg-emerald-300 rounded-full"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
          <motion.span
            className="absolute left-1 bottom-1 w-0.5 h-0.5 bg-emerald-300 rounded-full"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }}
          />
        </>
      )}
    </button>
  );
}
