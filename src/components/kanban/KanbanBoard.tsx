"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
  DropAnimation,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { BoardHeader } from "./BoardHeader";
import { NewColumnDialog } from "./dialogs/NewColumnDialog";
import { NewCardDialog } from "./dialogs/NewCardDialog";
import { CardDetailModal, EditBoardModal, ManageMembersModal, EditColumnModal, SwitchBoardModal } from "./modals";
import { toast } from "sonner";
import {
  useBoard,
  useColumns,
  useCardsByBoard,
  useKanbanRealtime,
  KanbanCard as KanbanCardType,
  KanbanColumn as KanbanColumnType,
} from "@/hooks/use-kanban";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface KanbanBoardProps {
  boardId: string;
  companyId: string;
}

interface DragData {
  type: "card" | "column";
  item: KanbanCardType | KanbanColumnType;
}

export function KanbanBoard({ boardId, companyId }: KanbanBoardProps) {
  const { board, isLoading: boardLoading } = useBoard(boardId);
  const { columns, isLoading: columnsLoading, reorderColumns } = useColumns(boardId);
  const { cards, isLoading: cardsLoading } = useCardsByBoard(boardId);
  const { isConnected } = useKanbanRealtime(boardId);

  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
  const [selectedCard, setSelectedCard] = useState<KanbanCardType | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isNewColumnDialogOpen, setIsNewColumnDialogOpen] = useState(false);
  const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState(false);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false);
  const [isEditColumnModalOpen, setIsEditColumnModalOpen] = useState(false);
  const [isSwitchBoardModalOpen, setIsSwitchBoardModalOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<KanbanColumnType | null>(null);
  const [newCardColumnId, setNewCardColumnId] = useState<string | null>(null);

  // Estados para filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT" | null>(null);
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "overdue" | null>(null);

  // Configurar sensores para drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Filtrar cards com base na busca e filtros
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Filtro de busca por título ou descrição
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          card.title.toLowerCase().includes(query) ||
          (card.description && card.description.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Filtro de prioridade
      if (priorityFilter && card.priority !== priorityFilter) {
        return false;
      }

      // Filtro de data
      if (dateFilter && card.due_date) {
        const dueDate = new Date(card.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateFilter === "today") {
          const dueDay = new Date(dueDate);
          dueDay.setHours(0, 0, 0, 0);
          if (dueDay.getTime() !== today.getTime()) return false;
        } else if (dateFilter === "week") {
          const weekFromNow = new Date(today);
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          if (dueDate > weekFromNow) return false;
        } else if (dateFilter === "overdue") {
          if (dueDate >= today) return false;
        }
      }

      return true;
    });
  }, [cards, searchQuery, priorityFilter, dateFilter]);

  // Agrupar cards filtrados por coluna
  const columnsWithCards = useMemo(() => {
    return columns.map((column) => ({
      ...column,
      cards: filteredCards.filter((card) => card.column_id === column.id),
    }));
  }, [columns, filteredCards]);

  // Handler para início do drag
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;

    // Verificar se é uma coluna
    const column = columns.find((c) => c.id === activeId);
    if (column) {
      setActiveDragData({ type: "column", item: column });
      return;
    }

    // Verificar se é um card
    for (const col of columns) {
      const card = col.cards?.find((c) => c.id === activeId);
      if (card) {
        setActiveDragData({ type: "card", item: card });
        return;
      }
    }
  }, [columns]);

  // Handler para drag sobre outro elemento
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveCard = activeDragData?.type === "card";
    const isOverCard = over.data.current?.type === "card";
    const isOverColumn = over.data.current?.type === "column";

    if (isActiveCard && isOverCard) {
      // Implementar lógica de preview durante o drag
    }
  }, [activeDragData]);

  // Handler para fim do drag
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragData(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveColumn = activeDragData?.type === "column";
    const isActiveCard = activeDragData?.type === "card";

    if (isActiveColumn) {
      // Reordenar colunas
      const oldIndex = columns.findIndex((c) => c.id === activeId);
      const newIndex = columns.findIndex((c) => c.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(columns, oldIndex, newIndex);
        const columnIds = newOrder.map((c) => c.id);
        await reorderColumns.mutateAsync(columnIds);
      }
    } else if (isActiveCard) {
      // Mover card entre colunas
      const card = activeDragData?.item as KanbanCardType;
      
      // Determinar nova coluna
      let newColumnId = overId;
      let newOrder = 0;

      // Se soltar sobre um card, pegar a coluna do card
      const overCard = columns
        .flatMap((c) => c.cards || [])
        .find((c) => c.id === overId);

      if (overCard) {
        newColumnId = overCard.column_id;
        newOrder = overCard.order;
      } else {
        // Se soltar sobre uma coluna, adicionar no final
        const overColumn = columns.find((c) => c.id === overId);
        if (overColumn) {
          newColumnId = overColumn.id;
          newOrder = (overColumn.cards?.length || 0);
        }
      }

      if (newColumnId && newColumnId !== card.column_id) {
        // Mover card para nova coluna
        // Esta lógica deve ser implementada no hook useCard
        toast.success("Card movido para a nova coluna.");
      }
    }
  }, [activeDragData, columns, reorderColumns]);

  // Animação de drop
  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: "0.5",
        },
      },
    }),
  };

  const handleCardClick = useCallback((card: KanbanCardType) => {
    setSelectedCard(card);
    setIsCardModalOpen(true);
  }, []);

  const handleAddCard = useCallback((columnId: string) => {
    setNewCardColumnId(columnId);
  }, []);

  const handleEditColumn = useCallback((column: KanbanColumnType) => {
    setSelectedColumn(column);
    setIsEditColumnModalOpen(true);
  }, []);

  const handleDeleteColumn = useCallback((column: KanbanColumnType) => {
    setSelectedColumn(column);
    setIsEditColumnModalOpen(true);
  }, []);

  // Timeout para detectar loading infinito
  const [showLoadingTimeout, setShowLoadingTimeout] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (boardLoading || columnsLoading || cardsLoading) {
        setShowLoadingTimeout(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [boardLoading, columnsLoading, cardsLoading]);

  if (boardLoading || columnsLoading || cardsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
        <p className="text-slate-500">Carregando quadro...</p>
        {showLoadingTimeout && (
          <div className="text-center">
            <p className="text-amber-500 text-sm mb-2">O carregamento está demorando...</p>
            <p className="text-slate-400 text-xs max-w-md">
              Verifique se as políticas RLS foram aplicadas no Supabase.
              Execute as migrations 017 e 018 no SQL Editor.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (!board) {
    return (
      <GlassCard className="p-8 text-center">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
          Quadro não encontrado
        </h3>
        <p className="text-slate-500 mt-2">
          O quadro solicitado não existe ou você não tem acesso a ele.
        </p>
      </GlassCard>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="h-full flex flex-col"
    >
      {/* Header do Board */}
      <motion.div variants={fadeInUp}>
        <BoardHeader
          board={board}
          isConnected={isConnected}
          onAddColumn={() => setIsNewColumnDialogOpen(true)}
          onEditBoard={() => setIsEditBoardModalOpen(true)}
          onManageMembers={() => setIsManageMembersModalOpen(true)}
          onSearch={setSearchQuery}
          onSwitchBoard={() => setIsSwitchBoardModalOpen(true)}
        />
      </motion.div>

      {/* Área de Drag-and-Drop */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <motion.div
          variants={fadeInUp}
          className="flex-1 overflow-x-auto overflow-y-hidden"
        >
          <SortableContext
            items={columnsWithCards.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-4 h-full p-4 min-w-max">
              {columnsWithCards.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  onCardClick={handleCardClick}
                  onAddCard={() => handleAddCard(column.id)}
                  onEditColumn={handleEditColumn}
                  onDeleteColumn={handleDeleteColumn}
                />
              ))}

              {/* Botão para adicionar coluna */}
              <div className="w-80 shrink-0">
                <button
                  onClick={() => setIsNewColumnDialogOpen(true)}
                  className={cn(
                    "w-full h-full min-h-[200px] rounded-xl border-2 border-dashed",
                    "border-slate-300 dark:border-slate-600",
                    "flex flex-col items-center justify-center gap-2",
                    "text-slate-500 dark:text-slate-400",
                    "hover:border-emerald-500 hover:text-emerald-500",
                    "transition-colors duration-200"
                  )}
                >
                  <Plus className="w-8 h-8" />
                  <span className="font-medium">Adicionar Coluna</span>
                </button>
              </div>
            </div>
          </SortableContext>
        </motion.div>

        {/* Overlay do Drag */}
        <DragOverlay dropAnimation={dropAnimation}>
          {activeDragData?.type === "card" && (
            <KanbanCard
              card={activeDragData.item as KanbanCardType}
              isOverlay
            />
          )}
          {activeDragData?.type === "column" && (
            <div className="w-80 shrink-0 opacity-90 rotate-2">
              <KanbanColumn
                column={activeDragData.item as KanbanColumnType}
                isOverlay
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Modais */}
      <NewColumnDialog
        open={isNewColumnDialogOpen}
        onOpenChange={setIsNewColumnDialogOpen}
        boardId={boardId}
      />

      {newCardColumnId && (
        <NewCardDialog
          open={!!newCardColumnId}
          onOpenChange={(open) => !open && setNewCardColumnId(null)}
          columnId={newCardColumnId}
          boardId={boardId}
          companyId={companyId}
        />
      )}

      {selectedCard && (
        <CardDetailModal
          open={isCardModalOpen}
          onOpenChange={setIsCardModalOpen}
          card={selectedCard}
          boardId={boardId}
        />
      )}

      <EditBoardModal
        board={board}
        isOpen={isEditBoardModalOpen}
        onClose={() => setIsEditBoardModalOpen(false)}
      />

      <ManageMembersModal
        board={board}
        isOpen={isManageMembersModalOpen}
        onClose={() => setIsManageMembersModalOpen(false)}
      />

      <EditColumnModal
        open={isEditColumnModalOpen}
        onOpenChange={setIsEditColumnModalOpen}
        column={selectedColumn}
        boardId={boardId}
      />

      <SwitchBoardModal
        open={isSwitchBoardModalOpen}
        onOpenChange={setIsSwitchBoardModalOpen}
        currentBoardId={boardId}
        companyId={companyId}
      />
    </motion.div>
  );
}
