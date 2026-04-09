"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import {
  Plug,
  Smartphone,
  MessageCircle,
  Webhook,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  QrCode,
  Loader2,
  AlertCircle,
  Mail,
  Trash2,
  Power,
  Plus,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useChannels } from "@/hooks/use-channels";
import { useWhatsAppSessions } from "@/hooks/use-whatsapp-sessions";
import { ConnectionTypeModal } from "@/components/connection/ConnectionTypeModal";
import { CreateQRSessionModal } from "@/components/connection/CreateQRSessionModal";
import { CreateWABAConnectionModal } from "@/components/connection/CreateWABAConnectionModal";
import { useRouter } from "next/navigation";
import type { WhatsAppSession } from "@/types/whatsapp";

const statusConfig = {
  CONNECTED: { label: "Conectado", color: "bg-emerald-500", icon: CheckCircle, textColor: "dark:text-emerald-400 text-emerald-600", badge: "green" as const },
  DISCONNECTED: { label: "Desconectado", color: "bg-slate-500", icon: XCircle, textColor: "dark:text-slate-400 text-slate-500", badge: "default" as const },
  ERROR: { label: "Erro", color: "bg-red-500", icon: AlertCircle, textColor: "dark:text-red-400 text-red-500", badge: "red" as const },
};

const typeConfig = {
  WHATSAPP: { label: "WhatsApp", icon: MessageCircle, color: "text-green-400" },
  EMAIL: { label: "E-mail", icon: Mail, color: "text-blue-400" },
  SMS: { label: "SMS", icon: Smartphone, color: "text-purple-400" },
  OTHER: { label: "Outro", icon: Webhook, color: "text-slate-400" },
};

const whatsappStatusConfig = {
  active: { label: "Ativo", color: "bg-emerald-500", textColor: "dark:text-emerald-400 text-emerald-600", badge: "green" as const },
  connected: { label: "Conectado", color: "bg-emerald-500", textColor: "dark:text-emerald-400 text-emerald-600", badge: "green" as const },
  connecting: { label: "Conectando", color: "bg-amber-500", textColor: "dark:text-amber-400 text-amber-600", badge: "yellow" as const },
  waiting_qr: { label: "Aguardando QR", color: "bg-blue-500", textColor: "dark:text-blue-400 text-blue-600", badge: "blue" as const },
  creating: { label: "Criando", color: "bg-slate-500", textColor: "dark:text-slate-400 text-slate-500", badge: "default" as const },
  disconnected: { label: "Desconectado", color: "bg-slate-500", textColor: "dark:text-slate-400 text-slate-500", badge: "default" as const },
  error: { label: "Erro", color: "bg-red-500", textColor: "dark:text-red-400 text-red-600", badge: "red" as const },
};

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <motion.div 
      variants={staggerContainer}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {[1, 2, 3].map((i) => (
        <motion.div key={i} variants={fadeInUp}>
          <GlassCard className="p-5">
            <div className="animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded w-24"></div>
                    <div className="h-3 bg-slate-700/20 dark:bg-slate-700/20 bg-slate-100 rounded w-16"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-700/20 dark:bg-slate-700/20 bg-slate-100 rounded w-full"></div>
                <div className="h-3 bg-slate-700/20 dark:bg-slate-700/20 bg-slate-100 rounded w-3/4"></div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
}

// Error state component
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div variants={fadeInUp}>
      <GlassCard className="p-8 text-center" hover={false}>
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">Erro ao carregar conexões</h3>
        <p className="dark:text-slate-400 text-slate-600 mb-4">{error}</p>
        <button 
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
        >
          Tentar novamente
        </button>
      </GlassCard>
    </motion.div>
  );
}

// Empty state component
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div variants={fadeInUp}>
      <GlassCard className="p-8 text-center" hover={false}>
        <Plug className="w-12 h-12 mx-auto mb-4 dark:text-slate-600 text-slate-400" />
        <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">Nenhuma conexão configurada</h3>
        <p className="dark:text-slate-400 text-slate-600 mb-4">
          Configure seus canais de comunicação para começar
        </p>
        <button 
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors mx-auto"
        >
          <QrCode className="w-4 h-4" />
          Nova Conexão
        </button>
      </GlassCard>
    </motion.div>
  );
}

