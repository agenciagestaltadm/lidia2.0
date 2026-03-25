"use client";

import { useState, useCallback } from "react";
import { KanbanModal } from "../ui/KanbanModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useCard, KanbanPriority, KanbanCardType } from "@/hooks/use-kanban";
import { Plus, Calendar, Flag, Tag, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { colors } from "@/styles/kanban-tokens";

interface NewCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: string;
  boardId: string;
  companyId: string;
}

// Priority badge component
interface PriorityBadgeProps {
  priority: KanbanPriority;
  isSelected: boolean;
  onClick: () => void;
}

function PriorityBadge({ priority, isSelected, onClick }: PriorityBadgeProps) {
  const priorityColors = colors.priority[priority];
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer
        transition-all duration-200
        ${isSelected 
          ? `border-transparent shadow-sm ${priorityColors.bg}` 
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
        }
      `}
    >
      <Flag className={`w-4 h-4 ${priorityColors.text}`} />
      <span className={`text-sm font-medium ${priorityColors.text}`}>
        {priorityColors.label}
      </span>
    </motion.div>
  );
}

// Card type badge component
interface CardTypeBadgeProps {
  type: KanbanCardType;
  isSelected: boolean;
  onClick: () => void;
}

function CardTypeBadge({ type, isSelected, onClick }: CardTypeBadgeProps) {
  const typeColors = colors.cardType[type];
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer
        transition-all duration-200
        ${isSelected 
          ? `border-transparent shadow-sm ${typeColors.bg}` 
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
        }
      `}
    >
      <Tag className={`w-4 h-4 ${typeColors.text}`} />
      <span className={`text-sm font-medium ${typeColors.text}`}>
        {typeColors.label}
      </span>
    </motion.div>
  );
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

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setCardType("TASK");
    setDueDate("");
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onOpenChange(false);
  }, [resetForm, onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
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

      handleClose();
    } catch (error) {
      // Error is already handled by the mutation
      console.error("Failed to create card:", error);
    }
  };

  const priorities: KanbanPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];
  const cardTypes: KanbanCardType[] = ["TASK", "BUG", "FEATURE", "EPIC", "STORY"];

  return (
    <KanbanModal
      isOpen={open}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <Plus className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Novo Card
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Crie um novo card para organizar suas tarefas
            </p>
          </div>
        </div>
      }
      maxWidth="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={createCard.isPending}
            className="px-6"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="new-card-form"
            disabled={!title.trim() || createCard.isPending}
            className="px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
          >
            {createCard.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Criar Card
              </>
            )}
          </Button>
        </div>
      }
    >
      <form id="new-card-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Title Field */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Título <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite um título descritivo para o card"
            autoFocus
            className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          />
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Descrição
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Adicione uma descrição detalhada..."
            rows={4}
            className="resize-none border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          />
        </div>

        {/* Priority Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Flag className="w-4 h-4 text-gray-500" />
            Prioridade
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {priorities.map((p) => (
              <PriorityBadge
                key={p}
                priority={p}
                isSelected={priority === p}
                onClick={() => setPriority(p)}
              />
            ))}
          </div>
        </div>

        {/* Card Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-500" />
            Tipo
          </Label>
          <div className="grid grid-cols-3 gap-3">
            {cardTypes.map((t) => (
              <CardTypeBadge
                key={t}
                type={t}
                isSelected={cardType === t}
                onClick={() => setCardType(t)}
              />
            ))}
          </div>
        </div>

        {/* Due Date Field */}
        <div className="space-y-2">
          <Label htmlFor="dueDate" className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            Data de Vencimento
          </Label>
          <Input
            id="dueDate"
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-11 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          />
        </div>
      </form>
    </KanbanModal>
  );
}
