"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { 
  Send, 
  Users,
  MessageSquare,
  Upload,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Clock
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { useState } from "react";

// Mock data for bulk campaigns
const campaigns = [
  { 
    id: 1, 
    name: "Promoção de Verão", 
    status: "completed",
    sent: 1250,
    delivered: 1180,
    read: 890,
    date: "10/03/2026"
  },
  { 
    id: 2, 
    name: "Lembrete de Pagamento", 
    status: "running",
    sent: 450,
    delivered: 420,
    read: 280,
    date: "Em andamento"
  },
  { 
    id: 3, 
    name: "Novidades da Semana", 
    status: "scheduled",
    sent: 0,
    delivered: 0,
    read: 0,
    date: "15/03/2026 09:00"
  },
];

const statusConfig = {
  completed: { label: "Concluída", color: "bg-emerald-500", icon: CheckCircle },
  running: { label: "Em Execução", color: "bg-amber-500", icon: Play },
  scheduled: { label: "Agendada", color: "bg-blue-500", icon: Clock },
  paused: { label: "Pausada", color: "bg-slate-500", icon: Pause },
};

export default function BulkPage() {
  const [message, setMessage] = useState("");

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GlowBadge variant="green">Disparo Bulk</GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900">
            Disparo em Massa
          </h1>
          <p className="dark:text-slate-400 text-slate-500 mt-1">
            Envie mensagens para múltiplos contatos simultaneamente
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Campanhas", value: "24", icon: Send },
          { label: "Total Enviado", value: "15.2K", icon: Users },
          { label: "Taxa de Entrega", value: "94%", icon: CheckCircle },
          { label: "Taxa de Leitura", value: "71%", icon: MessageSquare },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={fadeInUp} custom={index}>
              <GlassCard className="p-4" glow="green">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg dark:bg-white/5 bg-slate-100">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="dark:text-slate-400 text-slate-500 text-xs">{stat.label}</p>
                    <p className="text-xl font-bold dark:text-white text-slate-900">{stat.value}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* New Campaign */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <GlassCard className="p-6" hover={false}>
            <h2 className="text-lg font-semibold dark:text-white text-slate-900 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-400" />
              Nova Campanha
            </h2>
            
            <div className="space-y-4">
              <AnimatedInput
                label="Nome da Campanha"
                placeholder="Ex: Promoção de Verão"
              />
              
              <div>
                <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                  Mensagem
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem aqui..."
                  className="w-full h-32 dark:bg-white/5 bg-slate-100 dark:border-white/10 border-slate-200 border rounded-lg p-4 dark:text-slate-200 text-slate-700 dark:placeholder:text-slate-500 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
                />
                <div className="flex justify-between text-xs dark:text-slate-500 text-slate-400 mt-1">
                  <span>{message.length} caracteres</span>
                  <span>Limite: 1000</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-lg dark:bg-white/5 bg-slate-100 border border-dashed dark:border-white/10 border-slate-300">
                <Upload className="w-8 h-8 dark:text-slate-400 text-slate-500" />
                <div className="flex-1">
                  <p className="dark:text-white text-slate-900 font-medium">Importar Contatos</p>
                  <p className="text-sm dark:text-slate-400 text-slate-500">Arraste um arquivo CSV ou clique para selecionar</p>
                </div>
                <NeonButton variant="ghost" size="sm">
                  Selecionar
                </NeonButton>
              </div>
              
              <div className="flex gap-3 pt-4">
                <NeonButton variant="green">
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Agora
                </NeonButton>
                <NeonButton variant="ghost">
                  <Clock className="w-4 h-4 mr-2" />
                  Agendar
                </NeonButton>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Templates */}
        <motion.div variants={fadeInUp}>
          <GlassCard className="p-6 h-full" hover={false}>
            <h2 className="text-lg font-semibold dark:text-white text-slate-900 mb-4">Templates</h2>
            <div className="space-y-3">
              {[
                { name: "Boas-vindas", category: "Onboarding" },
                { name: "Promoção", category: "Marketing" },
                { name: "Lembrete", category: "Cobrança" },
                { name: "Suporte", category: "Atendimento" },
              ].map((template) => (
                <button
                  key={template.name}
                  className="w-full text-left p-3 rounded-lg dark:bg-white/5 bg-slate-100 dark:hover:bg-white/10 hover:bg-slate-200 transition-colors"
                >
                  <p className="dark:text-white text-slate-900 font-medium">{template.name}</p>
                  <p className="text-xs dark:text-slate-400 text-slate-500">{template.category}</p>
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Campaign History */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="overflow-hidden" hover={false}>
          <div className="p-4 border-b dark:border-white/10 border-slate-200">
            <h2 className="text-lg font-semibold dark:text-white text-slate-900">Histórico de Campanhas</h2>
          </div>
          <div className="divide-y dark:divide-white/5 divide-slate-100">
            {campaigns.map((campaign, index) => {
              const status = statusConfig[campaign.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;
              
              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 dark:hover:bg-white/[0.02] hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${status.color} flex items-center justify-center`}>
                        <StatusIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium dark:text-white text-slate-900">{campaign.name}</h3>
                        <p className="text-sm dark:text-slate-400 text-slate-500">{campaign.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm dark:text-slate-400 text-slate-500">Enviados</p>
                        <p className="dark:text-white text-slate-900 font-medium">{campaign.sent.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm dark:text-slate-400 text-slate-500">Entregues</p>
                        <p className="text-emerald-400 font-medium">{campaign.delivered.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm dark:text-slate-400 text-slate-500">Lidos</p>
                        <p className="text-blue-400 font-medium">{campaign.read.toLocaleString()}</p>
                      </div>
                      
                      {campaign.status === "running" && (
                        <div className="flex gap-1">
                          <button className="p-2 rounded-lg dark:hover:bg-white/5 hover:bg-slate-100 dark:text-slate-400 text-slate-500">
                            <Pause className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg dark:hover:bg-white/5 hover:bg-slate-100 dark:text-slate-400 text-slate-500">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
