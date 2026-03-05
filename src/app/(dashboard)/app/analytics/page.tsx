"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  DollarSign,
  Calendar,
  Download,
  Filter
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Mock data for charts
const performanceData = [
  { name: "Seg", atendimentos: 45, convertidos: 32 },
  { name: "Ter", atendimentos: 52, convertidos: 38 },
  { name: "Qua", atendimentos: 48, convertidos: 35 },
  { name: "Qui", atendimentos: 61, convertidos: 45 },
  { name: "Sex", atendimentos: 55, convertidos: 42 },
  { name: "Sab", atendimentos: 38, convertidos: 28 },
  { name: "Dom", atendimentos: 42, convertidos: 31 },
];

const revenueData = [
  { name: "Jan", value: 45000 },
  { name: "Fev", value: 52000 },
  { name: "Mar", value: 48000 },
  { name: "Abr", value: 61000 },
  { name: "Mai", value: 55000 },
  { name: "Jun", value: 67000 },
];

const channelData = [
  { name: "WhatsApp", value: 45, color: "#00f0ff" },
  { name: "E-mail", value: 25, color: "#8b5cf6" },
  { name: "Telefone", value: 20, color: "#d946ef" },
  { name: "Chat", value: 10, color: "#10b981" },
];

const stats = [
  { label: "Total de Atendimentos", value: "2,847", change: "+12.5%", icon: MessageSquare },
  { label: "Taxa de Conversão", value: "68.4%", change: "+5.2%", icon: TrendingUp },
  { label: "Novos Clientes", value: "384", change: "+23.1%", icon: Users },
  { label: "Receita Total", value: "R$ 124.5K", change: "+18.7%", icon: DollarSign },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 border border-white/10 rounded-lg p-3 backdrop-blur-xl">
        <p className="text-slate-300 text-sm mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GlowBadge variant="green">Analytics</GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Dashboard de Analytics
          </h1>
          <p className="text-slate-400 mt-1">
            Acompanhe métricas e indicadores de performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NeonButton variant="ghost" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Últimos 30 dias
          </NeonButton>
          <NeonButton variant="green" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </NeonButton>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={fadeInUp} custom={index}>
              <GlassCard className="p-6" glow="green">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                    <p className="text-emerald-400 text-sm mt-1">{stat.change}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeInUp}>
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                Atendimentos vs Convertidos
              </h3>
              <GlowBadge variant="green">Esta Semana</GlowBadge>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="atendimentos" name="Atendimentos" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="convertidos" name="Convertidos" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Evolução de Receita
              </h3>
              <GlowBadge variant="green">6 Meses</GlowBadge>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={fadeInUp} className="lg:col-span-1">
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                Canais de Comunicação
              </h3>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {channelData.map((channel) => (
                <div key={channel.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: channel.color }}
                  />
                  <span className="text-sm text-slate-400">{channel.name}</span>
                  <span className="text-sm text-white font-medium">{channel.value}%</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Filter className="w-5 h-5 text-emerald-400" />
                Performance por Período
              </h3>
              <NeonButton variant="ghost" size="sm">
                Ver Detalhes
              </NeonButton>
            </div>
            <div className="space-y-4">
              {[
                { label: "Conversão de Leads", value: 68, color: "from-emerald-500 to-emerald-600" },
                { label: "Taxa de Resposta", value: 84, color: "from-emerald-600 to-green-600" },
                { label: "Satisfação do Cliente", value: 92, color: "from-green-500 to-emerald-500" },
                { label: "Retenção", value: 76, color: "from-emerald-400 to-green-500" },
              ].map((metric) => (
                <div key={metric.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">{metric.label}</span>
                    <span className="text-white font-medium">{metric.value}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full rounded-full bg-gradient-to-r ${metric.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
