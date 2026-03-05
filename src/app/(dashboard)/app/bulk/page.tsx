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
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Disparo em Massa
          </h1>
          <p className="text-slate-400 mt-1">
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
                  <div className="p-2 rounded-lg bg-white/5">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">{stat.label}</p>
                    <p className="text-xl font-bold text-white">{stat.value}</p>
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
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-400" />
              Nova Campanha
            </h2>
            
            <div className="space-y-4">
              <AnimatedInput
                label="Nome da Campanha"
                placeholder="Ex: Promoção de Verão"
              />
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mensagem
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem aqui..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-lg p-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>{message.length} caracteres</span>
                  <span>Limite: 1000</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-dashed border-white/10">
                <Upload className="w-8 h-8 text-slate-400" />
                <div className="flex-1">
                  <p className="text-white font-medium">Importar Contatos</p>
                  <p className="text-sm text-slate-400">Arraste um arquivo CSV ou clique para selecionar</p>
                </div>
                <NeonButton variant="ghost" size="sm">
                  Selecionar
                </NeonButton>
              </div>
              
              <div className="flex gap-3 pt-4">
                <NeonButton variant="green" className="flex-1">
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
            <h2 className="text-lg font-semibold text-white mb-4">Templates</h2>
            <div className="space-y-3">
              {[
                { name: "Boas-vindas", category: "Onboarding" },
                { name: "Promoção", category: "Marketing" },
                { name: "Lembrete", category: "Cobrança" },
                { name: "Suporte", category: "Atendimento" },
              ].map((template) => (
                <button
                  key={template.name}
                  className="w-full text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <p className="text-white font-medium">{template.name}</p>
                  <p className="text-xs text-slate-400">{template.category}</p>
                </button>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Campaign History */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="overflow-hidden" hover={false}>
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Histórico de Campanhas</h2>
          </div>
          <div className="divide-y divide-white/5">
            {campaigns.map((campaign, index) => {
              const status = statusConfig[campaign.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;
              
              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${status.color} flex items-center justify-center`}>
                        <StatusIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{campaign.name}</h3>
                        <p className="text-sm text-slate-400">{campaign.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Enviados</p>
                        <p className="text-white font-medium">{campaign.sent.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Entregues</p>
                        <p className="text-emerald-400 font-medium">{campaign.delivered.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-400">Lidos</p>
                        <p className="text-blue-400 font-medium">{campaign.read.toLocaleString()}</p>
                      </div>
                      
                      {campaign.status === "running" && (
                        <div className="flex gap-1">
                          <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
                            <Pause className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
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
