"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  title?: string;
  description?: string;
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full mx-4",
};

export function Dialog({
  isOpen,
  onClose,
  children,
  className,
  maxWidth = "lg",
  showCloseButton = true,
  closeOnOverlayClick = true,
  title,
  description,
}: DialogProps) {
  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeOnOverlayClick ? onClose : undefined}
          />

          {/* Dialog Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative z-10 w-full",
              maxWidthClasses[maxWidth],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl",
                "border backdrop-blur-xl",
                "max-h-[90vh] flex flex-col",
                // Dark mode
                "dark:bg-slate-900/90 dark:border-white/10",
                // Light mode
                "bg-white/95 border-slate-200",
                "shadow-2xl"
              )}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between px-6 py-4 border-b dark:border-white/10 border-slate-200">
                  <div className="flex-1">
                    {title && (
                      <h2 className="text-xl font-bold dark:text-white text-slate-900">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="text-sm dark:text-slate-400 text-slate-500 mt-1">
                        {description}
                      </p>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className={cn(
                        "p-2 rounded-lg transition-all duration-200",
                        "dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10",
                        "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                      )}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className={cn(!title && !showCloseButton && "pt-6")}>
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Dialog Footer Component
interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogFooter({ children, className }: DialogFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 px-6 py-4",
        "border-t dark:border-white/10 border-slate-200",
        "dark:bg-slate-900/50 bg-slate-50/50",
        className
      )}
    >
      {children}
    </div>
  );
}

// Dialog Content Component (for custom content without header)
interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogContent({ children, className }: DialogContentProps) {
  return (
    <div className={cn("px-6 py-4 overflow-y-auto", className)} style={{ maxHeight: "calc(90vh - 140px)" }}>
      {children}
    </div>
  );
}

export default Dialog;