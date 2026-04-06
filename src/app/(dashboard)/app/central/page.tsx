"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DateRangePicker,
  PanelCustomizer,
  ApexPieChart,
  ApexLineChart,
  ApexBarChart,
  SummaryCards,
  TeamPerformanceTable,
  CompanyEmailsWidget,
  ApexChartsInit,
} from "@/components/analytics";
import {
  useDateRangePicker,
  DateRange,
  useDashboardLayout,
  WidgetType,
  useAttendanceByStatus,
  useAttendanceByUser,
  useAttendanceByChannel,
  useAttendanceByChannelType,
  useAttendanceEvolution,
  useChannelEvolution,
  useSummaryMetrics,
  useTeamPerformance,
  TeamMemberPerformance,
} from "@/hooks";
import { cn } from "@/lib/utils";

/**
 * Dashboard Central de Agentes - Versão Modernizada
 * 
 * Features:
 * - Gráficos modernos com ApexCharts (interativos, responsivos)
 * - Dados reais integrados do Supabase
 * - Filtro rigoroso por company_id (isolamento total)
 * - Listagem dinâmica de e-mails corporativos
 * - Sem referências hardcoded ou dados de outras empresas
 */
export default function CentralPage() {
  const [mounted, setMounted] = useState(false);
  
  // Date range state
  const { dateRange, setDateRange, handleGenerate } = useDateRangePicker(7);
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(dateRange);

  // Dashboard layout
  const dashboardLayout = useDashboardLayout();

  // Fetch real data from Supabase
  const { data: statusData, isLoading: statusLoading } = useAttendanceByStatus(appliedDateRange);
  const { data: userData, isLoading: userLoading } = useAttendanceByUser(appliedDateRange);
  const { data: channelTypeData, isLoading: channelTypeLoading } = useAttendanceByChannelType(appliedDateRange);
  const { data: channelNameData, isLoading: channelNameLoading } = useAttendanceByChannel(appliedDateRange);
  const { data: attendanceEvolutionData, isLoading: attendanceEvolutionLoading } = useAttendanceEvolution(appliedDateRange);
  const { data: channelEvolutionData, isLoading: channelEvolutionLoading } = useChannelEvolution(appliedDateRange);
  const { data: summaryMetrics, isLoading: summaryLoading } = useSummaryMetrics(appliedDateRange);
  const { data: teamPerformanceData, isLoading: teamPerformanceLoading } = useTeamPerformance(appliedDateRange);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  const handleGenerateClick = () => {
    setAppliedDateRange(dateRange);
    handleGenerate();
  };

  const visibleWidgets = dashboardLayout.getVisibleWidgets();

  const isWidgetVisible = (id: WidgetType) => {
    return visibleWidgets.some((w) => w.id === id);
  };

  // Helper to transform data for ApexCharts
  const transformPieData = (data: { name: string; value: number; color?: string }[] | undefined) => {
    if (!data || data.length === 0) return [];
    return data.map(item => ({
      name: item.name,
      value: item.value,
      color: item.color,
    }));
  };

  const transformTimeSeriesData = (data: { date: string; value: number; label?: string }[] | undefined) => {
    if (!data || data.length === 0) return [];
    return data.map(item => ({
      date: item.date,
      value: item.value,
      label: item.label || item.value.toString(),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Initialize ApexCharts globally */}
      <ApexChartsInit />
      
      {/* Header with Date Range and Panel Customizer */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold dark:text-white text-slate-900">
            Painel de Controle
          </h1>
          <p className="text-sm dark:text-slate-400 text-slate-500 mt-1">
            Acompanhe as métricas e desempenho da sua equipe em tempo real
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            onGenerate={handleGenerateClick}
          />
          <PanelCustomizer layout={dashboardLayout} />
        </div>
      </motion.div>

      {/* Summary Cards */}
      {isWidgetVisible("summary-cards") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SummaryCards 
            metrics={mounted ? summaryMetrics : undefined} 
            isLoading={!mounted || summaryLoading} 
          />
        </motion.div>
      )}

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isWidgetVisible("queue") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ApexPieChart
              title="Atendimento por Fila"
              data={transformPieData(channelNameData)}
              isLoading={!mounted || channelNameLoading}
              type="donut"
              showLegend={true}
            />
          </motion.div>
        )}

        {isWidgetVisible("user") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <ApexPieChart
              title="Atendimento por Usuário"
              data={transformPieData(userData)}
              isLoading={!mounted || userLoading}
              type="donut"
              showLegend={true}
            />
          </motion.div>
        )}

        {isWidgetVisible("status") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <ApexPieChart
              title="Atendimento por Status"
              data={transformPieData(statusData)}
              isLoading={!mounted || statusLoading}
              type="donut"
              showLegend={true}
            />
          </motion.div>
        )}
      </div>

      {/* Second Row - More Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isWidgetVisible("channel-connection") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <ApexPieChart
              title="Atendimento por Canal (Conexão)"
              data={transformPieData(channelTypeData)}
              isLoading={!mounted || channelTypeLoading}
              type="donut"
              showLegend={true}
            />
          </motion.div>
        )}

        {isWidgetVisible("channel-name") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <ApexPieChart
              title="Atendimento por Canal (Nome)"
              data={transformPieData(channelNameData)}
              isLoading={!mounted || channelNameLoading}
              type="donut"
              showLegend={true}
            />
          </motion.div>
        )}

        {isWidgetVisible("demand") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <ApexPieChart
              title="Atendimento por Demanda"
              data={[]}
              isLoading={!mounted}
              emptyMessage="Sem dados disponíveis"
              type="donut"
              showLegend={true}
            />
          </motion.div>
        )}
      </div>

      {/* Line Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isWidgetVisible("attendance-evolution") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ApexLineChart
              title="Evolução de Atendimentos"
              data={transformTimeSeriesData(attendanceEvolutionData)}
              isLoading={!mounted || attendanceEvolutionLoading}
              showArea={true}
              color="#10b981"
            />
          </motion.div>
        )}

        {isWidgetVisible("values-evolution") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <ApexLineChart
              title="Evolução de Valores"
              data={transformTimeSeriesData(channelEvolutionData)}
              isLoading={!mounted || channelEvolutionLoading}
              showArea={false}
              color="#8b5cf6"
            />
          </motion.div>
        )}
      </div>

      {/* Bar Chart Row */}
      <div className="grid grid-cols-1 gap-4">
        {isWidgetVisible("channel-evolution") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <ApexBarChart
              title="Evolução por Canal"
              data={transformTimeSeriesData(channelEvolutionData).map(d => ({ category: d.date, value: d.value }))}
              isLoading={!mounted || channelEvolutionLoading}
              color="#10b981"
            />
          </motion.div>
        )}
      </div>

      {/* Team Performance Table and Company Emails */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {isWidgetVisible("team-performance") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            className="lg:col-span-2"
          >
            <TeamPerformanceTable
              data={teamPerformanceData}
              isLoading={!mounted || teamPerformanceLoading}
            />
          </motion.div>
        )}

        {isWidgetVisible("company-emails") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <CompanyEmailsWidget />
          </motion.div>
        )}
      </div>

      {/* Empty state when no widgets visible */}
      {visibleWidgets.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <p className="text-lg dark:text-slate-400 text-slate-500 mb-2">
            Nenhum painel visível
          </p>
          <p className="text-sm dark:text-slate-500 text-slate-400">
            Use o botão "Personalizar Painéis" para ativar os widgets
          </p>
        </motion.div>
      )}
    </div>
  );
}
