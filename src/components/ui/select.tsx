"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Selecione...",
  disabled = false,
  className,
  label,
  error,
  fullWidth = true,
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={cn(fullWidth && "w-full", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Trigger */}
        <motion.button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            "relative flex items-center justify-between w-full",
            "px-4 py-3 rounded-lg",
            "border transition-all duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
            "text-left",
            // Default state
            "dark:bg-white/[0.03] dark:border-white/[0.08] dark:text-white",
            "bg-slate-50 border-slate-200 text-slate-900",
            // Hover state
            !disabled && [
              "dark:hover:border-emerald-500/30",
              "hover:border-emerald-500/30",
            ],
            // Open state
            isOpen && [
              "dark:border-emerald-500/50 border-emerald-500/50",
              "dark:shadow-[0_0_20px_rgba(16,185,129,0.1)]",
              "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
            ],
            // Disabled state
            disabled && "opacity-50 cursor-not-allowed",
            // Error state
            error && [
              "dark:border-red-500/50 border-red-500/50",
              "dark:shadow-[0_0_10px_rgba(239,68,68,0.1)]",
              "shadow-[0_0_10px_rgba(239,68,68,0.15)]",
            ]
          )}
          whileTap={!disabled ? { scale: 0.995 } : undefined}
        >
          <span
            className={cn(
              "truncate",
              !selectedOption && "dark:text-slate-500 text-slate-400"
            )}
          >
            {selectedOption?.label || placeholder}
          </span>

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 dark:text-slate-400 text-slate-500 flex-shrink-0 ml-2" />
          </motion.div>
        </motion.button>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "absolute z-[100] w-full mt-2",
                "rounded-lg border overflow-hidden",
                "shadow-xl",
                "dark:bg-slate-900 dark:border-white/10",
                "bg-white border-slate-200"
              )}
              style={{ maxHeight: "300px", overflowY: "auto" }}
            >
              <div className="py-1">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5",
                      "text-left text-sm transition-colors duration-150",
                      "focus:outline-none",
                      option.disabled
                        ? "opacity-50 cursor-not-allowed"
                        : [
                            "cursor-pointer",
                            value === option.value
                              ? "dark:bg-emerald-500/10 bg-emerald-50 dark:text-emerald-400 text-emerald-700"
                              : "dark:text-slate-300 text-slate-700 dark:hover:bg-white/5 hover:bg-slate-50",
                          ]
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {value === option.value && (
                      <Check className="w-4 h-4 dark:text-emerald-400 text-emerald-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}

                {options.length === 0 && (
                  <div className="px-4 py-3 text-sm dark:text-slate-500 text-slate-400 text-center">
                    Nenhuma opção disponível
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-1.5 text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

export default Select;