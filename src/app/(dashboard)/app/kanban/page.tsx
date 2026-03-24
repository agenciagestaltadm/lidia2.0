"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion } from "framer-motion";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { Button } from "@/components/ui/button";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { useAuth } from "@/hooks/use-auth";
import { Plus, FolderKanban } from "lucide-react";

// Mock board ID - In production, this would come from URL params or state
const DEFAULT_BOARD_ID = "mock-board-id";

export default function KanbanPage() {
  const { user } = useAuth();
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(DEFAULT_BOARD_ID);
  const [showBoardSelector, setShowBoardSelector] = useState(false);

  const companyId = user?.companyId;

  // If no board is selected, show board selector
  if (!selectedBoardId) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6 h-full"
      >
        <motion.div variants={fadeInUp}>
          <GlassCard className="p-8 text-center" hover={false}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <FolderKanban className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Selecione um Quadro
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Escolha um quadro existente ou crie um novo para começar.
            </p>
            <div className="flex justify-center gap-4">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Criar Novo Quadro
              </Button>
              <Button variant="outline">
                Ver Todos os Quadros
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="h-[calc(100vh-8rem)]"
    >
      <motion.div variants={fadeInUp} className="h-full">
        {companyId ? (
          <KanbanBoard 
            boardId={selectedBoardId} 
            companyId={companyId} 
          />
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
