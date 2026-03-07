"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { Webhook, CheckCircle, XCircle, RefreshCw, Copy, Eye, EyeOff, Key, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { useState } from "react";

// Mock API configurations
const apiConfigs = [
  { id: 1, company: "Empresa ABC Ltda", phoneNumberId: "123456789", businessAccountId: "BUS-123-ABC", status: "connected", lastSync: "2 min atrás", webhookUrl: "https://api.lidia.com/webhook/abc" },
  { id: 2, company: "Tech Solutions SA", phoneNumberId: "987654321", businessAccountId: "BUS-456-TECH", status: "connected", lastSync: "15 min atrás", webhookUrl: "https://api.lidia.com/webhook/tech" },
  { id: 3, company: "Comércio Silva", phoneNumberId: "111222333", businessAccountId: "BUS-789-SILVA", status: "error", lastSync: "3 horas atrás", webhookUrl: "https://api.lidia.com/webhook/silva" },
  { id: 4, company: "Mega Corp", phoneNumberId: "444555666", businessAccountId: "BUS-999-MEGA", status: "connected", lastSync: "5 min atrás", webhookUrl: "https://api.lidia.com/webhook/mega" },
];

export default function SuperApiWabaPage() {
  const [showTokens, setShowTokens] = useState<Record<number, boolean>>({});

  const toggleToken = (id: number) => {
    setShowTokens(prev => ({ ...prev, [id]: !prev[id] }));
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
            <GlowBadge variant="green">Integração</GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900">
            API WABA: Canal de Conexão
          </h1>
          <p className="dark:text-slate-400 text-slate-500 mt-1">
            Gerencie as configurações da API WhatsApp Business
          </p>
        </div>
        <NeonButton variant="green">
          <RefreshCw className="w-4 h-4 mr-2" />
          Sincronizar Todos
        </NeonButton>
      </motion.div>

      {/* Stats */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Conexões Ativas", value: "22", icon: CheckCircle },
          { label: "Com Erro", value: "2", icon: AlertTriangle },
          { label: "Total de Requisições", value: "45.2K", icon: Webhook },
          { label: "Taxa de Sucesso", value: "98.5%", icon: CheckCircle },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={fadeInUp} custom={index}>
              <GlassCard className="p-4" glow={index % 2 === 0 ? "green" : "none"}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="dark:text-slate-400 text-slate-500 text-xs">{stat.label}</p>
                    <p className="text-xl font-bold dark:text-white text-slate-900">{stat.value}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* API Configurations */}
      <motion.div variants={staggerContainer} className="space-y-4">
        {apiConfigs.map((config, index) => (
          <motion.div key={config.id} variants={fadeInUp} custom={index}>
            <GlassCard className="p-6" glow={config.status === "connected" ? "green" : "none"}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold dark:text-white text-slate-900">{config.company}</h3>
                    {config.status === "connected" ? (
                      <GlowBadge variant="green">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Conectado
                      </GlowBadge>
                    ) : (
                      <GlowBadge variant="default">
                        <XCircle className="w-3 h-3 mr-1" />
                        Erro
                      </GlowBadge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="dark:text-slate-500 text-slate-400">Phone Number ID</p>
                      <p className="dark:text-slate-300 text-slate-700 font-mono">{config.phoneNumberId}</p>
                    </div>
                    <div>
                      <p className="dark:text-slate-500 text-slate-400">Business Account ID</p>
                      <p className="dark:text-slate-300 text-slate-700 font-mono">{config.businessAccountId}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="dark:text-slate-500 text-slate-400">Webhook URL</p>
                      <div className="flex items-center gap-2">
                        <p className="text-emerald-400 font-mono text-xs">{config.webhookUrl}</p>
                        <button className="p-1 rounded dark:hover:bg-white/5 hover:bg-slate-100 dark:text-slate-400 text-slate-500 hover:text-emerald-400 transition-colors">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:flex-col lg:items-end">
                  <p className="text-xs dark:text-slate-500 text-slate-400">Última sincronização: {config.lastSync}</p>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg dark:hover:bg-white/5 hover:bg-slate-100 dark:text-slate-400 text-slate-500 hover:text-emerald-400 transition-colors">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg dark:hover:bg-white/5 hover:bg-slate-100 dark:text-slate-400 text-slate-500 hover:text-emerald-400 transition-colors">
                      <Key className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Token Section */}
              <div className="mt-4 pt-4 border-t dark:border-white/10 border-slate-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm dark:text-slate-500 text-slate-400">Access Token</p>
                  <button
                    onClick={() => toggleToken(config.id)}
                    className="p-1 rounded dark:hover:bg-white/5 hover:bg-slate-100 dark:text-slate-400 text-slate-500 hover:text-emerald-400 transition-colors"
                  >
                    {showTokens[config.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-sm font-mono dark:text-slate-300 text-slate-700 mt-1">
                  {showTokens[config.id] 
                    ? "EAAH2KZBX0J...8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5"
                    : "••••••••••••••••••••••••••••••••••••••••••••••••••"
                  }
                </p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
