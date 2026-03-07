"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { 
  Kanban, 
  Plus,
  MoreVertical,
  Calendar,
  User,
  Tag,
  Clock
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Mock data for kanban
const columns = [
  { 
    id: "todo", 
    title: "A Fazer", 
    color: "bg-slate-500",
    cards: [
      { id: 1, title: "Contatar novo lead", customer: "Empresa ABC", priority: "high", dueDate: "Hoje" },
      { id: 2, title: "Enviar proposta", customer: "João Silva", priority: "medium", dueDate: "Amanhã" },
    ]
  },
  { 
    id: "doing", 
    title: "Em Andamento", 
    color: "bg-amber-500",
    cards: [
      { id: 3, title: "Negociação em progresso", customer: "Maria Santos", priority: "high", dueDate: "Em 2 dias" },
      { id: 4, title: "Aguardando aprovação", customer: "Pedro Costa", priority: "low", dueDate: "Esta semana" },
    ]
  },
  { 
    id: "done", 
    title: "Concluído", 
    color: "bg-emerald-500",
    cards: [
      { id: 5, title: "Contrato assinado", customer: "Ana Oliveira", priority: "high", dueDate: "Ontem" },
      { id: 6, title: "Pagamento recebido", customer: "Carlos Lima", priority: "medium", dueDate: "Ontem" },
    ]
  },
];

const priorityColors = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export default function KanbanPage() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6 h-full"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GlowBadge variant="green">Kanban</GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900">
            Pipeline de Vendas
          </h1>
          <p className="dark:text-slate-400 text-slate-500 mt-1">
            Visualize e gerencie seu funil de vendas
          </p>
        </div>
        <NeonButton variant="green">
          <Plus className="w-4 h-4 mr-2" />
          Nova Oportunidade
        </NeonButton>
      </motion.div>

      {/* Kanban Board */}
      <motion.div 
        variants={fadeInUp}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {columns.map((column) => (
          <GlassCard 
            key={column.id} 
            className="p-4 min-h-[500px]" 
            hover={false}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded-full", column.color)} />
                <h2 className="font-semibold dark:text-white text-slate-900">{column.title}</h2>
                <span className="text-sm dark:text-slate-400 text-slate-500">({column.cards.length})</span>
              </div>
              <button className="p-1 rounded-lg dark:hover:bg-white/5 hover:bg-slate-100 dark:text-slate-400 text-slate-500">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {column.cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg dark:bg-white/5 bg-slate-100 dark:border-white/10 border-slate-200 border dark:hover:border-emerald-500/30 hover:border-emerald-500/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium dark:text-white text-slate-900 text-sm">{card.title}</h3>
                    <button className="opacity-0 group-hover:opacity-100 p-1 rounded dark:hover:bg-white/5 hover:bg-slate-200 dark:text-slate-400 text-slate-500 transition-opacity">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border", priorityColors[card.priority as keyof typeof priorityColors])}>
                      {card.priority === "high" ? "Alta" : card.priority === "medium" ? "Média" : "Baixa"}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-xs dark:text-slate-400 text-slate-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{card.customer}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{card.dueDate}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        ))}
      </motion.div>
    </motion.div>
  );
}
