"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { TimeSeriesData } from "@/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface BarChartWidgetProps {
  title: string;
  data: TimeSeriesData[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  color?: string;
  showGrid?: boolean;
}

/**
 * Widget de gráfico de barras para o dashboard analítico.
 * 
 * Exibe dados temporais em formato de barras verticais.
 */
export function BarChartWidget({
  title,
  data,
  isLoading = false,
  emptyMessage = "Sem dados",
  className,
  color = "#10b981",
  showGrid = true,
}: BarChartWidgetProps) {
  if (isLoading) {
    return (
      <Card className={cn("dark:bg-[#0a0a0a]/80 bg-white", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Estado vazio
  if (!data || data.length === 0) {
    return (
      <Card className={cn("dark:bg-[#0a0a0a]/80 bg-white", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium dark:text-slate-200 text-slate-800">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-sm dark:text-slate-500 text-slate-400">
              {emptyMessage}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("dark:bg-[#0a0a0a]/80 bg-white", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium dark:text-slate-200 text-slate-800">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              {showGrid && (
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148, 163, 184, 0.2)"
                  vertical={false}
                />
              )}
              <XAxis
                dataKey="date"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(148, 163, 184, 0.2)" }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="dark:bg-[#0a0a0a] bg-white border dark:border-emerald-500/20 border-slate-200 rounded-lg p-2 shadow-lg">
                        <p className="text-xs dark:text-slate-400 text-slate-500 mb-1">
                          {label}
                        </p>
                        <p className="text-sm font-medium dark:text-slate-200 text-slate-800">
                          {payload[0].value}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
