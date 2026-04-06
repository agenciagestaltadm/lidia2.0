"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ApexOptions } from "apexcharts";

// Default colors for ApexCharts
const DEFAULT_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#64748b"];

// Dynamic import to avoid SSR issues
const Chart = dynamic(
  () => import("react-apexcharts").then((mod) => mod),
  { ssr: false }
);

export interface ApexPieChartData {
  name: string;
  value: number;
  color?: string;
}

interface ApexPieChartProps {
  title: string;
  data: ApexPieChartData[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  type?: "pie" | "donut";
  showLegend?: boolean;
  height?: number;
  isDark?: boolean;
}

const CHART_COLORS = [
  "#10b981", // emerald-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#ec4899", // pink-500
  "#64748b", // slate-500
];

/**
 * Widget de gráfico de pizza/donut moderno usando ApexCharts.
 * 
 * Features:
 * - Animações suaves
 * - Tooltips interativos ricos
 * - Temas dark/light automáticos
 * - Responsivo
 * - Legendas configuráveis
 */
export function ApexPieChart({
  title,
  data,
  isLoading = false,
  emptyMessage = "Sem dados disponíveis",
  className,
  type = "donut",
  showLegend = true,
  height = 320,
  isDark = false,
}: ApexPieChartProps) {
  const [mounted, setMounted] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Wait for next tick to ensure ApexCharts is ready
    const timer = setTimeout(() => setChartReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Prepare data for ApexCharts - garante que data é um array válido
  const safeData = Array.isArray(data) ? data : [];
  const series = safeData.map((item) => item.value);
  const labels = safeData.map((item) => item.name);
  const colors = safeData.map((item, index) => item.color || CHART_COLORS[index % CHART_COLORS.length]);

  // Garante que temos dados válidos
  const safeSeries = series && series.length > 0 ? series : [0];
  const safeLabels = labels && labels.length > 0 ? labels : ["Sem dados"];
  const safeColors = colors && colors.length > 0 ? colors : CHART_COLORS;

  const options: ApexOptions = {
    chart: {
      type: type,
      fontFamily: "inherit",
      background: "transparent",
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },
    theme: {
      mode: isDark ? "dark" : "light",
      palette: "palette1",
    },
    colors: safeColors,
    labels: safeLabels,
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + "%";
      },
      style: {
        fontSize: "12px",
        fontWeight: "600",
        colors: isDark ? ["#e2e8f0"] : ["#1e293b"],
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 2,
        opacity: 0.5,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: type === "donut" ? "65%" : "0%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "14px",
              fontWeight: 600,
              color: isDark ? "#94a3b8" : "#64748b",
            },
            value: {
              show: true,
              fontSize: "24px",
              fontWeight: 700,
              color: isDark ? "#f8fafc" : "#0f172a",
              formatter: function (val: string) {
                return val;
              },
            },
            total: {
              show: true,
              showAlways: true,
              label: "Total",
              fontSize: "14px",
              fontWeight: 600,
              color: isDark ? "#94a3b8" : "#64748b",
              formatter: function (w: { globals: { seriesTotals: number[] } }) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0).toString();
              },
            },
          },
        },
      },
    },
    legend: {
      show: showLegend,
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "12px",
      fontFamily: "inherit",
      fontWeight: 500,
      labels: {
        colors: isDark ? "#94a3b8" : "#64748b",
      },
      markers: {
        size: 10,
        strokeWidth: 0,
        shape: "circle",
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5,
      },
    },
    tooltip: {
      enabled: true,
      theme: isDark ? "dark" : "light",
      fillSeriesColor: false,
      style: {
        fontSize: "12px",
      },
      y: {
        formatter: function (val: number) {
          const total = series.reduce((a, b) => a + b, 0);
          const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
          return `${val} (${percentage}%)`;
        },
      },
    },
    stroke: {
      show: true,
      colors: isDark ? ["#0a0a0a"] : ["#ffffff"],
      width: 2,
    },
    states: {
      hover: {
        filter: {
          type: "lighten",
        },
      },
      active: {
        filter: {
          type: "darken",
        },
      },
    },
  };

  if (isLoading || !mounted || !chartReady || !data) {
    return (
      <Card className={cn("dark:bg-[#0a0a0a]/80 bg-white border dark:border-emerald-500/10 border-slate-200", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[320px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={cn("dark:bg-[#0a0a0a]/80 bg-white border dark:border-emerald-500/10 border-slate-200", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium dark:text-slate-200 text-slate-800">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-dashed dark:border-slate-700 border-slate-200 flex items-center justify-center mb-4">
              <span className="text-4xl text-slate-300">0</span>
            </div>
            <p className="text-sm dark:text-slate-500 text-slate-400">
              {emptyMessage}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("dark:bg-[#0a0a0a]/80 bg-white border dark:border-emerald-500/10 border-slate-200", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium dark:text-slate-200 text-slate-800">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <Chart
            options={options}
            series={safeSeries}
            type={type}
            height={height}
          />
        </div>
      </CardContent>
    </Card>
  );
}
