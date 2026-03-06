"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Save, Check, Database, Shield, Globe, Mail, Bell, Loader2, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { useSystemSettings } from "@/hooks/use-system-settings";

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <motion.div variants={staggerContainer} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <motion.div key={i} variants={fadeInUp}>
          <GlassCard className="p-6" hover={false}>
            <div className="animate-pulse">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200"></div>
                <div className="h-5 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded w-32"></div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-3 bg-slate-700/20 dark:bg-slate-700/20 bg-slate-100 rounded w-20"></div>
                    <div className="h-10 bg-slate-700/20 dark:bg-slate-700/20 bg-slate-100 rounded"></div>
                  </div>
                ))}
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
        <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">Erro ao carregar configurações</h3>
        <p className="dark:text-slate-400 text-slate-600 mb-4">{error}</p>
        <NeonButton variant="green" onClick={onRetry}>
          Tentar novamente
        </NeonButton>
      </GlassCard>
    </motion.div>
  );
}

export default function SuperSettingsPage() {
  const { settings, loading, error, refetch, updateMultipleSettings } = useSystemSettings();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Local state for form values
  const [formData, setFormData] = useState({
    app_name: "",
    api_url: "",
    timezone: "",
    smtp_host: "",
    smtp_port: "",
    smtp_email: "",
    backup_frequency: "",
    backup_retention_days: "",
  });

  // Toggle states
  const [toggles, setToggles] = useState({
    require_2fa: false,
    block_suspicious_ips: true,
    single_session: false,
    notify_new_company: true,
    notify_api_error: true,
    notify_payment: true,
    notify_suspicious_login: true,
    notify_backup_complete: false,
    notify_user_limit: true,
  });

  // Sync form data with settings from hook
  useEffect(() => {
    if (settings) {
      setFormData({
        app_name: settings.app_name || "",
        api_url: settings.api_url || "",
        timezone: settings.timezone || "",
        smtp_host: settings.smtp_host || "",
        smtp_port: settings.smtp_port || "",
        smtp_email: settings.smtp_email || "",
        backup_frequency: settings.backup_frequency || "",
        backup_retention_days: settings.backup_retention_days || "",
      });
      
      setToggles({
        require_2fa: settings.require_2fa === "true",
        block_suspicious_ips: settings.block_suspicious_ips === "true",
        single_session: settings.single_session === "true",
        notify_new_company: settings.notify_new_company === "true",
        notify_api_error: settings.notify_api_error === "true",
        notify_payment: settings.notify_payment === "true",
        notify_suspicious_login: settings.notify_suspicious_login === "true",
        notify_backup_complete: settings.notify_backup_complete === "true",
        notify_user_limit: settings.notify_user_limit === "true",
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    
    const updates: Record<string, string> = {
      ...formData,
      ...Object.fromEntries(
        Object.entries(toggles).map(([key, value]) => [key, String(value)])
      ),
    };
    
    const result = await updateMultipleSettings(updates);
    
    setSaving(false);
    
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateToggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6"
      >
        {/* Header skeleton */}
        <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded w-20 mb-2"></div>
            <div className="h-8 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded w-48"></div>
          </div>
        </motion.div>
        <LoadingSkeleton />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6"
      >
        <motion.div variants={fadeInUp}>
          <ErrorState error={error} onRetry={refetch} />
        </motion.div>
      </motion.div>
    );
  }

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
          <h1 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900">
            Configurações de Tudo
          </h1>
          <p className="dark:text-slate-400 text-slate-600 mt-1">
            Configure todas as opções do sistema
          </p>
        </div>
        <NeonButton 
          variant="green" 
          onClick={handleSave}
          disabled={saving || saved}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Salvo!
            </>
          ) : saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
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
              <div className="p-2 rounded-lg dark:bg-emerald-500/10 bg-emerald-100">
                <Settings className="w-5 h-5 dark:text-emerald-400 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold dark:text-white text-slate-900">Configurações Gerais</h3>
            </div>
            <div className="space-y-4">
              <AnimatedInput
                label="Nome da Aplicação"
                value={formData.app_name}
                onChange={(e) => updateFormData("app_name", e.target.value)}
              />
              <AnimatedInput
                label="URL da API"
                value={formData.api_url}
                onChange={(e) => updateFormData("api_url", e.target.value)}
              />
              <AnimatedInput
                label="Timezone Padrão"
                value={formData.timezone}
                onChange={(e) => updateFormData("timezone", e.target.value)}
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Security Settings */}
        <motion.div variants={fadeInUp}>
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg dark:bg-emerald-500/10 bg-emerald-100">
                <Shield className="w-5 h-5 dark:text-emerald-400 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold dark:text-white text-slate-900">Segurança</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b dark:border-white/5 border-slate-200">
                <div>
                  <p className="dark:text-white text-slate-900 font-medium">Autenticação 2FA Obrigatória</p>
                  <p className="text-sm dark:text-slate-400 text-slate-500">Exigir 2FA para todos os usuários</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={toggles.require_2fa}
                    onChange={() => updateToggle("require_2fa")}
                  />
                  <div className="w-11 h-6 dark:bg-slate-700 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3 border-b dark:border-white/5 border-slate-200">
                <div>
                  <p className="dark:text-white text-slate-900 font-medium">Bloquear IPs Suspeitos</p>
                  <p className="text-sm dark:text-slate-400 text-slate-500">Ativar proteção contra ataques</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={toggles.block_suspicious_ips}
                    onChange={() => updateToggle("block_suspicious_ips")}
                  />
                  <div className="w-11 h-6 dark:bg-slate-700 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="dark:text-white text-slate-900 font-medium">Sessão Única por Dispositivo</p>
                  <p className="text-sm dark:text-slate-400 text-slate-500">Limitar login a um dispositivo</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={toggles.single_session}
                    onChange={() => updateToggle("single_session")}
                  />
                  <div className="w-11 h-6 dark:bg-slate-700 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Database Settings */}
        <motion.div variants={fadeInUp}>
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg dark:bg-emerald-500/10 bg-emerald-100">
                <Database className="w-5 h-5 dark:text-emerald-400 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold dark:text-white text-slate-900">Banco de Dados</h3>
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-lg dark:bg-white/5 bg-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="dark:text-white text-slate-900 font-medium">Backup Automático</span>
                  <GlowBadge variant="green">Ativo</GlowBadge>
                </div>
                <p className="text-sm dark:text-slate-400 text-slate-500">
                  Último backup: {settings?.last_backup ? new Date(settings.last_backup).toLocaleString("pt-BR") : "Hoje, 03:00"}
                </p>
              </div>
              <AnimatedInput
                label="Frequência de Backup"
                value={formData.backup_frequency}
                onChange={(e) => updateFormData("backup_frequency", e.target.value)}
              />
              <AnimatedInput
                label="Retenção (dias)"
                value={formData.backup_retention_days}
                onChange={(e) => updateFormData("backup_retention_days", e.target.value)}
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Email Settings */}
        <motion.div variants={fadeInUp}>
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg dark:bg-emerald-500/10 bg-emerald-100">
                <Mail className="w-5 h-5 dark:text-emerald-400 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold dark:text-white text-slate-900">E-mail</h3>
            </div>
            <div className="space-y-4">
              <AnimatedInput
                label="SMTP Host"
                value={formData.smtp_host}
                onChange={(e) => updateFormData("smtp_host", e.target.value)}
              />
              <AnimatedInput
                label="SMTP Port"
                value={formData.smtp_port}
                onChange={(e) => updateFormData("smtp_port", e.target.value)}
              />
              <AnimatedInput
                label="E-mail de Envio"
                value={formData.smtp_email}
                onChange={(e) => updateFormData("smtp_email", e.target.value)}
              />
            </div>
          </GlassCard>
        </motion.div>

        {/* Notifications Settings */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg dark:bg-emerald-500/10 bg-emerald-100">
                <Bell className="w-5 h-5 dark:text-emerald-400 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold dark:text-white text-slate-900">Notificações do Sistema</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "notify_new_company", label: "Nova empresa cadastrada", desc: "Notificar quando uma empresa se registrar" },
                { key: "notify_api_error", label: "Erro na API WABA", desc: "Alertar sobre falhas de conexão" },
                { key: "notify_payment", label: "Pagamento recebido", desc: "Confirmar recebimento de assinatura" },
                { key: "notify_suspicious_login", label: "Tentativa de login suspeita", desc: "Avisar sobre acessos não reconhecidos" },
                { key: "notify_backup_complete", label: "Backup concluído", desc: "Confirmar sucesso do backup" },
                { key: "notify_user_limit", label: "Limite de usuários atingido", desc: "Alertar quando empresa atingir limite" },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between p-3 rounded-lg dark:bg-white/5 bg-slate-100">
                  <div>
                    <p className="dark:text-white text-slate-900 font-medium text-sm">{item.label}</p>
                    <p className="text-xs dark:text-slate-400 text-slate-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={toggles[item.key as keyof typeof toggles]}
                      onChange={() => updateToggle(item.key as keyof typeof toggles)}
                    />
                    <div className="w-9 h-5 dark:bg-slate-700 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
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
