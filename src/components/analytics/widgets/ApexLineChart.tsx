"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ApexOptions } from "apexcharts";

// Dynamic import to avoid SSR issues
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export interface ApexLineChartData {
  date: string;
  value: number;
  label?: string;
}

interface ApexLineChartProps {
  title: string;
  data: ApexLineChartData[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  color?: string;
  showArea?: boolean;
  height?: number;
  isDark?: boolean;
}

/**
 * Widget de gráfico de linha/área moderno usando ApexCharts.
 * 
 * Features:
 * - Animações suaves
 * - Zoom e pan habilitados
 * - Tooltips interativos ricos
 * - Temas dark/light
 * - Gradiente de área opcional
 */
export function ApexLineChart({
  title,
  data,
  isLoading = false,
  emptyMessage = "Sem dados disponíveis",
  className,
  color = "#10b981",
  showArea = true,
  height = 350,
  isDark = false,
}: ApexLineChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const categories = data.map((item) => item.date);
  const series = data.map((item) => item.value);

  const options: ApexOptions = {
    chart: {
      type: showArea ? "area" : "line",
      fontFamily: "inherit",
      background: "transparent",
      toolbar: {
        show: true,
        tools: {
          download: false,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      zoom: {
        enabled: true,
        type: "x",
        autoScaleYaxis: true,
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
    colors: [color],
    stroke: {
      curve: "smooth",
      width: 3,
    },
    fill: showArea
      ? {
          type: "gradient",
          gradient: {
            shadeIntensity: 0.3,
            opacityFrom: 0.5,
            opacityTo: 0.05,
            stops: [0, 90, 100],
          },
        }
      : undefined,
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: isDark ? "#94a3b8" : "#64748b",
          fontSize: "11px",
        },
        rotate: -45,
        rotateAlways: categories.length > 7,
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
      tooltip: {
        enabled: true,
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
    markers: {
      size: 5,
      colors: [color],
      strokeColors: isDark ? "#0a0a0a" : "#ffffff",
      strokeWidth: 2,
      hover: {
        size: 7,
      },
    },
    tooltip: {
      enabled: true,
      theme: isDark ? "dark" : "light",
      style: {
        fontSize: "12px",
      },
      x: {
        show: true,
        format: "dd MMM",
      },
      y: {
        formatter: function (val: number) {
          return val.toLocaleString("pt-BR");
        },
      },
      marker: {
        show: true,
      },
    },
    legend: {
      show: false,
    },
  };

  const chartSeries = [
    {
      name: title,
      data: series,
    },
  ];

  if (isLoading || !mounted) {
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

  if (!data || data.length === 0) {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
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
            type={showArea ? "area" : "line"}
            height={height}
          />
        </div>
      </CardContent>
    </Card>
  );
}
