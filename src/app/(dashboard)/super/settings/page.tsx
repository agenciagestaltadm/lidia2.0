"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Check, Database, Shield, Globe, Mail, Bell } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { staggerContainer, fadeInUp } from "@/lib/animations";

export default function SuperSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
            <GlowBadge variant="green">Sistema</GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Configurações de Tudo
          </h1>
          <p className="text-slate-400 mt-1">
            Configure todas as opções do sistema
          </p>
        </div>
        <NeonButton 
          variant={saved ? "green" : "green"} 
          onClick={handleSave}
          disabled={saved}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Salvo!
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </NeonButton>
      </motion.div>

      {/* Settings Grid */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <motion.div variants={fadeInUp}>
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Settings className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Configurações Gerais</h3>
            </div>
            <div className="space-y-4">
              <AnimatedInput
                label="Nome da Aplicação"
                defaultValue="LIDIA CRM"
              />
              <AnimatedInput
                label="URL da API"
                defaultValue="https://api.lidia.com"
              />
              <AnimatedInput
                label="Timezone Padrão"
                defaultValue="America/Sao_Paulo"
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Security Settings */}
        <motion.div variants={fadeInUp}>
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Segurança</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <p className="text-white font-medium">Autenticação 2FA Obrigatória</p>
                  <p className="text-sm text-slate-400">Exigir 2FA para todos os usuários</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <p className="text-white font-medium">Bloquear IPs Suspeitos</p>
                  <p className="text-sm text-slate-400">Ativar proteção contra ataques</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white font-medium">Sessão Única por Dispositivo</p>
                  <p className="text-sm text-slate-400">Limitar login a um dispositivo</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Database Settings */}
        <motion.div variants={fadeInUp}>
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Database className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Banco de Dados</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">Backup Automático</span>
                  <GlowBadge variant="green">Ativo</GlowBadge>
                </div>
                <p className="text-sm text-slate-400">Último backup: Hoje, 03:00</p>
              </div>
              <AnimatedInput
                label="Frequência de Backup"
                defaultValue="Diário"
              />
              <AnimatedInput
                label="Retenção (dias)"
                defaultValue="30"
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Email Settings */}
        <motion.div variants={fadeInUp}>
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Mail className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">E-mail</h3>
            </div>
            <div className="space-y-4">
              <AnimatedInput
                label="SMTP Host"
                defaultValue="smtp.lidia.com"
              />
              <AnimatedInput
                label="SMTP Port"
                defaultValue="587"
              />
              <AnimatedInput
                label="E-mail de Envio"
                defaultValue="noreply@lidia.com"
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Notifications Settings */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Bell className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Notificações do Sistema</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Nova empresa cadastrada", desc: "Notificar quando uma empresa se registrar", checked: true },
                { label: "Erro na API WABA", desc: "Alertar sobre falhas de conexão", checked: true },
                { label: "Pagamento recebido", desc: "Confirmar recebimento de assinatura", checked: true },
                { label: "Tentativa de login suspeita", desc: "Avisar sobre acessos não reconhecidos", checked: true },
                { label: "Backup concluído", desc: "Confirmar sucesso do backup", checked: false },
                { label: "Limite de usuários atingido", desc: "Alertar quando empresa atingir limite", checked: true },
              ].map((item, i) => (
                <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <p className="text-white font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
