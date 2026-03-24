"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useColumns } from "@/hooks/use-kanban";

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
    <Dialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Nova Coluna"
      description="Crie uma nova coluna para organizar seus cards."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Coluna</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Em Andamento"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label>Cor</Label>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${
                  color === c ? "ring-2 ring-offset-2 ring-emerald-500 scale-110" : ""
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!name.trim() || createColumn.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {createColumn.isPending ? "Criando..." : "Criar Coluna"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
