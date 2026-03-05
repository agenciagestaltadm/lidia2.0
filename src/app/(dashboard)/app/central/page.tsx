"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Plus, 
  Send, 
  Filter, 
  Users, 
  Building,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { staggerContainer, fadeInUp, cardHover } from "@/lib/animations";
import Link from "next/link";

// Mock data for dashboard
const stats = [
  { 
    label: "Atendimentos Abertos", 
    value: "24", 
    change: "+12%", 
    trend: "up",
    icon: MessageSquare,
    glow: "emerald" as const,
  },
  { 
    label: "Aguardando Resposta", 
    value: "8", 
    change: "-5%", 
    trend: "down",
    icon: Clock,
    glow: "emerald" as const,
  },
  { 
    label: "Fechados Hoje", 
    value: "16", 
    change: "+23%", 
    trend: "up",
    icon: CheckCircle,
    glow: "emerald" as const,
  },
  { 
    label: "Taxa de Conversão", 
    value: "68%", 
    change: "+8%", 
    trend: "up",
    icon: TrendingUp,
    glow: "emerald" as const,
  },
];

const quickActions = [
  { 
    label: "Novo Contato", 
    href: "/app/contacts/new", 
    icon: Plus,
    color: "from-emerald-500 to-emerald-600",
    description: "Adicionar cliente"
  },
  { 
    label: "Novo Negócio", 
    href: "/app/funnel/new", 
    icon: Filter,
    color: "from-emerald-600 to-green-600",
    description: "Criar oportunidade"
  },
  { 
    label: "Disparo Bulk", 
    href: "/app/bulk/new", 
    icon: Send,
    color: "from-green-500 to-emerald-500",
    description: "Enviar mensagens"
  },
  { 
    label: "Relatórios", 
    href: "/app/analytics", 
    icon: BarChart3,
    color: "from-emerald-400 to-green-500",
    description: "Ver métricas"
  },
];

const recentActivities = [
  { id: 1, text: "Novo atendimento iniciado", time: "2 min atrás", type: "info" },
  { id: 2, text: "Contato 'Maria Silva' atualizado", time: "15 min atrás", type: "success" },
  { id: 3, text: "Negócio 'Projeto Alpha' fechado", time: "1 hora atrás", type: "success" },
  { id: 4, text: "Campanha 'Promoção Verão' enviada", time: "2 horas atrás", type: "info" },
  { id: 5, text: "Novo usuário adicionado", time: "3 horas atrás", type: "info" },
];

function StatCard({ stat, index }: { stat: typeof stats[0]; index: number }) {
  const Icon = stat.icon;
  
  return (
    <motion.div
      variants={fadeInUp}
      custom={index}
      whileHover="hover"
      initial="rest"
    >
      <GlassCard glow="green" className="p-6 h-full">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
            <div className="flex items-center gap-1 mt-2">
              {stat.trend === "up" ? (
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm ${stat.trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
                {stat.change}
              </span>
              <span className="text-slate-500 text-sm ml-1">vs ontem</span>
            </div>
          </div>
          <div 
            className={`p-3 rounded-xl`}
            style={{
              background: `linear-gradient(135deg, rgba(16,185,129,0.2), transparent)`,
              border: `1px solid rgba(16,185,129,0.3)`,
            }}
          >
            <Icon className="w-5 h-5 text-emerald-400" />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function QuickActionCard({ action, index }: { action: typeof quickActions[0]; index: number }) {
  const Icon = action.icon;
  
  return (
    <motion.div
      variants={fadeInUp}
      custom={index}
    >
      <Link href={action.href}>
        <GlassCard className="p-5 h-full group cursor-pointer" glow="green">
          <div className="flex flex-col h-full">
            <div 
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-white font-semibold mb-1">{action.label}</h4>
            <p className="text-slate-400 text-sm">{action.description}</p>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}

export default function CentralPage() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GlowBadge variant="green" pulse>
              <Sparkles className="w-3 h-3 mr-1" />
              Sistema Ativo
            </GlowBadge>
            <span className="text-slate-500 text-sm">•</span>
            <span className="text-slate-400 text-sm">{new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Bem-vindo de volta!
          </h1>
          <p className="text-slate-400 mt-1">
            Aqui está o resumo da sua central de atendimentos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/app/analytics">
            <NeonButton variant="ghost" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver Analytics
            </NeonButton>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => (
          <StatCard key={stat.label} stat={stat} index={index} />
        ))}
      </motion.div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions - Takes up 2 columns */}
        <motion.div variants={fadeInUp} className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <QuickActionCard key={action.label} action={action} index={index} />
            ))}
          </div>

          {/* Management Cards */}
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mt-8">
            <Building className="w-5 h-5 text-emerald-400" />
            Gerenciamento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/app/companies">
              <GlassCard className="p-6 group cursor-pointer" glow="green">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Building className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Empresas</h3>
                    <p className="text-slate-400 text-sm">Gerenciar clientes e fornecedores</p>
                  </div>
                </div>
              </GlassCard>
            </Link>
            <Link href="/app/users">
              <GlassCard className="p-6 group cursor-pointer" glow="green">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Usuários</h3>
                    <p className="text-slate-400 text-sm">Gerenciar equipe e permissões</p>
                  </div>
                </div>
              </GlassCard>
            </Link>
          </div>
        </motion.div>

        {/* Activity Feed - Takes up 1 column */}
        <motion.div variants={fadeInUp} className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Atividade Recente
          </h2>
          <GlassCard className="p-0 overflow-hidden" hover={false}>
            <div className="p-4 border-b border-white/10">
              <h3 className="text-sm font-medium text-slate-300">Últimas ações</h3>
            </div>
            <div className="divide-y divide-white/5">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === "success" ? "bg-emerald-400" : "bg-emerald-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 truncate">{activity.text}</p>
                      <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-3 border-t border-white/10">
              <Link 
                href="/app/notifications"
                className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-center gap-1"
              >
                Ver todas as atividades
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </GlassCard>

          {/* Tips Card */}
          <GlassCard className="p-5" glow="green">
            <h3 className="text-sm font-semibold text-emerald-400 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Dica do Dia
            </h3>
            <p className="text-sm text-slate-300">
              Use filtros avançados no funil de vendas para identificar oportunidades com maior probabilidade de conversão.
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
