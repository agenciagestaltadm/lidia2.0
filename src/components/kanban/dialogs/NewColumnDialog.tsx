"use client";

import { useState } from "react";
import { KanbanModal } from "@/components/kanban/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useColumns } from "@/hooks/use-kanban";
import { Palette, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
}

export function NewColumnDialog({ open, onOpenChange, boardId }: NewColumnDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const { createColumn } = useColumns(boardId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createColumn.mutateAsync({
      board_id: boardId,
      name: name.trim(),
      color,
    });

    setName("");
    setColor("#6366f1");
    onOpenChange(false);
  };

  const colors = [
    "#6366f1", // Indigo
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#f43f5e", // Rose
    "#ef4444", // Red
    "#f97316", // Orange
    "#eab308", // Yellow
    "#22c55e", // Green
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
    "#6b7280", // Gray
  ];

  return (
    <KanbanModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <LayoutGrid className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span>Nova Coluna</span>
        </div>
      }
      description="Crie uma nova coluna para organizar seus cards."
      maxWidth="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || createColumn.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {createColumn.isPending ? "Criando..." : "Criar Coluna"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Nome da Coluna
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Em Andamento"
            autoFocus
            className="mt-1"
          />
        </div>

        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Palette className="w-4 h-4 text-slate-500" />
            Cor da Coluna
          </Label>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "w-8 h-8 rounded-full transition-all duration-200",
                  "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2",
                  color === c
                    ? "ring-2 ring-offset-2 ring-emerald-500 scale-110 shadow-md"
                    : "hover:shadow-sm"
                )}
                style={{ backgroundColor: c }}
                aria-label={`Selecionar cor ${c}`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500">
            A cor ajuda a identificar visualmente a coluna no board
          </p>
        </div>
      </form>
    </KanbanModal>
  );
}
