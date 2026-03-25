"use client";

import { useState, useEffect } from "react";
import { KanbanModal } from "../ui/KanbanModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useCard, KanbanCard, KanbanPriority, KanbanCardType } from "@/hooks/use-kanban";
import { colors } from "@/styles/kanban-tokens";
import { 
  FileText, 
  Calendar, 
  Flag, 
  Tag, 
  User, 
  Clock, 
  CheckCircle2,
  Loader2,
  Save,
  X,
  Edit3,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CardDetailDialogProps {
  card: KanbanCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (cardId: string) => void;
}

export function CardDetailDialog({ 
  card, 
  open, 
  onOpenChange,
  onDelete 
}: CardDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<KanbanPriority>("MEDIUM");
  const [cardType, setCardType] = useState<KanbanCardType>("TASK");
  const [dueDate, setDueDate] = useState("");

  const { updateCard, deleteCard } = useCard(card?.id || null);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || "");
      setPriority(card.priority);
      setCardType(card.card_type);
      setDueDate(card.due_date ? new Date(card.due_date).toISOString().slice(0, 16) : "");
    }
  }, [card]);

  const handleSave = async () => {
    if (!card || !title.trim()) return;

    await updateCard.mutateAsync({
      id: card.id,
      input: {
        title: title.trim(),
        description: description || undefined,
        priority,
        card_type: cardType,
        due_date: dueDate || null,
      },
    });

    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!card) return;
    
    if (confirm("Tem certeza que deseja excluir este card?")) {
      await deleteCard.mutateAsync(card.id);
      onDelete?.(card.id);
      onOpenChange(false);
    }
  };

  if (!card) return null;

  const priorityConfig = colors.priority[priority];
  const typeConfig = colors.cardType[cardType];

  return (
    <KanbanModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-xl"
            style={{ backgroundColor: `${typeConfig.color}20` }}
          >
            <FileText className="w-5 h-5" style={{ color: typeConfig.color }} />
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-8 font-semibold"
                autoFocus
              />
            ) : (
              <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {card.title}
              </h2>
            )}
          </div>
        </div>
      }
      maxWidth="2xl"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteCard.isPending}
                  className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {deleteCard.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Excluir
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
            )}
          </div>
          
          {isEditing && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!title.trim() || updateCard.isPending}
              className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600"
            >
              {updateCard.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Type and Priority */}
        <div className="flex flex-wrap gap-3">
          <Badge 
            variant="secondary" 
            className="gap-1.5 px-3 py-1"
            style={{ 
              backgroundColor: `${typeConfig.color}20`,
              color: typeConfig.color,
              borderColor: `${typeConfig.color}40`
            }}
          >
            <Tag className="w-3.5 h-3.5" />
            {typeConfig.label}
          </Badge>
          
          <Badge 
            variant="secondary" 
            className={`gap-1.5 px-3 py-1 ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}
          >
            <Flag className="w-3.5 h-3.5" />
            {priorityConfig.label}
          </Badge>

          {card.completed_at && (
            <Badge variant="secondary" className="gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Concluído
            </Badge>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            Descrição
          </Label>
          {isEditing ? (
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione uma descrição..."
              rows={4}
              className="resize-none"
            />
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {card.description ? (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {card.description}
                </p>
              ) : (
                <p className="text-gray-400 italic">Sem descrição</p>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          {/* Due Date */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              Data de Vencimento
            </Label>
            {isEditing ? (
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            ) : (
              <div className="flex items-center gap-2 text-sm">
                {card.due_date ? (
                  <>
                    <span className={new Date(card.due_date) < new Date() && !card.completed_at ? "text-red-600 font-medium" : ""}>
                      {format(new Date(card.due_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {new Date(card.due_date) < new Date() && !card.completed_at && (
                      <Badge variant="destructive" className="text-xs">Atrasado</Badge>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400 italic">Não definida</span>
                )}
              </div>
            )}
          </div>

          {/* Created At */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              Criado em
            </Label>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {format(new Date(card.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
          </div>
        </div>

        <Separator />

        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-500" />
              Etiquetas
            </Label>
            <div className="flex flex-wrap gap-2">
              {card.labels.map((label) => (
                <Badge 
                  key={label.id} 
                  variant="secondary"
                  style={{ 
                    backgroundColor: label.color,
                    color: "#fff"
                  }}
                >
                  {label.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Members */}
        {card.members && card.members.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              Membros ({card.members.length})
            </Label>
            <div className="flex flex-wrap gap-2">
              {card.members.map((member, index) => (
                <Avatar key={index} className="w-8 h-8">
                  <AvatarImage src={member.user?.avatar_url || undefined} />
                  <AvatarFallback>
                    {member.user?.full_name?.charAt(0) || member.user?.email?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        )}
      </div>
    </KanbanModal>
  );
}
