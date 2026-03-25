"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { useAuth } from "@/hooks/use-auth";
import { useBoards, useBoard } from "@/hooks/use-kanban";
import { Plus, FolderKanban, LayoutGrid, ChevronDown } from "lucide-react";
import { toast } from "sonner";

function KanbanPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const { user } = useAuth();
  const companyId = user?.companyId;
  
  // Usar URL como source of truth
  const selectedBoardId = searchParams.get("board");
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [isNavigating, setIsNavigating] = useState(false);

  const { boards, isLoading: boardsLoading, refetch } = useBoards(companyId);
  const { createBoard } = useBoard(null);

  // Função para atualizar o board na URL
  const handleSelectBoard = useCallback((boardId: string | null) => {
    setIsNavigating(true);
    const params = new URLSearchParams(searchParams.toString());
    
    if (boardId) {
      params.set("board", boardId);
    } else {
      params.delete("board");
    }
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    
    // Reset loading state após navegação
    setTimeout(() => setIsNavigating(false), 300);
  }, [router, pathname, searchParams]);

  const handleCreateBoard = async () => {
    if (!newBoardName.trim() || !companyId) return;

    try {
      const result = await createBoard.mutateAsync({
        name: newBoardName.trim(),
        description: newBoardDescription || undefined,
        company_id: companyId,
      });

      if (result) {
        toast.success("Quadro criado com sucesso!");
        setNewBoardName("");
        setNewBoardDescription("");
        setShowCreateForm(false);
        handleSelectBoard(result.id);
        refetch();
      }
    } catch (error) {
      toast.error("Erro ao criar quadro");
    }
  };

  // Loading state
  if (boardsLoading) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="h-full flex items-center justify-center"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </motion.div>
    );
  }

  // No boards - Show create first board screen
  if (!boards || boards.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6 h-full"
      >
        <motion.div variants={fadeInUp}>
          {!showCreateForm ? (
            <GlassCard className="p-8 text-center max-w-md mx-auto mt-20" hover={false}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <FolderKanban className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Crie seu primeiro Quadro
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Organize suas tarefas e acompanhe o progresso da sua equipe com quadros Kanban.
              </p>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Quadro
              </Button>
            </GlassCard>
          ) : (
            <GlassCard className="p-8 max-w-md mx-auto mt-20" hover={false}>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                Novo Quadro
              </h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="boardName">Nome do Quadro *</Label>
                  <Input
                    id="boardName"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="Ex: Pipeline de Vendas"
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="boardDescription">Descrição</Label>
                  <Input
                    id="boardDescription"
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    placeholder="Descrição opcional"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    onClick={handleCreateBoard}
                    disabled={!newBoardName.trim() || createBoard.isPending}
                  >
                    {createBoard.isPending ? "Criando..." : "Criar Quadro"}
                  </Button>
                </div>
              </div>
            </GlassCard>
          )}
        </motion.div>
      </motion.div>
    );
  }

  // Has boards - Show board selector or selected board
  if (!selectedBoardId) {
    // Auto-select first board if only one exists - use effect to avoid infinite loop
    if (boards.length === 1) {
      // Set timeout to avoid React render loop
      setTimeout(() => {
        handleSelectBoard(boards[0].id);
      }, 0);
      return (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="h-full flex items-center justify-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
        </motion.div>
      );
    }

    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6 h-full"
      >
        <motion.div variants={fadeInUp}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Meus Quadros
            </h1>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Quadro
            </Button>
          </div>

          {showCreateForm && (
            <GlassCard className="p-6 mb-6" hover={false}>
              <h3 className="text-lg font-semibold mb-4">Criar Novo Quadro</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="boardName">Nome *</Label>
                  <Input
                    id="boardName"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="Nome do quadro"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="boardDescription">Descrição</Label>
                  <Input
                    id="boardDescription"
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    placeholder="Descrição opcional"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewBoardName("");
                    setNewBoardDescription("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleCreateBoard}
                  disabled={!newBoardName.trim() || createBoard.isPending}
                >
                  {createBoard.isPending ? "Criando..." : "Criar Quadro"}
                </Button>
              </div>
            </GlassCard>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <GlassCard
                key={board.id}
                className="p-6 cursor-pointer hover:border-emerald-500/50 transition-all"
                onClick={() => handleSelectBoard(board.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <LayoutGrid className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {board.name}
                    </h3>
                    {board.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {board.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      Criado em {new Date(board.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // Show selected board with selector
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="h-[calc(100vh-8rem)]"
    >
      <motion.div variants={fadeInUp} className="h-full">
        {companyId ? (
          <>
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                onClick={() => handleSelectBoard(null)}
                disabled={isNavigating}
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                Trocar Quadro
              </Button>
              <span className="text-slate-500 dark:text-slate-400">
                {boards.find(b => b.id === selectedBoardId)?.name}
              </span>
              {isNavigating && (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-emerald-500" />
              )}
            </div>
            <KanbanBoard
              boardId={selectedBoardId}
              companyId={companyId}
            />
          </>
        ) : (
          <GlassCard className="p-8 text-center" hover={false}>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
              Empresa não encontrada
            </h3>
            <p className="text-slate-500 mt-2">
              Não foi possível identificar sua empresa. Por favor, entre em contato com o suporte.
            </p>
          </GlassCard>
        )}
      </motion.div>
    </motion.div>
  );
}

// Export default com Suspense para evitar erro de prerendering
export default function KanbanPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    }>
      <KanbanPageContent />
    </Suspense>
  );
}
