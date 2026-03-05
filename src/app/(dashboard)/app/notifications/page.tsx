"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  Check,
  Trash2,
  MessageSquare,
  User,
  TrendingUp,
  AlertCircle,
  Filter,
  CheckCheck
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

// Mock data for notifications
const initialNotifications = [
  { 
    id: 1, 
    title: "Novo atendimento", 
    message: "Maria Silva iniciou um novo atendimento",
    type: "info",
    time: "2 min atrás",
    read: false,
    icon: MessageSquare
  },
  { 
    id: 2, 
    title: "Negócio fechado!", 
    message: "Parabéns! O negócio 'Projeto Alpha' foi fechado com sucesso",
    type: "success",
    time: "15 min atrás",
    read: false,
    icon: TrendingUp
  },
  { 
    id: 3, 
    title: "Novo usuário", 
    message: "Pedro Lima foi adicionado à equipe",
    type: "info",
    time: "1 hora atrás",
    read: true,
    icon: User
  },
  { 
    id: 4, 
    title: "Meta atingida", 
    message: "Você atingiu 90% da meta mensal de conversão",
    type: "success",
    time: "2 horas atrás",
    read: true,
    icon: TrendingUp
  },
  { 
    id: 5, 
    title: "Alerta de sistema", 
    message: "Atualização de segurança disponível",
    type: "warning",
    time: "3 horas atrás",
    read: true,
    icon: AlertCircle
  },
  { 
    id: 6, 
    title: "Campanha enviada", 
    message: "A campanha 'Promoção Verão' foi enviada para 1.250 contatos",
    type: "info",
    time: "5 horas atrás",
    read: true,
    icon: MessageSquare
  },
];

const typeConfig = {
  info: { color: "emerald", bgColor: "bg-emerald-500/10", iconColor: "text-emerald-400" },
  success: { color: "emerald", bgColor: "bg-emerald-500/10", iconColor: "text-emerald-400" },
  warning: { color: "amber", bgColor: "bg-amber-500/10", iconColor: "text-amber-400" },
  error: { color: "red", bgColor: "bg-red-500/10", iconColor: "text-red-400" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications = notifications.filter(n => 
    filter === "all" || !n.read
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

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
            <GlowBadge variant="green" pulse={unreadCount > 0}>
              {unreadCount} não lidas
            </GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Notificações
          </h1>
          <p className="text-slate-400 mt-1">
            Gerencie suas notificações e alertas do sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm"
          >
            <CheckCheck className="w-4 h-4" />
            Marcar todas como lidas
          </button>
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Limpar
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="p-2" hover={false}>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1",
                filter === "all"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-transparent text-slate-400 hover:bg-white/5"
              )}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1",
                filter === "unread"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-transparent text-slate-400 hover:bg-white/5"
              )}
            >
              Não Lidas
            </button>
          </div>
        </GlassCard>
      </motion.div>

      {/* Notifications List */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="overflow-hidden" hover={false}>
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y divide-white/5">
                {filteredNotifications.map((notification, index) => {
                  const Icon = notification.icon;
                  const config = typeConfig[notification.type as keyof typeof typeConfig];
                  
                  return (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "p-4 hover:bg-white/[0.02] transition-colors group",
                        !notification.read && "bg-emerald-500/5"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                          config.bgColor
                        )}>
                          <Icon className={cn("w-5 h-5", config.iconColor)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={cn(
                                "font-medium",
                                !notification.read ? "text-white" : "text-slate-300"
                              )}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-slate-400 mt-0.5">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-500 mt-2">
                                {notification.time}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.read && (
                                <button
                                    onClick={() => markAsRead(notification.id)}
                                    className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-emerald-400 transition-colors"
                                    title="Marcar como lida"
                                  >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-400">Nenhuma notificação encontrada</p>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
