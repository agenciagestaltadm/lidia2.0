"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  LayoutGrid,
  MoveRight,
  Check,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

interface KanbanIntegrationProps {
  contactId: string;
  currentColumn: string;
  isDarkMode: boolean;
  onMove?: (columnId: string, columnLabel: string) => Promise<void>;
}

const kanbanColumns = [
  { id: "new", label: "Novos", color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.2)" },
  { id: "in_progress", label: "Em Atendimento", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.2)" },
  { id: "post_sale", label: "Pós-Venda", color: "#8b5cf6", bgColor: "rgba(139, 92, 246, 0.2)" },
  { id: "resolved", label: "Resolvidos", color: "#10b981", bgColor: "rgba(16, 185, 129, 0.2)" },
];

export function KanbanIntegration({
  contactId,
  currentColumn,
  isDarkMode,
  onMove,
}: KanbanIntegrationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(currentColumn);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentColumnData = kanbanColumns.find((c) => c.id === currentColumn);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = async (columnId: string) => {
    if (columnId === selectedColumn) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const column = kanbanColumns.find((c) => c.id === columnId);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (onMove) {
        await onMove(columnId, column?.label || "");
      }

      setSelectedColumn(columnId);
      toast.success("Contato movido!", {
        description: `Movido para "${column?.label}"`,
      });
    } catch (err) {
      toast.error("Erro ao mover", {
        description: "Não foi possível mover o contato.",
      });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          "w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all",
          isDarkMode
            ? "bg-[#2a3942] border-[#374045] hover:border-[#4a545a]"
            : "bg-gray-50 border-gray-200 hover:border-gray-300",
          "disabled:opacity-70 disabled:cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: currentColumnData?.bgColor }}
          >
            <LayoutGrid
              className="w-5 h-5"
              style={{ color: currentColumnData?.color }}
            />
          </div>
          <div className="text-left">
            <p
              className={cn(
                "text-xs",
                isDarkMode ? "text-[#8696a0]" : "text-gray-500"
              )}
            >
              Coluna no Kanban
            </p>
            <p
              className={cn(
                "font-medium text-sm",
                isDarkMode ? "text-[#e9edef]" : "text-gray-900"
              )}
              style={{ color: currentColumnData?.color }}
            >
              {isLoading ? "Movendo..." : currentColumnData?.label}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown
            className={cn(
              "w-5 h-5",
              isDarkMode ? "text-[#8696a0]" : "text-gray-400"
            )}
          />
        </motion.div>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-xl overflow-hidden z-50",
                isDarkMode
                  ? "bg-[#2a3942] border-[#374045]"
                  : "bg-white border-gray-200"
              )}
            >
              <div className="p-2">
                <p
                  className={cn(
                    "px-3 py-2 text-xs font-medium",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                  )}
                >
                  Selecionar coluna
                </p>
                {kanbanColumns.map((column) => (
                  <motion.button
                    key={column.id}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(column.id)}
                    disabled={isLoading || column.id === selectedColumn}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      column.id === selectedColumn
                        ? isDarkMode
                          ? "bg-[#00a884]/20"
                          : "bg-green-50"
                        : isDarkMode
                        ? "hover:bg-[#374045]"
                        : "hover:bg-gray-100",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: column.bgColor }}
                    >
                      <LayoutGrid
                        className="w-4 h-4"
                        style={{ color: column.color }}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                        )}
                        style={{ color: column.id === selectedColumn ? column.color : undefined }}
                      >
                        {column.label}
                      </p>
                    </div>
                    {column.id === selectedColumn && (
                      <Check
                        className={cn(
                          "w-4 h-4",
                          isDarkMode ? "text-[#00a884]" : "text-green-600"
                        )}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
