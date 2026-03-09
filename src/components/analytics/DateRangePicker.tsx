"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DateRange } from "@/hooks/use-analytics";

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  onGenerate: () => void;
  className?: string;
}

/**
 * Componente de seleção de período para o dashboard analítico.
 * 
 * Permite selecionar data de início e fim, com botão para gerar o relatório.
 */
export function DateRangePicker({
  value,
  onChange,
  onGenerate,
  className,
}: DateRangePickerProps) {
  const [startDate, setStartDate] = useState(format(value.startDate, "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(value.endDate, "yyyy-MM-dd"));

  const handleGenerate = () => {
    onChange({
      startDate: new Date(startDate + "T00:00:00"),
      endDate: new Date(endDate + "T23:59:59"),
    });
    onGenerate();
  };

  const handleReset = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);
    
    setStartDate(format(sevenDaysAgo, "yyyy-MM-dd"));
    setEndDate(format(today, "yyyy-MM-dd"));
    
    onChange({
      startDate: sevenDaysAgo,
      endDate: today,
    });
  };

  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      {/* Data Início */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={cn(
              "w-40 px-3 py-2 text-sm rounded-lg border bg-transparent",
              "dark:border-emerald-500/20 border-slate-200",
              "dark:text-slate-200 text-slate-700",
              "focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
              "transition-all duration-200"
            )}
          />
          <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 text-slate-400 pointer-events-none" />
        </div>

        <span className="text-sm dark:text-slate-400 text-slate-500">até</span>

        {/* Data Fim */}
        <div className="relative">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={cn(
              "w-40 px-3 py-2 text-sm rounded-lg border bg-transparent",
              "dark:border-emerald-500/20 border-slate-200",
              "dark:text-slate-200 text-slate-700",
              "focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
              "transition-all duration-200"
            )}
          />
          <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 dark:text-slate-500 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Botão Reset */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        className="dark:border-emerald-500/30 border-emerald-200 dark:text-emerald-400 text-emerald-600"
      >
        <RotateCcw className="w-4 h-4 mr-1" />
        Últimos 7 dias
      </Button>

      {/* Botão Gerar */}
      <Button
        size="sm"
        onClick={handleGenerate}
        className="bg-emerald-500 hover:bg-emerald-600 text-white"
      >
        GERAR
      </Button>
    </div>
  );
}

/**
 * Hook helper para gerenciar o estado do DateRangePicker
 */
export function useDateRangePicker(defaultDays = 7): {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  handleGenerate: () => void;
  lastGenerated: DateRange | null;
} {
  const today = new Date();
  const defaultStart = new Date();
  defaultStart.setDate(today.getDate() - (defaultDays - 1));

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: defaultStart,
    endDate: today,
  });

  const [lastGenerated, setLastGenerated] = useState<DateRange | null>(null);

  const handleGenerate = () => {
    setLastGenerated(dateRange);
  };

  return {
    dateRange,
    setDateRange,
    handleGenerate,
    lastGenerated,
  };
}
