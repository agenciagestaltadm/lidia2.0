"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { cn } from "@/lib/utils";
import { PieChartData } from "@/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PieChartWidgetProps {
  title: string;
  data: PieChartData[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * Widget de gráfico de pizza para o dashboard analítico.
 * 
 * Exibe dados em formato circular com legenda e tooltips.
 */
export function PieChartWidget({
  title,
  data,
  isLoading = false,
  emptyMessage = "Sem dados",
  className,
}: PieChartWidgetProps) {
  if (isLoading) {
    return (
      <Card className={cn("dark:bg-[#0a0a0a]/80 bg-white", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
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
          <div className="h-[250px] flex items-center justify-center">
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
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={(entry: any) => entry?.payload?.percentage ? `${entry.payload.percentage}%` : ""}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as PieChartData;
                    return (
                      <div className="dark:bg-[#0a0a0a] bg-white border dark:border-emerald-500/20 border-slate-200 rounded-lg p-2 shadow-lg">
                        <p className="text-sm font-medium dark:text-slate-200 text-slate-800">
                          {data.name}
                        </p>
                        <p className="text-sm dark:text-slate-400 text-slate-500">
                          {data.value} ({data.percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-xs dark:text-slate-400 text-slate-500">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

const CHART_COLORS = [
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#64748b",
];
