"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import {
  Building2,
  Users,
  CreditCard,
  TrendingUp,
  Activity,
  DollarSign,
  Wifi,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  AlertCircle,
  Zap,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { useSuperDashboard } from "@/hooks/use-super-dashboard";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { cn, formatCurrency } from "@/lib/utils";

// KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  glow?: "green" | "blue" | "purple" | "amber" | "none";
  delay?: number;
}

function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  glow = "green",
  delay = 0,
}: KPICardProps) {
  return (
    <motion.div variants={fadeInUp} custom={delay}>
      <GlassCard
        className="p-5 h-full relative overflow-hidden group"
        glow={glow}
        hover
      >
        {/* Background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{subtitle}</p>
            )}
            {trend !== undefined && (
              <div
                className={cn(
                  "flex items-center gap-1 mt-2 text-xs",
                  trend >= 0 ? "text-emerald-400" : "text-red-400"
                )}
              >
                {trend >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>{Math.abs(trend)}%</span>
                {trendLabel && (
                  <span className="text-slate-500 ml-1">{trendLabel}</span>
                )}
              </div>
            )}
          </div>
          <div
            className={cn(
              "p-3 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110",
              glow === "green" && "bg-emerald-500/10",
              glow === "blue" && "bg-blue-500/10",
              glow === "purple" && "bg-purple-500/10",
              glow === "amber" && "bg-amber-500/10",
              glow === "none" && "bg-slate-500/10"
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5",
                glow === "green" && "text-emerald-400",
                glow === "blue" && "text-blue-400",
                glow === "purple" && "text-purple-400",
                glow === "amber" && "text-amber-400",
                glow === "none" && "text-slate-400"
              )}
            />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Simple Bar Chart Component
function SimpleBarChart({
  data,
  dataKey,
  labelKey,
  color = "emerald",
}: {
  data: Array<Record<string, number | string>>;
  dataKey: string;
  labelKey: string;
  color?: "emerald" | "blue" | "purple";
}) {
  const maxValue = Math.max(...data.map((d) => Number(d[dataKey]) || 0));

  const colorClasses = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="flex items-end justify-between h-40 gap-2">
      {data.map((item, index) => {
        const value = Number(item[dataKey]) || 0;
        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full relative flex items-end justify-center h-32">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={cn(
                  "w-full max-w-8 rounded-t-lg min-h-[4px] transition-all duration-300 hover:opacity-80",
                  colorClasses[color]
                )}
                style={{
                  background:
                    color === "emerald"
                      ? "linear-gradient(to top, rgba(16,185,129,0.8), rgba(16,185,129,0.4))"
                      : color === "blue"
                      ? "linear-gradient(to top, rgba(59,130,246,0.8), rgba(59,130,246,0.4))"
                      : "linear-gradient(to top, rgba(139,92,246,0.8), rgba(139,92,246,0.4))",
                }}
              />
            </div>
              <span className="text-xs text-muted-foreground">
                {String(item[labelKey])}
              </span>
          </div>
        );
      })}
    </div>
  );
}

// Stat Row Component
function StatRow({
  label,
  value,
  icon: Icon,
  color = "emerald",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: "emerald" | "blue" | "amber" | "red";
}) {
  const colorClasses = {
    emerald: "bg-emerald-500/10 text-emerald-400",
    blue: "bg-blue-500/10 text-blue-400",
    amber: "bg-amber-500/10 text-amber-400",
    red: "bg-red-500/10 text-red-400",
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", colorClasses[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

export default function SuperCentralPage() {
  const {
    metrics,
    growthData,
    loading,
    error,
    lastUpdated,
    refetch,
  } = useSuperDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="w-8 h-8 text-emerald-500" />
          </motion.div>
          <p className="text-muted-foreground text-sm">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <GlassCard className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Erro ao carregar dados</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <NeonButton variant="red" onClick={refetch}>
            Tentar novamente
          </NeonButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div
        variants={fadeInUp}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GlowBadge variant="green" pulse>
              <Zap className="w-3 h-3 mr-1" />
              Live Dashboard
            </GlowBadge>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Atualizado {lastUpdated.toLocaleTimeString("pt-BR")}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">
            Dashboard Central
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral completa do sistema LIDIA 2.0
          </p>
        </div>
        <NeonButton variant="green" onClick={refetch} className="self-start">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </NeonButton>
      </motion.div>

      {/* KPI Grid */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <KPICard
          title="Total de Empresas"
          value={metrics.totalCompanies}
          subtitle={`${metrics.activeCompanies} ativas, ${metrics.inactiveCompanies} inativas`}
          icon={Building2}
          glow="green"
          delay={0}
        />
        <KPICard
          title="Usuários Ativos"
          value={metrics.totalUsers}
          subtitle={`${metrics.onlineUsers} online agora`}
          icon={Users}
          glow="blue"
          delay={0.1}
        />
        <KPICard
          title="MRR"
          value={formatCurrency(metrics.monthlyRecurringRevenue)}
          subtitle="Receita mensal recorrente"
          icon={DollarSign}
          glow="purple"
          delay={0.2}
        />
        <KPICard
          title="Planos Ativos"
          value={metrics.activePlans}
          subtitle={`${metrics.totalPlans} planos no total`}
          icon={CreditCard}
          glow="amber"
          delay={0.3}
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Growth Chart */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <GlassCard className="p-6" glow="green" hover>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Crescimento Temporal
                </h3>
                <p className="text-sm text-muted-foreground">
                  Evolução de empresas e usuários
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-muted-foreground">Empresas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-muted-foreground">Usuários</span>
                </div>
              </div>
            </div>
            <SimpleBarChart
              data={growthData}
              dataKey="companies"
              labelKey="month"
              color="emerald"
            />
          </GlassCard>
        </motion.div>

        {/* Quick Stats */}
        <motion.div variants={fadeInUp}>
          <GlassCard className="p-6 h-full" glow="blue" hover>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                Estatísticas Rápidas
              </h3>
              <p className="text-sm text-muted-foreground">Resumo do sistema</p>
            </div>
            <div className="space-y-1">
              <StatRow
                label="Canais Conectados"
                value={metrics.connectedChannels}
                icon={Wifi}
                color="emerald"
              />
              <StatRow
                label="Total de Canais"
                value={metrics.totalChannels}
                icon={Activity}
                color="blue"
              />
              <StatRow
                label="Atendimentos (Mês)"
                value={metrics.attendancesThisMonth}
                icon={TrendingUp}
                color="amber"
              />
              <StatRow
                label="Total de Atendimentos"
                value={metrics.totalAttendances}
                icon={Activity}
                color="emerald"
              />
              <StatRow
                label="Planos Inativos"
                value={metrics.inactivePlans}
                icon={CreditCard}
                color="red"
              />
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* Revenue Chart */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="p-6" glow="purple" hover>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Receita Mensal (MRR)
              </h3>
              <p className="text-sm text-slate-400">
                Evolução da receita nos últimos 6 meses
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-xs text-slate-400">Receita (R$)</span>
              </div>
            </div>
          </div>
          <SimpleBarChart
            data={growthData}
            dataKey="revenue"
            labelKey="month"
            color="purple"
          />
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
