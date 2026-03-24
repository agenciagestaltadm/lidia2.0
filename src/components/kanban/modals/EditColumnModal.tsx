"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KanbanColumn, useColumns } from "@/hooks/use-kanban";
import { X, Palette, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EditColumnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: KanbanColumn | null;
  boardId: string;
}

const PRESET_COLORS = [
  { name: "Cinza", value: "#94a3b8" },
  { name: "Vermelho", value: "#ef4444" },
  { name: "Laranja", value: "#f97316" },
  { name: "Âmbar", value: "#f59e0b" },
  { name: "Verde", value: "#22c55e" },
  { name: "Esmeralda", value: "#10b981" },
  { name: "Ciano", value: "#06b6d4" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Índigo", value: "#6366f1" },
  { name: "Violeta", value: "#8b5cf6" },
  { name: "Roxo", value: "#a855f7" },
  { name: "Rosa", value: "#ec4899" },
];

export function EditColumnModal({
  open,
  onOpenChange,
  column,
  boardId,
}: EditColumnModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [wipLimit, setWipLimit] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { updateColumn, deleteColumn } = useColumns(boardId);

  useEffect(() => {
    if (column) {
      setName(column.name);
      setColor(column.color || "");
      setWipLimit(column.wip_limit?.toString() || "");
    }
  }, [column]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!column) return;

    if (!name.trim()) {
      toast.error("O nome da coluna é obrigatório");
      return;
    }

    try {
      await updateColumn.mutateAsync({
        id: column.id,
        input: {
          name: name.trim(),
          color: color || undefined,
          wip_limit: wipLimit ? parseInt(wipLimit) : undefined,
        },
      });
      toast.success("Coluna atualizada com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar coluna:", error);
      toast.error("Erro ao atualizar coluna");
    }
  };

  const handleDelete = async () => {
    if (!column) return;

    try {
      await deleteColumn.mutateAsync(column.id);
      toast.success("Coluna excluída com sucesso!");
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao excluir coluna:", error);
      toast.error("Erro ao excluir coluna");
    }
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
            <div className="pointer-events-auto w-full max-w-md">
              <GlassCard className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                      Editar Coluna
                    </h2>
                    <p className="text-sm text-slate-500">
                      {column?.name}
                    </p>
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

                {!showDeleteConfirm ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Nome */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da Coluna</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Em Andamento"
                      />
                    </div>

                    {/* Cor */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Cor (opcional)
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => setColor(preset.value)}
                            className={cn(
                              "w-8 h-8 rounded-full transition-all duration-200",
                              "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
                              color === preset.value
                                ? "ring-2 ring-offset-2 ring-slate-400 scale-110"
                                : ""
                            )}
                            style={{ backgroundColor: preset.value }}
                            title={preset.name}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => setColor("")}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600",
                            "flex items-center justify-center text-slate-400",
                            "hover:border-slate-400 transition-all duration-200",
                            color === "" ? "ring-2 ring-slate-400" : ""
                          )}
                          title="Sem cor"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* WIP Limit */}
                    <div className="space-y-2">
                      <Label htmlFor="wipLimit">
                        Limite WIP (Work In Progress)
                      </Label>
                      <Input
                        id="wipLimit"
                        type="number"
                        min="0"
                        value={wipLimit}
                        onChange={(e) => setWipLimit(e.target.value)}
                        placeholder="Ex: 5 (deixe vazio para sem limite)"
                      />
                      <p className="text-xs text-slate-500">
                        Define o número máximo de cards permitidos nesta coluna
                      </p>
                    </div>

                    {/* Preview */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-500 mb-2">Preview:</p>
                      <div className="flex items-center gap-2">
                        {color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        )}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {name || "Nome da Coluna"}
                        </span>
                        {wipLimit && (
                          <span className="text-xs bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                            WIP: 0/{wipLimit}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                      <div className="flex-1" />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateColumn.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {updateColumn.isPending ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                        Confirmar Exclusão
                      </h3>
                      <p className="text-sm text-red-600 dark:text-red-300">
                        Tem certeza que deseja excluir a coluna "{column?.name}"?
                        Todos os cards desta coluna serão excluídos permanentemente.
                        Esta ação não pode ser desfeita.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleteColumn.isPending}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        {deleteColumn.isPending ? "Excluindo..." : "Confirmar Exclusão"}
                      </Button>
                    </div>
                  </div>
                )}
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
