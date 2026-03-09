"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DateRangePicker,
  PanelCustomizer,
  PieChartWidget,
  BarChartWidget,
  LineChartWidget,
  SummaryCards,
  TeamPerformanceTable,
} from "@/components/analytics";
import {
  useDateRangePicker,
  DateRange,
  useDashboardLayout,
  WidgetType,
} from "@/hooks";
import { cn } from "@/lib/utils";

// Mock data for build time / initial render
const MOCK_PIE_DATA = [
  { name: "Não informado", value: 100, percentage: 100, color: "#10b981" },
];

const MOCK_TIME_DATA = [
  { date: "03/03/2026", value: 100, label: "100%" },
  { date: "04/03/2026", value: 100, label: "100%" },
  { date: "05/03/2026", value: 100, label: "100%" },
  { date: "06/03/2026", value: 100, label: "100%" },
  { date: "07/03/2026", value: 100, label: "100%" },
  { date: "08/03/2026", value: 100, label: "100%" },
  { date: "09/03/2026", value: 100, label: "100%" },
];

const MOCK_ATTENDANCE_DATA = [
  { date: "03/03/2026", value: 133, label: "133" },
  { date: "04/03/2026", value: 875, label: "875" },
  { date: "05/03/2026", value: 58, label: "58" },
  { date: "06/03/2026", value: 54, label: "54" },
  { date: "07/03/2026", value: 58, label: "58" },
  { date: "08/03/2026", value: 58, label: "58" },
  { date: "09/03/2026", value: 13, label: "13" },
];

const MOCK_SUMMARY = {
  totalAttendances: 1323,
  active: 952,
  receptive: 371,
  newContacts: 823,
  avgTMA: "1 minuto",
  avgFirstResponse: "1 minuto",
};

const MOCK_TEAM_DATA = [
  {
    userId: "1",
    userName: "Não informado",
    pending: 77,
    attending: 0,
    finished: 782,
    total: 859,
    avgFirstResponse: "-",
    avgTMA: "-",
  },
  {
    userId: "2",
    userName: "CALVES PIZZA",
    userEmail: "calvespizzaria@gmail.com",
    pending: 250,
    attending: 213,
    finished: 1,
    total: 464,
    avgFirstResponse: "3 minutos",
    avgTMA: "2 minutos",
  },
];

/**
 * Dashboard Central de Agentes
 * 
 * Página principal com analytics completos
 */
export default function CentralPage() {
  const [mounted, setMounted] = useState(false);
  
  // Date range state
  const { dateRange, setDateRange, handleGenerate } = useDateRangePicker(7);
  const [appliedDateRange, setAppliedDateRange] = useState<DateRange>(dateRange);

  // Dashboard layout
  const dashboardLayout = useDashboardLayout();

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

  // Durante SSR/build, mostra dados mockados
  // No cliente, o QueryClientProvider envolverá o conteúdo real
  return (
    <div className="space-y-6">
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
            Acompanhe as métricas e desempenho da sua equipe
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
            metrics={mounted ? undefined : MOCK_SUMMARY} 
            isLoading={!mounted} 
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
            <PieChartWidget
              title="Atendimento por Fila"
              data={MOCK_PIE_DATA}
              isLoading={!mounted}
            />
          </motion.div>
        )}

        {isWidgetVisible("user") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <PieChartWidget
              title="Atendimento por Usuário"
              data={[
                { name: "CALVES PIZZA", value: 649, percentage: 64.9, color: "#10b981" },
                { name: "Não informado", value: 351, percentage: 35.1, color: "#3b82f6" },
              ]}
              isLoading={!mounted}
            />
          </motion.div>
        )}

        {isWidgetVisible("status") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <PieChartWidget
              title="Atendimento por Status"
              data={[
                { name: "Abertos", value: 592, percentage: 59.2, color: "#10b981" },
                { name: "Pendentes", value: 247, percentage: 24.7, color: "#f59e0b" },
                { name: "Fechados", value: 161, percentage: 16.1, color: "#3b82f6" },
              ]}
              isLoading={!mounted}
            />
          </motion.div>
        )}

        {isWidgetVisible("channel-connection") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <PieChartWidget
              title="Atendimento por Canal (Conexão)"
              data={[
                { name: "WhatsApp Official", value: 100, percentage: 100, color: "#10b981" },
              ]}
              isLoading={!mounted}
            />
          </motion.div>
        )}

        {isWidgetVisible("channel-name") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <PieChartWidget
              title="Atendimento por Canal (Nome)"
              data={[
                { name: "calves pizza", value: 100, percentage: 100, color: "#10b981" },
              ]}
              isLoading={!mounted}
            />
          </motion.div>
        )}

        {isWidgetVisible("demand") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <PieChartWidget
              title="Atendimento por Demanda"
              data={[]}
              isLoading={!mounted}
              emptyMessage="Sem dados"
            />
          </motion.div>
        )}
      </div>

      {/* Bar Charts Row */}
      <div className="grid grid-cols-1 gap-4">
        {isWidgetVisible("channel-evolution") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <BarChartWidget
              title="Evolução por Canal"
              data={MOCK_TIME_DATA}
              isLoading={!mounted}
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
            transition={{ delay: 0.55 }}
          >
            <LineChartWidget
              title="Evolução de Atendimentos"
              data={MOCK_ATTENDANCE_DATA}
              isLoading={!mounted}
              showArea={true}
            />
          </motion.div>
        )}

        {isWidgetVisible("values-evolution") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <LineChartWidget
              title="Evolução de Valores"
              data={MOCK_TIME_DATA.map(d => ({ ...d, value: 0 }))}
              isLoading={!mounted}
              showArea={false}
              color="#8b5cf6"
            />
          </motion.div>
        )}
      </div>

      {/* Team Performance Table */}
      {isWidgetVisible("team-performance") && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <TeamPerformanceTable
            data={MOCK_TEAM_DATA}
            isLoading={!mounted}
          />
        </motion.div>
      )}

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

      {/* Real data fetching component (client-side only) */}
      {mounted && <AnalyticsDataFetcher dateRange={appliedDateRange} />}
    </div>
  );
}

/**
 * Componente que busca dados reais do Supabase (apenas cliente)
 */
function AnalyticsDataFetcher({ dateRange }: { dateRange: DateRange }) {
  // Aqui você pode implementar a busca real de dados
  // Por enquanto, os dados são mockados conforme solicitado
  return null;
}
