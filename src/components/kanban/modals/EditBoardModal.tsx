"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Settings } from "lucide-react";
import { KanbanBoard, useBoard } from "@/hooks/use-kanban";
import { toast } from "sonner";

interface EditBoardModalProps {
  board: KanbanBoard | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditBoardModal({ board, isOpen, onClose }: EditBoardModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const { updateBoard } = useBoard(board?.id || null);

  useEffect(() => {
    if (board) {
      setName(board.name);
      setDescription(board.description || "");
      setIsPublic(board.is_public || false);
    }
  }, [board]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!board || !name.trim()) return;

    try {
      await updateBoard.mutateAsync({
        id: board.id,
        input: {
          name: name.trim(),
          description: description || undefined,
          is_public: isPublic,
        },
      });
      toast.success("Quadro atualizado com sucesso!");
      onClose();
    } catch (error) {
      toast.error("Erro ao atualizar quadro");
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md mx-4"
          >
            <GlassCard className="p-6" hover={false}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Editar Quadro
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="boardName">Nome do Quadro *</Label>
                  <Input
                    id="boardName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Pipeline de Vendas"
                    className="mt-1"
                    autoFocus
                  />
                </div>

                <div>
                  <Label htmlFor="boardDescription">Descrição</Label>
                  <Input
                    id="boardDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição opcional"
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <Label htmlFor="isPublic" className="mb-0">
                    Quadro público (visível para todos na empresa)
                  </Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onClose}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={!name.trim() || updateBoard.isPending}
                  >
                    {updateBoard.isPending ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Use createPortal to render modal outside of parent container
  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return null;
}
