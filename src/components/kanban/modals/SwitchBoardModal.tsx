"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBoards, KanbanBoard } from "@/hooks/use-kanban";
import { X, LayoutGrid, Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SwitchBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBoardId: string;
  companyId: string;
}

export function SwitchBoardModal({
  open,
  onOpenChange,
  currentBoardId,
  companyId,
}: SwitchBoardModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { boards, isLoading } = useBoards(companyId);
  const router = useRouter();

  const filteredBoards = boards.filter((board) =>
    board.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectBoard = (boardId: string) => {
    if (boardId !== currentBoardId) {
      router.push(`/app/kanban?board=${boardId}`);
    }
    onOpenChange(false);
  };

  const modalContent = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-lg">
              <GlassCard className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                      <LayoutGrid className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                        Trocar Quadro
                      </h2>
                      <p className="text-sm text-slate-500">
                        Selecione outro quadro para visualizar
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenChange(false)}
                    className="rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Buscar quadros..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>

                {/* Boards List */}
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500" />
                    </div>
                  ) : filteredBoards.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      {searchQuery
                        ? "Nenhum quadro encontrado"
                        : "Nenhum quadro disponível"}
                    </div>
                  ) : (
                    filteredBoards.map((board) => (
                      <button
                        key={board.id}
                        onClick={() => handleSelectBoard(board.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left",
                          board.id === currentBoardId
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                            : "border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-slate-900 dark:text-slate-200 truncate">
                            {board.name}
                          </h3>
                          {board.description && (
                            <p className="text-sm text-slate-500 truncate mt-0.5">
                              {board.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                            <span>
                              {board.is_public ? "Público" : "Privado"}
                            </span>
                            {board.id === currentBoardId && (
                              <span className="text-emerald-600 font-medium">
                                Quadro Atual
                              </span>
                            )}
                          </div>
                        </div>
                        {board.id !== currentBoardId && (
                          <ArrowRight className="w-5 h-5 text-slate-400 ml-3" />
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use createPortal to render modal outside of parent container
  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return null;
}