export default function ConnectionPage() {
  const router = useRouter();
  const { channels, loading: channelsLoading, error: channelsError, refetch: refetchChannels } = useChannels();
  const { sessions, loading: sessionsLoading, error: sessionsError, refetch: refetchSessions, createSession, deleteSession } = useWhatsAppSessions();
  
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [createdSession, setCreatedSession] = useState<WhatsAppSession | null>(null);

  const loading = channelsLoading || sessionsLoading;
  const error = channelsError || sessionsError;

  // Calculate statistics
  const stats = useMemo(() => {
    const totalChannels = channels.length;
    const totalSessions = sessions.length;
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const connectedChannels = channels.filter(c => c.status === "CONNECTED").length;
    
    return { 
      total: totalChannels + totalSessions, 
      connected: connectedChannels + activeSessions,
      whatsappSessions: totalSessions,
      whatsappChannels: totalChannels
    };
  }, [channels, sessions]);

  // Format relative time
  const formatRelativeTime = (dateString: string | null): string => {
    if (!dateString) return "Nunca";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  const handleCreateSession = async (name: string) => {
    const session = await createSession({ name });
    if (session) {
      setCreatedSession(session);
    }
    return session;
  };

  const handleSelectQR = () => {
    setShowTypeModal(false);
    setShowQRModal(true);
  };

  const [showWABAModal, setShowWABAModal] = useState(false);

  const handleSelectOfficial = () => {
    setShowTypeModal(false);
    setShowWABAModal(true);
  };

  const handleCloseWABAModal = () => {
    setShowWABAModal(false);
    refetchChannels();
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
    setCreatedSession(null);
    refetchSessions();
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm("Tem certeza que deseja excluir esta conexão?")) {
      await deleteSession(sessionId);
    }
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
            <GlowBadge variant="green">Canal de Conexão</GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900">
            Gerenciar Conexões
          </h1>
          <p className="dark:text-slate-400 text-slate-600 mt-1">
            Configure e monitore seus canais de comunicação
          </p>
        </div>
        <button 
          onClick={() => setShowTypeModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
        >
          <QrCode className="w-4 h-4" />
          Nova Conexão
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Conexões Ativas", value: stats.connected, icon: Plug, color: "dark:text-emerald-400 text-emerald-600" },
          { label: "WhatsApp QR", value: stats.whatsappSessions, icon: QrCode, color: "dark:text-blue-400 text-blue-600" },
          { label: "WhatsApp API", value: stats.whatsappChannels, icon: MessageCircle, color: "dark:text-green-400 text-green-600" },
          { label: "Total", value: stats.total, icon: Webhook, color: "dark:text-slate-400 text-slate-500" },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={fadeInUp} custom={index}>
              <GlassCard className="p-4" glow="green">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg dark:bg-white/5 bg-slate-100">
                    <Icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                  <div>
                    <p className="dark:text-slate-400 text-slate-500 text-xs">{stat.label}</p>
                    <p className="text-xl font-bold dark:text-white text-slate-900">
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin inline" />
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* WhatsApp QR Sessions Section */}
      {sessions.length > 0 && (
        <motion.div variants={fadeInUp}>
          <h2 className="text-lg font-semibold dark:text-white text-slate-900 mb-4">
            WhatsApp QR Code
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => {
              const status = whatsappStatusConfig[session.status] || whatsappStatusConfig.disconnected;
              const StatusIcon = CheckCircle;

              return (
                <motion.div
                  key={session.id}
                  variants={fadeInUp}
                >
                  <GlassCard 
                    className="p-5" 
                    glow={session.status === "active" ? "green" : "none"}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          session.status === "active" ? "dark:bg-emerald-500/20 bg-emerald-100" : 
                          session.status === "error" ? "dark:bg-red-500/20 bg-red-100" : 
                          "dark:bg-slate-500/20 bg-slate-100"
                        )}>
                          <QrCode className={cn("w-6 h-6", 
                            session.status === "active" ? "text-emerald-500" :
                            session.status === "error" ? "text-red-500" :
                            "text-slate-500"
                          )} />
                        </div>
                        <div>
                          <h3 className="font-medium dark:text-white text-slate-900">{session.name}</h3>
                          <div className="flex items-center gap-1 text-sm">
                            <div className={cn("w-2 h-2 rounded-full", status.color)} />
                            <span className={status.textColor}>{status.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {session.phone_number && (
                        <div className="flex items-center justify-between">
                          <span className="dark:text-slate-400 text-slate-500">Número</span>
                          <span className="dark:text-slate-300 text-slate-700">{session.phone_number}</span>
                        </div>
                      )}
                      {session.push_name && (
                        <div className="flex items-center justify-between">
                          <span className="dark:text-slate-400 text-slate-500">Nome</span>
                          <span className="dark:text-slate-300 text-slate-700">{session.push_name}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="dark:text-slate-400 text-slate-500">Token</span>
                        <span className="dark:text-slate-300 text-slate-700 font-mono text-xs">
                          {session.token.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="dark:text-slate-400 text-slate-500">Última conexão</span>
                        <span className="dark:text-slate-300 text-slate-700">
                          {formatRelativeTime(session.last_connected_at || null)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t dark:border-white/5 border-slate-200">
                      {session.status !== "active" && (
                        <button 
                          onClick={() => {
                            setCreatedSession(session);
                            setShowQRModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg dark:bg-emerald-500/10 bg-emerald-50 dark:text-emerald-400 text-emerald-600 hover:dark:bg-emerald-500/20 hover:bg-emerald-100 transition-colors text-sm"
                        >
                          <Power className="w-4 h-4" />
                          Conectar
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteSession(session.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg dark:bg-red-500/10 bg-red-50 dark:text-red-400 text-red-600 hover:dark:bg-red-500/20 hover:bg-red-100 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Traditional Channels Section */}
      {channels.length > 0 && (
        <motion.div variants={fadeInUp}>
          <h2 className="text-lg font-semibold dark:text-white text-slate-900 mb-4">
            Canais de Integração
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((channel) => {
              const status = statusConfig[channel.status];
              const type = typeConfig[channel.type];
              const StatusIcon = status.icon;
              const TypeIcon = type.icon;

              return (
                <motion.div
                  key={channel.id}
                  variants={fadeInUp}
                >
                  <GlassCard className="p-5" glow={channel.status === "CONNECTED" ? "green" : "none"}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          channel.status === "CONNECTED" ? "dark:bg-emerald-500/20 bg-emerald-100" : 
                          channel.status === "ERROR" ? "dark:bg-red-500/20 bg-red-100" : 
                          "dark:bg-slate-500/20 bg-slate-100"
                        )}>
                          <TypeIcon className={cn("w-6 h-6", type.color)} />
                        </div>
                        <div>
                          <h3 className="font-medium dark:text-white text-slate-900">{channel.name}</h3>
                          <div className="flex items-center gap-1 text-sm">
                            <StatusIcon className={cn("w-3 h-3", status.textColor)} />
                            <span className={status.textColor}>{status.label}</span>
                          </div>
                        </div>
                      </div>
                      <button className="p-2 rounded-lg hover:dark:bg-white/5 hover:bg-slate-100 dark:text-slate-400 text-slate-500 transition-colors">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="dark:text-slate-400 text-slate-500">Tipo</span>
                        <span className="dark:text-slate-300 text-slate-700">{type.label}</span>
                      </div>
                      
                      {channel.company && (
                        <div className="flex items-center justify-between">
                          <span className="dark:text-slate-400 text-slate-500">Empresa</span>
                          <span className="dark:text-slate-300 text-slate-700">{channel.company.name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="dark:text-slate-400 text-slate-500">Última sincronização</span>
                        <span className="dark:text-slate-300 text-slate-700">
                          {formatRelativeTime(channel.last_connected_at)}
                        </span>
                      </div>

                      {channel.last_error && (
                        <div className="mt-2 p-2 rounded-lg dark:bg-red-500/10 bg-red-50 border dark:border-red-500/20 border-red-200">
                          <p className="text-xs dark:text-red-400 text-red-600 truncate" title={channel.last_error}>
                            {channel.last_error}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t dark:border-white/5 border-slate-200">
                      <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg dark:bg-white/5 bg-slate-100 dark:text-slate-300 text-slate-600 hover:dark:bg-white/10 hover:bg-slate-200 transition-colors text-sm">
                        <RefreshCw className="w-4 h-4" />
                        Sincronizar
                      </button>
                      <button className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm",
                        channel.status === "CONNECTED" 
                          ? "dark:bg-red-500/10 bg-red-50 dark:text-red-400 text-red-600 hover:dark:bg-red-500/20 hover:bg-red-100"
                          : "dark:bg-emerald-500/10 bg-emerald-50 dark:text-emerald-400 text-emerald-600 hover:dark:bg-emerald-500/20 hover:bg-emerald-100"
                      )}>
                        {channel.status === "CONNECTED" ? (
                          <>
                            <XCircle className="w-4 h-4" />
                            Desconectar
                          </>
                        ) : (
                          <>
                            <Plug className="w-4 h-4" />
                            Conectar
                          </>
                        )}
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && !error && channels.length === 0 && sessions.length === 0 && (
        <EmptyState onCreate={() => setShowTypeModal(true)} />
      )}

      {/* Error State */}
      {error && (
        <ErrorState error={error} onRetry={() => {
          refetchChannels();
          refetchSessions();
        }} />
      )}

      {/* Loading */}
      {loading && <LoadingSkeleton />}

      {/* Modals */}
      <ConnectionTypeModal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        onSelectQR={handleSelectQR}
        onSelectOfficial={handleSelectOfficial}
      />

      <CreateQRSessionModal
        isOpen={showQRModal}
        onClose={handleCloseQRModal}
        session={createdSession}
        onCreateSession={handleCreateSession}
      />

      <CreateWABAConnectionModal
        isOpen={showWABAModal}
        onClose={handleCloseWABAModal}
        onSuccess={refetchChannels}
      />
    </motion.div>
  );
}
