"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useCard, KanbanPriority, KanbanCardType } from "@/hooks/use-kanban";

interface NewCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
  boardId: string;
  companyId: string;
}

export function NewCardDialog({
  open,
  onOpenChange,
  columnId,
  boardId,
  companyId,
}: NewCardDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<KanbanPriority>("MEDIUM");
  const [cardType, setCardType] = useState<KanbanCardType>("TASK");
  const [dueDate, setDueDate] = useState("");

  const { createCard } = useCard(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createCard.mutateAsync({
      column_id: columnId,
      board_id: boardId,
      company_id: companyId,
      title: title.trim(),
      description: description || undefined,
      priority,
      card_type: cardType,
      due_date: dueDate || undefined,
    });

    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setCardType("TASK");
    setDueDate("");
    onOpenChange(false);
  };

  const priorityOptions = [
    { value: "LOW", label: "Baixa" },
    { value: "MEDIUM", label: "Média" },
    { value: "HIGH", label: "Alta" },
    { value: "URGENT", label: "Urgente" },
  ];

  const typeOptions = [
    { value: "TASK", label: "Tarefa" },
    { value: "BUG", label: "Bug" },
    { value: "FEATURE", label: "Funcionalidade" },
    { value: "EPIC", label: "Épico" },
    { value: "STORY", label: "História" },
  ];

  return (
    <Dialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Novo Card"
      description="Crie um novo card para organizar suas tarefas."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite o título do card"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva os detalhes do card..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Prioridade"
            value={priority}
            onValueChange={(v) => setPriority(v as KanbanPriority)}
            options={priorityOptions}
          />

          <Select
            label="Tipo"
            value={cardType}
            onValueChange={(v) => setCardType(v as KanbanCardType)}
            options={typeOptions}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Data de Vencimento</Label>
          <Input
            id="dueDate"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
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
            disabled={!title.trim() || createCard.isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {createCard.isPending ? "Criando..." : "Criar Card"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
