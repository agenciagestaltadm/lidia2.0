"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { GlassCard } from "@/components/ui/glass-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCard,
  useComments,
  useChecklists,
  KanbanCard as KanbanCardType,
} from "@/hooks/use-kanban";
import {
  Calendar,
  CheckSquare,
  Clock,
  MessageSquare,
  Paperclip,
  Tag,
  User,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CardDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: KanbanCardType;
  boardId: string;
}

export function CardDetailModal({
  open,
  onOpenChange,
  card,
  boardId,
}: CardDetailModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [priority, setPriority] = useState(card.priority);
  const [dueDate, setDueDate] = useState(
    card.due_date ? format(new Date(card.due_date), "yyyy-MM-dd'T'HH:mm") : ""
  );

  const { updateCard } = useCard(card.id);
  const { comments, createComment } = useComments(card.id);
  const { checklists, createChecklist, createChecklistItem, toggleChecklistItem } =
    useChecklists(card.id);

  const [newComment, setNewComment] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState<Record<string, string>>({});

  const handleSave = async () => {
    await updateCard.mutateAsync({
      id: card.id,
      input: {
        title,
        description: description || undefined,
        priority,
        due_date: dueDate || null,
      },
    });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await createComment.mutateAsync({ content: newComment });
    setNewComment("");
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistTitle.trim()) return;

    await createChecklist.mutateAsync({ title: newChecklistTitle });
    setNewChecklistTitle("");
  };

  const handleAddChecklistItem = async (checklistId: string) => {
    const content = newChecklistItem[checklistId];
    if (!content?.trim()) return;

    await createChecklistItem.mutateAsync({ checklistId, content });
    setNewChecklistItem((prev) => ({ ...prev, [checklistId]: "" }));
  };

  const priorityOptions = [
    { value: "LOW", label: "Baixa" },
    { value: "MEDIUM", label: "Média" },
    { value: "HIGH", label: "Alta" },
    { value: "URGENT", label: "Urgente" },
  ];

  const labels = (card.labels?.map((cl) => (cl as unknown as { label: { id: string; name: string; color: string } }).label) || []) as { id: string; name: string; color: string }[];

  return (
    <Dialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title={card.title}
      maxWidth="xl"
    >
      <div className="mt-4">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details" className="gap-2">
              <Tag className="w-4 h-4" />
              <span className="hidden sm:inline">Detalhes</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Comentários</span>
            </TabsTrigger>
            <TabsTrigger value="checklist" className="gap-2">
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Checklist</span>
            </TabsTrigger>
            <TabsTrigger value="attachments" className="gap-2">
              <Paperclip className="w-4 h-4" />
              <span className="hidden sm:inline">Anexos</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Atividade</span>
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="card-title">Título</Label>
                <Input
                  id="card-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="card-description">Descrição</Label>
                <Textarea
                  id="card-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Prioridade"
                  value={priority}
                  onValueChange={(v) => setPriority(v as typeof priority)}
                  options={priorityOptions}
                />

                <div>
                  <Label htmlFor="due-date">Data de Vencimento</Label>
                  <Input
                    id="due-date"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Labels */}
              {labels.length > 0 && (
                <div>
                  <Label>Etiquetas</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {labels.map((label) => (
                      <span
                        key={label.id}
                        className="px-3 py-1 rounded-full text-sm text-white"
                        style={{ backgroundColor: label.color }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={updateCard.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {updateCard.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-4 mt-4">
            <form onSubmit={handleAddComment} className="space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicione um comentário..."
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!newComment.trim() || createComment.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {createComment.isPending ? "Enviando..." : "Comentar"}
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {comments.map((comment) => (
                <GlassCard key={comment.id} className="p-3" hover={false}>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-medium">
                      {comment.user?.full_name?.charAt(0).toUpperCase() ||
                        comment.user?.email?.charAt(0).toUpperCase() ||
                        "U"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {comment.user?.full_name || comment.user?.email}
                        </span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(comment.created_at), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              ))}

              {comments.length === 0 && (
                <p className="text-center text-slate-500 py-4">
                  Nenhum comentário ainda. Seja o primeiro a comentar!
                </p>
              )}
            </div>
          </TabsContent>

          {/* Checklist Tab */}
          <TabsContent value="checklist" className="space-y-4 mt-4">
            <form onSubmit={handleAddChecklist} className="flex gap-2">
              <Input
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                placeholder="Nome do novo checklist..."
              />
              <Button
                type="submit"
                disabled={!newChecklistTitle.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Adicionar
              </Button>
            </form>

            <div className="space-y-4">
              {checklists.map((checklist) => {
                const items = checklist.items || [];
                const completedCount = items.filter((i) => i.is_completed).length;
                const progress = items.length
                  ? Math.round((completedCount / items.length) * 100)
                  : 0;

                return (
                  <GlassCard key={checklist.id} className="p-4" hover={false}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{checklist.title}</h4>
                      <span className="text-sm text-slate-500">
                        {completedCount}/{items.length}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-4">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={item.is_completed}
                            onChange={() =>
                              toggleChecklistItem.mutate({
                                id: item.id,
                                isCompleted: !item.is_completed,
                              })
                            }
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span
                            className={cn(
                              "text-sm",
                              item.is_completed &&
                                "line-through text-slate-500"
                            )}
                          >
                            {item.content}
                          </span>
                        </div>
                      ))}

                      {/* Add item input */}
                      <div className="flex gap-2 mt-3">
                        <Input
                          value={newChecklistItem[checklist.id] || ""}
                          onChange={(e) =>
                            setNewChecklistItem((prev) => ({
                              ...prev,
                              [checklist.id]: e.target.value,
                            }))
                          }
                          placeholder="Adicionar item..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddChecklistItem(checklist.id);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddChecklistItem(checklist.id)}
                          disabled={!newChecklistItem[checklist.id]?.trim()}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}

              {checklists.length === 0 && (
                <p className="text-center text-slate-500 py-4">
                  Nenhum checklist ainda. Crie um novo!
                </p>
              )}
            </div>
          </TabsContent>

          {/* Attachments Tab */}
          <TabsContent value="attachments" className="mt-4">
            <div className="text-center py-8 text-slate-500">
              <Paperclip className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Funcionalidade de anexos em desenvolvimento</p>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-4">
            <div className="text-center py-8 text-slate-500">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Histórico de atividades em desenvolvimento</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Dialog>
  );
}
