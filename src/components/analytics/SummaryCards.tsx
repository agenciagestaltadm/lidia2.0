"use client";

import { motion } from "framer-motion";
import { Users, UserCheck, Phone, UserPlus, Clock, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { SummaryMetrics } from "@/hooks/use-analytics";
import { Skeleton } from "@/components/ui/skeleton";

interface SummaryCardsProps {
  metrics: SummaryMetrics | undefined;
  isLoading?: boolean;
  className?: string;
}

/**
 * Componente de cards de resumo para o dashboard analítico.
 * 
 * Exibe métricas principais em cards com ícones e valores destacados.
 */
export function SummaryCards({ metrics, isLoading = false, className }: SummaryCardsProps) {
  const cards = [
    {
      title: "Total Atendimentos",
      value: metrics?.totalAttendances || 0,
      icon: Users,
      color: "#10b981",
      delay: 0,
    },
    {
      title: "Ativo",
      value: metrics?.active || 0,
      icon: UserCheck,
      color: "#3b82f6",
      delay: 0.1,
    },
    {
      title: "Receptivo",
      value: metrics?.receptive || 0,
      icon: Phone,
      color: "#8b5cf6",
      delay: 0.2,
    },
    {
      title: "Novos Contatos",
      value: metrics?.newContacts || 0,
      icon: UserPlus,
      color: "#f59e0b",
      delay: 0.3,
    },
    {
      title: "Tempo Médio de Atendimento (TMA)",
      value: metrics?.avgTMA || "0 min",
      icon: Clock,
      color: "#06b6d4",
      delay: 0.4,
      isTime: true,
    },
    {
      title: "Tempo Médio 1ª Resposta",
      value: metrics?.avgFirstResponse || "0 min",
      icon: Timer,
      color: "#ec4899",
      delay: 0.5,
      isTime: true,
    },
  ];

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="dark:bg-[#0a0a0a]/80 bg-white rounded-xl p-4 border dark:border-emerald-500/10 border-slate-200"
          >
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4", className)}>
      {cards.map((card) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: card.delay, duration: 0.3 }}
          className={cn(
            "relative overflow-hidden rounded-xl p-4",
            "dark:bg-[#0a0a0a]/80 bg-white",
            "border dark:border-emerald-500/10 border-slate-200",
            "transition-all duration-300 hover:shadow-lg",
            "group"
          )}
        >
          {/* Background gradient on hover */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
            style={{
              background: `linear-gradient(135deg, ${card.color}, transparent)`,
            }}
          />

          <div className="relative">
            {/* Value */}
            <div className="flex items-baseline gap-1 mb-1">
              {card.isTime ? (
                <span className="text-2xl font-bold dark:text-white text-slate-900">
                  {card.value}
                </span>
              ) : (
                <span className="text-2xl font-bold dark:text-white text-slate-900">
                  {typeof card.value === "number" ? card.value.toLocaleString("pt-BR") : card.value}
                </span>
              )}
            </div>

            {/* Title */}
            <p className="text-xs dark:text-slate-400 text-slate-500 leading-tight">
              {card.title}
            </p>

            {/* Icon */}
            <div
              className="absolute top-0 right-0 p-2 rounded-lg"
              style={{ backgroundColor: `${card.color}15` }}
            >
              <card.icon
                className="w-4 h-4"
                style={{ color: card.color }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
