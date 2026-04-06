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

export interface ApexBarChartData {
  category: string;
  value: number;
  color?: string;
}

interface ApexBarChartProps {
  title: string;
  data: ApexBarChartData[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  color?: string;
  horizontal?: boolean;
  height?: number;
  isDark?: boolean;
}

/**
 * Widget de gráfico de barras moderno usando ApexCharts.
 * 
 * Features:
 * - Barras verticais ou horizontais
 * - Animações suaves
 * - Tooltips interativos
 * - Temas dark/light
 * - Cores gradientes
 */
export function ApexBarChart({
  title,
  data,
  isLoading = false,
  emptyMessage = "Sem dados disponíveis",
  className,
  color = "#10b981",
  horizontal = false,
  height = 350,
  isDark = false,
}: ApexBarChartProps) {
  const [mounted, setMounted] = useState(false);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Wait for next tick to ensure ApexCharts is ready
    const timer = setTimeout(() => setChartReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const safeData = Array.isArray(data) ? data : [];
  const categories = safeData.length > 0 ? safeData.map((item) => item.category) : [];
  const series = safeData.length > 0 ? safeData.map((item) => item.value) : [];
  const colors = safeData.length > 0 ? safeData.map((item) => item.color || color) : [color];

  // Garante que temos dados válidos para o gráfico
  const safeCategories = categories.length > 0 ? categories : ["Sem dados"];
  const safeSeries = series.length > 0 ? series : [0];
  const safeColors = colors.length > 0 ? colors : [color];

  const options: ApexOptions = {
    chart: {
      type: "bar",
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
    plotOptions: {
      bar: {
        horizontal: horizontal,
        borderRadius: horizontal ? 0 : 4,
        borderRadiusApplication: "end",
        columnWidth: "60%",
        distributed: data.some((item) => item.color),
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toLocaleString("pt-BR");
      },
      offsetY: -20,
      style: {
        fontSize: "11px",
        colors: isDark ? ["#94a3b8"] : ["#64748b"],
      },
    },
    stroke: {
      show: true,
      width: 0,
      colors: ["transparent"],
    },
    xaxis: {
      categories: safeCategories,
      labels: {
        style: {
          colors: isDark ? "#94a3b8" : "#64748b",
          fontSize: "11px",
        },
        rotate: horizontal ? 0 : -45,
        rotateAlways: !horizontal && categories.length > 7,
      },
      axisBorder: {
        show: true,
        color: isDark ? "rgba(148, 163, 184, 0.2)" : "rgba(148, 163, 184, 0.3)",
      },
      axisTicks: {
        show: false,
      },
      crosshairs: {
        show: true,
        stroke: {
          color: color,
          width: 1,
          dashArray: 3,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark ? "#94a3b8" : "#64748b",
          fontSize: "11px",
        },
        formatter: function (val: number) {
          return val.toLocaleString("pt-BR");
        },
      },
    },
    grid: {
      borderColor: isDark ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)",
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.3,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.7,
        stops: [0, 100],
      },
    },
    tooltip: {
      enabled: true,
      theme: isDark ? "dark" : "light",
      style: {
        fontSize: "12px",
      },
      y: {
        formatter: function (val: number) {
          return val.toLocaleString("pt-BR");
        },
      },
    },
    legend: {
      show: false,
    },
  };

  const chartSeries = [
    {
      name: title,
      data: safeSeries,
    },
  ];

  if (isLoading || !mounted || !chartReady || !data) {
    return (
      <Card className={cn("dark:bg-[#0a0a0a]/80 bg-white border dark:border-emerald-500/10 border-slate-200", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
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
          <div className="h-[350px] flex flex-col items-center justify-center">
            <div className="w-48 h-32 border-2 border-dashed dark:border-slate-700 border-slate-200 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
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
        <div className="h-[350px]">
          <Chart
            options={options}
            series={chartSeries}
            type="bar"
            height={height}
          />
        </div>
      </CardContent>
    </Card>
  );
}
