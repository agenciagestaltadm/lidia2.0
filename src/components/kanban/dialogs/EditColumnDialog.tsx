"use client";

import { useState, useEffect } from "react";
import { KanbanModal } from "../ui/KanbanModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useColumns, KanbanColumn } from "@/hooks/use-kanban";
import { Edit3, Trash2, LayoutGrid, AlertTriangle, Loader2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditColumnDialogProps {
  column: KanbanColumn | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditColumnDialog({ column, open, onOpenChange }: EditColumnDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [wipLimit, setWipLimit] = useState<number | null>(null);
  const [isDoneColumn, setIsDoneColumn] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { updateColumn, deleteColumn } = useColumns(column?.board_id || null);

  useEffect(() => {
    if (column) {
      setName(column.name);
      setColor(column.color || "#6366f1");
      setWipLimit(column.wip_limit);
      setIsDoneColumn(column.is_done_column);
    }
  }, [column]);

  const handleSave = async () => {
    if (!column || !name.trim()) return;

    await updateColumn.mutateAsync({
      id: column.id,
      input: {
        name: name.trim(),
        color,
        wip_limit: wipLimit ?? undefined,
        is_done_column: isDoneColumn,
      },
    });

    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!column) return;

    await deleteColumn.mutateAsync(column.id);
    onOpenChange(false);
  };

  const colors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#06b6d4", "#3b82f6", "#6b7280"
  ];

  if (!column) return null;

  return (
    <KanbanModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
            <Edit3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Editar Coluna</h2>
            <p className="text-sm text-gray-500">{column.name}</p>
          </div>
        </div>
      }
      maxWidth="md"
      footer={
        <div className="flex justify-between items-center w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!name.trim() || updateColumn.isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {updateColumn.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Coluna *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Em Progresso"
          />
        </div>

        {/* Color */}
        <div className="space-y-2">
          <Label>Cor</Label>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "w-8 h-8 rounded-lg transition-all",
                  color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* WIP Limit */}
        <div className="space-y-2">
          <Label htmlFor="wipLimit">Limite WIP (opcional)</Label>
          <Input
            id="wipLimit"
            type="number"
            min={1}
            max={100}
            value={wipLimit || ""}
            onChange={(e) => setWipLimit(e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Ex: 5"
          />
          <p className="text-xs text-gray-500">
            Número máximo de cards permitidos nesta coluna
          </p>
        </div>

        {/* Done Column */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base">Coluna de Conclusão</Label>
            <p className="text-xs text-gray-500">
              Cards nesta coluna são marcados como concluídos
            </p>
          </div>
          <Switch
            checked={isDoneColumn}
            onCheckedChange={setIsDoneColumn}
          />
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Tem certeza que deseja excluir esta coluna?
                </p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                  Todos os cards desta coluna também serão excluídos. Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteColumn.isPending}
                  >
                    {deleteColumn.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Sim, excluir
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </KanbanModal>
  );
}
