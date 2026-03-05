"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Search,
  Filter,
  Clock,
  CheckCircle,
  MoreVertical,
  Phone,
  Mail,
  User
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Mock data for attendances
const attendances = [
  { 
    id: 1, 
    customer: "João Silva", 
    channel: "WhatsApp",
    status: "open",
    priority: "high",
    lastMessage: "Olá, preciso de ajuda com meu pedido",
    time: "2 min atrás",
    unread: 3
  },
  { 
    id: 2, 
    customer: "Maria Santos", 
    channel: "Email",
    status: "waiting",
    priority: "medium",
    lastMessage: "Aguardando retorno sobre orçamento",
    time: "15 min atrás",
    unread: 0
  },
  { 
    id: 3, 
    customer: "Pedro Costa", 
    channel: "WhatsApp",
    status: "open",
    priority: "low",
    lastMessage: "Quero saber mais sobre os planos",
    time: "1 hora atrás",
    unread: 1
  },
  { 
    id: 4, 
    customer: "Ana Oliveira", 
    channel: "Telefone",
    status: "closed",
    priority: "high",
    lastMessage: "Problema resolvido, obrigada!",
    time: "2 horas atrás",
    unread: 0
  },
];

const statusConfig = {
  open: { label: "Em Aberto", color: "bg-emerald-500", textColor: "text-emerald-400" },
  waiting: { label: "Aguardando", color: "bg-amber-500", textColor: "text-amber-400" },
  closed: { label: "Fechado", color: "bg-slate-500", textColor: "text-slate-400" },
};

const priorityConfig = {
  high: { label: "Alta", color: "bg-red-500" },
  medium: { label: "Média", color: "bg-amber-500" },
  low: { label: "Baixa", color: "bg-emerald-500" },
};

export default function AttendancesPage() {
  const [filter, setFilter] = useState<"all" | "open" | "waiting" | "closed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAttendances = attendances.filter(a => {
    const matchesFilter = filter === "all" || a.status === filter;
    const matchesSearch = a.customer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GlowBadge variant="green">Atendimentos</GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Central de Atendimentos
          </h1>
          <p className="text-slate-400 mt-1">
            Gerencie todas as conversas com seus clientes
          </p>
        </div>
        <NeonButton variant="green">
          <MessageSquare className="w-4 h-4 mr-2" />
          Novo Atendimento
        </NeonButton>
      </motion.div>

      {/* Stats */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Em Aberto", value: "12", icon: MessageSquare, color: "text-emerald-400" },
          { label: "Aguardando", value: "5", icon: Clock, color: "text-amber-400" },
          { label: "Fechados Hoje", value: "24", icon: CheckCircle, color: "text-emerald-400" },
          { label: "Total", value: "156", icon: User, color: "text-slate-400" },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={fadeInUp} custom={index}>
              <GlassCard className="p-4" glow="green">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">{stat.label}</p>
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="p-4" hover={false}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <AnimatedInput
                placeholder="Buscar atendimentos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5 text-slate-400" />}
              />
            </div>
            <div className="flex gap-2">
              {["all", "open", "waiting", "closed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    filter === status
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/5 text-slate-400 hover:bg-white/10"
                  )}
                >
                  {status === "all" ? "Todos" : status === "open" ? "Abertos" : status === "waiting" ? "Aguardando" : "Fechados"}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Attendances List */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="overflow-hidden" hover={false}>
          <div className="divide-y divide-white/5">
            {filteredAttendances.map((attendance, index) => {
              const status = statusConfig[attendance.status as keyof typeof statusConfig];
              const priority = priorityConfig[attendance.priority as keyof typeof priorityConfig];
              
              return (
                <motion.div
                  key={attendance.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-medium">
                      {attendance.customer.split(" ").map(n => n[0]).join("")}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white">{attendance.customer}</h3>
                            <span className={cn("text-xs px-2 py-0.5 rounded-full", status.textColor, "bg-white/5")}>
                              {status.label}
                            </span>
                            <span className={cn("w-2 h-2 rounded-full", priority.color)} title={`Prioridade: ${priority.label}`} />
                          </div>
                          <p className="text-sm text-slate-400 mt-1 truncate">
                            {attendance.lastMessage}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              {attendance.channel === "WhatsApp" ? <MessageSquare className="w-3 h-3" /> :
                               attendance.channel === "Email" ? <Mail className="w-3 h-3" /> :
                               <Phone className="w-3 h-3" />}
                              {attendance.channel}
                            </span>
                            <span>{attendance.time}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {attendance.unread > 0 && (
                            <span className="bg-emerald-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                              {attendance.unread}
                            </span>
                          )}
                          <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
