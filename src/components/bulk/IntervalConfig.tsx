"use client";

import { Clock, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface IntervalConfigProps {
  minSeconds: number;
  maxSeconds: number;
  onChange: (min: number, max: number) => void;
}

export function IntervalConfig({ minSeconds, maxSeconds, onChange }: IntervalConfigProps) {
  const handleMinChange = (value: number) => {
    if (value >= 1 && value <= maxSeconds) {
      onChange(value, maxSeconds);
    }
  };

  const handleMaxChange = (value: number) => {
    if (value >= minSeconds && value <= 300) {
      onChange(minSeconds, value);
    }
  };

  const estimatedTime = {
    min: Math.ceil(minSeconds / 60),
    max: Math.ceil(maxSeconds / 60),
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg dark:bg-white/5 bg-slate-100">
            <Clock className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="font-medium dark:text-white text-slate-900">
              Intervalo entre mensagens
            </h4>
            <p className="text-sm dark:text-slate-400 text-slate-500">
              Tempo aleatório entre cada envio
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
              Mínimo (segundos)
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={maxSeconds}
                value={minSeconds}
                onChange={(e) => handleMinChange(parseInt(e.target.value) || 1)}
                className={cn(
                  "w-full px-4 py-2 rounded-lg dark:bg-white/5 bg-slate-100",
                  "dark:border-white/10 border-slate-200 border",
                  "dark:text-white text-slate-900",
                  "focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50",
                  "transition-all"
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm dark:text-slate-500 text-slate-400">
                s
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
              Máximo (segundos)
            </label>
            <div className="relative">
              <input
                type="number"
                min={minSeconds}
                max={300}
                value={maxSeconds}
                onChange={(e) => handleMaxChange(parseInt(e.target.value) || minSeconds)}
                className={cn(
                  "w-full px-4 py-2 rounded-lg dark:bg-white/5 bg-slate-100",
                  "dark:border-white/10 border-slate-200 border",
                  "dark:text-white text-slate-900",
                  "focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50",
                  "transition-all"
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm dark:text-slate-500 text-slate-400">
                s
              </span>
            </div>
          </div>
        </div>

        {/* Visual slider */}
        <div className="mt-4">
          <div className="h-2 rounded-full dark:bg-white/10 bg-slate-200 relative">
            <div 
              className="absolute h-full rounded-full bg-emerald-500/50"
              style={{
                left: `${(minSeconds / 300) * 100}%`,
                right: `${100 - (maxSeconds / 300) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs dark:text-slate-500 text-slate-400">
            <span>1s</span>
            <span>150s</span>
            <span>300s</span>
          </div>
        </div>
      </GlassCard>

      <div className="flex items-start gap-2 p-3 rounded-lg dark:bg-blue-500/10 bg-blue-50 border dark:border-blue-500/30 border-blue-200">
        <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="dark:text-blue-300 text-blue-700 font-medium">
            Tempo estimado por mensagem
          </p>
          <p className="dark:text-blue-400/80 text-blue-600">
            Entre {estimatedTime.min} e {estimatedTime.max} minutos para cada mensagem
          </p>
          <p className="dark:text-blue-400/60 text-blue-500 text-xs mt-1">
            Intervalos aleatórios ajudam a evitar bloqueios
          </p>
        </div>
      </div>
    </div>
  );
}
