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
  QrCode
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Mock data for connections
const connections = [
  { 
    id: 1, 
    name: "WhatsApp Business", 
    type: "whatsapp",
    status: "connected",
    phone: "+55 (11) 99999-9999",
    lastSync: "2 min atrás"
  },
  { 
    id: 2, 
    name: "API WABA", 
    type: "waba",
    status: "connected",
    phone: "+55 (11) 98888-8888",
    lastSync: "5 min atrás"
  },
  { 
    id: 3, 
    name: "Webhook Integração", 
    type: "webhook",
    status: "disconnected",
    phone: null,
    lastSync: "Nunca"
  },
];

const statusConfig = {
  connected: { label: "Conectado", color: "bg-emerald-500", icon: CheckCircle, textColor: "text-emerald-400" },
  disconnected: { label: "Desconectado", color: "bg-red-500", icon: XCircle, textColor: "text-red-400" },
};

export default function ConnectionPage() {
  const [showQRModal, setShowQRModal] = useState(false);

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
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Gerenciar Conexões
          </h1>
          <p className="text-slate-400 mt-1">
            Configure e monitore seus canais de comunicação
          </p>
        </div>
        <NeonButton variant="green" onClick={() => setShowQRModal(true)}>
          <QrCode className="w-4 h-4 mr-2" />
          Nova Conexão
        </NeonButton>
      </motion.div>

      {/* Stats */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Conexões Ativas", value: "2", icon: Plug, color: "text-emerald-400" },
          { label: "WhatsApp", value: "1", icon: MessageCircle, color: "text-green-400" },
          { label: "API WABA", value: "1", icon: Smartphone, color: "text-blue-400" },
          { label: "Webhooks", value: "0", icon: Webhook, color: "text-slate-400" },
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

      {/* Connections List */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {connections.map((connection, index) => {
          const status = statusConfig[connection.status as keyof typeof statusConfig];
          const StatusIcon = status.icon;
          
          return (
            <motion.div
              key={connection.id}
              variants={fadeInUp}
              custom={index}
            >
              <GlassCard className="p-5" glow={connection.status === "connected" ? "green" : "none"}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", connection.status === "connected" ? "bg-emerald-500/20" : "bg-red-500/20")}>
                      {connection.type === "whatsapp" ? (
                        <MessageCircle className="w-6 h-6 text-green-400" />
                      ) : connection.type === "waba" ? (
                        <Smartphone className="w-6 h-6 text-blue-400" />
                      ) : (
                        <Webhook className="w-6 h-6 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{connection.name}</h3>
                      <div className="flex items-center gap-1 text-sm">
                        <StatusIcon className={cn("w-3 h-3", status.textColor)} />
                        <span className={status.textColor}>{status.label}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2 text-sm">
                  {connection.phone && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Smartphone className="w-4 h-4" />
                      <span>{connection.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-400">
                    <RefreshCw className="w-4 h-4" />
                    <span>Última sincronização: {connection.lastSync}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10">
                  {connection.status === "connected" ? (
                    <NeonButton variant="ghost" size="sm" className="w-full">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sincronizar
                    </NeonButton>
                  ) : (
                    <NeonButton variant="green" size="sm" className="w-full">
                      <Plug className="w-4 h-4 mr-2" />
                      Conectar
                    </NeonButton>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* QR Code Modal Placeholder */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <GlassCard className="p-6 max-w-sm w-full mx-4" glow="green">
            <h2 className="text-lg font-semibold text-white mb-4 text-center">
              Conectar WhatsApp
            </h2>
            <div className="aspect-square bg-white rounded-lg flex items-center justify-center mb-4">
              <QrCode className="w-32 h-32 text-black" />
            </div>
            <p className="text-sm text-slate-400 text-center mb-4">
              Escaneie o QR code com seu WhatsApp para conectar
            </p>
            <NeonButton 
              variant="ghost" 
              className="w-full"
              onClick={() => setShowQRModal(false)}
            >
              Fechar
            </NeonButton>
          </GlassCard>
        </div>
      )}
    </motion.div>
  );
}
