"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Globe,
  Database,
  Mail,
  Save,
  Check,
  Moon,
  Sun,
  MessageSquare,
  ChevronDown,
  Webhook,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { AnimatedInput } from "@/components/ui/animated-input";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useWABAWebhook, buildWebhookUrl } from "@/hooks/use-waba-webhook";
import { useAuth } from "@/hooks/use-auth";
import { CopyToClipboardButton } from "@/components/ui/copy-to-clipboard-button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const settingSections = [
  { id: "general", label: "Geral", icon: Settings },
  { id: "notifications", label: "Notificações", icon: Bell },
  { id: "security", label: "Segurança", icon: Shield },
  { id: "appearance", label: "Aparência", icon: Palette },
  { id: "integrations", label: "Integrações", icon: Globe },
  { id: "data", label: "Dados", icon: Database },
];

// WhatsApp Business Integration Component
function WhatsAppBusinessIntegration() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<{
    id: string;
    webhookUrl: string;
    verifyToken: string;
    events: string[];
    accountUuid: string;
  } | null>(null);
  const [showToken, setShowToken] = useState(false);
  
  const {
    initializeWebhook,
    regenerateToken,
    updateWebhookEvents,
    getWebhookConfig,
    isLoading: hookLoading
  } = useWABAWebhook();

  const supabase = createClient();

  // Load or initialize webhook config
  useEffect(() => {
    const loadConfig = async () => {
      if (!user?.companyId) {
        console.log("No companyId available, skipping config load");
        return;
      }
      
      console.log("Loading webhook config for company:", user.companyId);
      setIsLoading(true);
      try {
        // Try to get existing config
        console.log("Fetching existing config...");
        const existingConfig = await getWebhookConfig(user.companyId);
        console.log("Existing config:", existingConfig);
        
        if (existingConfig) {
          console.log("Found existing config, setting state");
          // Always generate webhook URL dynamically based on current environment
          const dynamicWebhookUrl = existingConfig.account_uuid 
            ? buildWebhookUrl(existingConfig.account_uuid)
            : existingConfig.webhook_url;
          setConfig({
            id: existingConfig.id,
            webhookUrl: dynamicWebhookUrl,
            verifyToken: existingConfig.webhook_verify_token,
            events: existingConfig.webhook_events,
            accountUuid: existingConfig.account_uuid || ""
          });
        } else {
          console.log("No existing config found, creating new one...");
          // Create new config if none exists
          const insertData = {
            company_id: user.companyId,
            name: "Configuração Padrão",
            phone_number_id: "",
            business_account_id: "",
            access_token: "",
            status: "pending"
            // Not setting created_by to avoid FK constraint issues
          };
          console.log("Inserting config:", insertData);
          
          const { data: newConfig, error } = await supabase
            .from("waba_configs")
            .insert(insertData)
            .select()
            .single();

          if (error) {
            console.error("Error inserting config:", error);
            throw error;
          }
          
          console.log("New config created:", newConfig);

          // Initialize webhook
          console.log("Initializing webhook...");
          const result = await initializeWebhook(newConfig.id, user?.companyId || "");
          console.log("Webhook initialized:", result);
          
          if (result) {
            setConfig({
              id: newConfig.id,
              webhookUrl: result.webhookUrl,
              verifyToken: result.verifyToken,
              events: ["messages", "message_template_status_update", "account_alerts"],
              accountUuid: ""
            });
          }
        }
      } catch (error: unknown) {
        console.error("Error loading config:", error);
        if (error instanceof Error) {
          console.error("Error name:", error.name);
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        } else {
          console.error("Unknown error type:", typeof error);
          console.error("Error details:", JSON.stringify(error, null, 2));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [user?.companyId, user?.id]);

  const handleRegenerateToken = async () => {
    if (!config) return;
    const newToken = await regenerateToken(config.id);
    if (newToken) {
      setConfig(prev => prev ? { ...prev, verifyToken: newToken } : null);
    }
  };

  if (isLoading || hookLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* WhatsApp Business Header */}
      <div
        className="flex items-center justify-between p-4 rounded-xl dark:bg-white/5 bg-slate-100 cursor-pointer hover:dark:bg-white/10 hover:bg-slate-200 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#25D36620" }}
          >
            <MessageSquare className="w-6 h-6" style={{ color: "#25D366" }} />
          </div>
          <div>
            <h3 className="font-semibold dark:text-white text-slate-900">
              WhatsApp Business API
            </h3>
            <p className="text-sm dark:text-slate-400 text-slate-500">
              Configure webhooks e integração oficial com a Meta
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <GlowBadge variant="emerald">Oficial</GlowBadge>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 dark:text-slate-400 text-slate-500" />
          </motion.div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && config && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-6 space-y-6">
              {/* Webhook Configuration Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-semibold dark:text-white text-slate-900">
                    Configuração do Webhook
                  </h4>
                </div>
                
                <p className="text-sm dark:text-slate-400 text-slate-500">
                  Use estas informações para configurar o webhook no Facebook Developers.
                  O URL e o token são únicos para esta conta.
                </p>

                {/* Webhook URL */}
                <div className="space-y-2">
                  <label className="text-sm font-medium dark:text-slate-300 text-slate-700">
                    URL do Webhook
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 rounded-lg dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-200 font-mono text-sm dark:text-emerald-400 text-emerald-600 truncate">
                      {config.webhookUrl}
                    </div>
                    <CopyToClipboardButton
                      text={config.webhookUrl}
                      label="Copiar URL"
                      showLabel
                    />
                  </div>
                </div>

                {/* Verify Token */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium dark:text-slate-300 text-slate-700">
                      Token de Verificação
                    </label>
                    <button
                      onClick={handleRegenerateToken}
                      disabled={hookLoading}
                      className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", hookLoading && "animate-spin")} />
                      Gerar Novo Token
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 rounded-lg dark:bg-slate-800 bg-slate-100 border dark:border-slate-700 border-slate-200 font-mono text-sm dark:text-slate-300 text-slate-700">
                      {showToken ? config.verifyToken : "•".repeat(32)}
                    </div>
                    <button
                      onClick={() => setShowToken(!showToken)}
                      className="p-3 rounded-lg dark:bg-white/10 bg-slate-200 dark:text-slate-300 text-slate-600 hover:dark:bg-white/20 hover:bg-slate-300 transition-colors"
                      title={showToken ? "Ocultar" : "Mostrar"}
                    >
                      {showToken ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <CopyToClipboardButton
                      text={config.verifyToken}
                      label="Copiar Token"
                      isSensitive
                    />
                  </div>
                </div>
              </div>

              <div className="border-t dark:border-white/10 border-slate-200" />

              {/* Webhook Events Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-semibold dark:text-white text-slate-900">
                    Eventos do Webhook
                  </h4>
                </div>

                <p className="text-sm dark:text-slate-400 text-slate-500">
                  Este webhook está configurado para receber <strong>todos os eventos</strong> da API do WhatsApp Business.
                  Inclui mensagens recebidas, status de entrega, atualizações de templates e alertas da conta.
                </p>

                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-emerald-400">
                    Todos os eventos ativos - pronto para receber webhooks
                  </span>
                </div>
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-3 p-4 rounded-lg dark:bg-blue-500/10 bg-blue-50 border dark:border-blue-500/20 border-blue-200">
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-400">
                    Como configurar no Facebook Developers
                  </p>
                  <ol className="text-sm dark:text-slate-300 text-slate-600 list-decimal list-inside space-y-1">
                    <li>Acesse o painel de desenvolvedores do Facebook</li>
                    <li>Vá em WhatsApp &gt; Configuração &gt; Webhook</li>
                    <li>Cole a URL do webhook acima no campo "URL de callback"</li>
                    <li>Cole o token de verificação no campo "Token de verificação"</li>
                    <li>Clique em "Verificar e salvar"</li>
                    <li>Assine todos os campos de webhook disponíveis</li>
                  </ol>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
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
            <GlowBadge variant="green">Configurações</GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900">
            Configurações do Sistema
          </h1>
          <p className="dark:text-slate-400 text-slate-500 mt-1">
            Personalize suas preferências e configurações
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saved}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            saved
              ? 'bg-emerald-600 text-white cursor-not-allowed'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Salvo!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Alterações
            </>
          )}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <motion.div variants={fadeInUp} className="lg:col-span-1">
          <GlassCard className="p-2" hover={false}>
            <nav className="space-y-1">
              {settingSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                      activeSection === section.id
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "dark:text-slate-400 text-slate-600 dark:hover:bg-white/5 hover:bg-slate-100 dark:hover:text-slate-200 hover:text-slate-900"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </GlassCard>
        </motion.div>

        {/* Content */}
        <motion.div variants={fadeInUp} className="lg:col-span-3">
          <GlassCard className="p-6" hover={false}>
            {activeSection === "general" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold dark:text-white text-slate-900 mb-4">Configurações Gerais</h3>
                  <div className="space-y-4">
                    <AnimatedInput
                      label="Nome da Empresa"
                      defaultValue="Minha Empresa LTDA"
                    />
                    <AnimatedInput
                      label="E-mail de Contato"
                      defaultValue="contato@empresa.com"
                    />
                    <AnimatedInput
                      label="Telefone"
                      defaultValue="(11) 99999-9999"
                    />
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="dark:text-white text-slate-900 font-medium">Fuso Horário</p>
                        <p className="text-sm dark:text-slate-400 text-slate-500">América/São Paulo (GMT-3)</p>
                      </div>
                      <GlowBadge variant="default">Auto-detectado</GlowBadge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold dark:text-white text-slate-900 mb-4">Preferências de Notificação</h3>
                  <div className="space-y-4">
                    {[
                      { label: "Novos atendimentos", desc: "Receber notificação quando um novo atendimento for iniciado", defaultChecked: true },
                      { label: "Mensagens recebidas", desc: "Notificar quando houver novas mensagens", defaultChecked: true },
                      { label: "Negócios fechados", desc: "Alerta quando um negócio for fechado", defaultChecked: true },
                      { label: "Relatórios semanais", desc: "Enviar relatório de performance toda segunda", defaultChecked: false },
                      { label: "Novos usuários", desc: "Notificar quando um novo usuário for adicionado", defaultChecked: false },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start justify-between py-3 border-b dark:border-white/5 border-slate-200 last:border-0">
                        <div>
                          <p className="dark:text-white text-slate-900 font-medium">{item.label}</p>
                          <p className="text-sm dark:text-slate-400 text-slate-500">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked={item.defaultChecked} className="sr-only peer" />
                          <div className="w-11 h-6 dark:bg-slate-700 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold dark:text-white text-slate-900 mb-4">Segurança da Conta</h3>
                  <div className="space-y-4">
                    <AnimatedInput
                      label="Senha Atual"
                      type="password"
                      placeholder="••••••••"
                    />
                    <AnimatedInput
                      label="Nova Senha"
                      type="password"
                      placeholder="••••••••"
                    />
                    <AnimatedInput
                      label="Confirmar Nova Senha"
                      type="password"
                      placeholder="••••••••"
                    />
                    <div className="pt-4">
                      <p className="dark:text-white text-slate-900 font-medium mb-3">Autenticação de Dois Fatores</p>
                      <div className="flex items-center gap-4 p-4 rounded-lg dark:bg-white/5 bg-slate-100">
                        <Shield className="w-8 h-8 text-emerald-400" />
                        <div className="flex-1">
                          <p className="dark:text-white text-slate-900 font-medium">2FA Desativado</p>
                          <p className="text-sm dark:text-slate-400 text-slate-500">Adicione uma camada extra de segurança</p>
                        </div>
                        <button className="px-4 py-2 rounded-lg dark:bg-white/10 bg-slate-200 dark:text-white text-slate-700 dark:hover:bg-white/20 hover:bg-slate-300 transition-colors text-sm">
                          Ativar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "appearance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold dark:text-white text-slate-900 mb-4">Aparência</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="dark:text-white text-slate-900 font-medium mb-3">Tema</p>
                      <div className="grid grid-cols-3 gap-4">
                        <button className="p-4 rounded-lg bg-emerald-500/20 border-2 border-emerald-500 text-center">
                          <Moon className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                          <span className="text-sm dark:text-white text-slate-900">Escuro</span>
                        </button>
                        <button className="p-4 rounded-lg dark:bg-white/5 bg-slate-100 dark:border-white/10 border-slate-200 border text-center opacity-50">
                          <Sun className="w-6 h-6 dark:text-slate-400 text-slate-500 mx-auto mb-2" />
                          <span className="text-sm dark:text-slate-400 text-slate-500">Claro</span>
                        </button>
                        <button className="p-4 rounded-lg dark:bg-white/5 bg-slate-100 dark:border-white/10 border-slate-200 border text-center opacity-50">
                          <Palette className="w-6 h-6 dark:text-slate-400 text-slate-500 mx-auto mb-2" />
                          <span className="text-sm dark:text-slate-400 text-slate-500">Sistema</span>
                        </button>
                      </div>
                    </div>
                    <div className="pt-4">
                      <p className="dark:text-white text-slate-900 font-medium mb-3">Cor de Destaque</p>
                      <div className="flex gap-3">
                        {["#00f0ff", "#8b5cf6", "#d946ef", "#10b981", "#f59e0b"].map((color) => (
                          <button
                            key={color}
                            className={cn(
                              "w-10 h-10 rounded-full border-2 transition-all",
                              color === "#00f0ff" ? "border-white scale-110" : "border-transparent"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "integrations" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold dark:text-white text-slate-900 mb-4">
                    Integrações
                  </h3>
                  <p className="text-sm dark:text-slate-400 text-slate-500 mb-6">
                    Gerencie as integrações com serviços externos e APIs oficiais.
                  </p>
                  
                  {/* WhatsApp Business Integration */}
                  <WhatsAppBusinessIntegration />

                  {/* Other Integrations */}
                  <div className="mt-6 space-y-4">
                    <h4 className="font-medium dark:text-slate-300 text-slate-700">
                      Outras Integrações
                    </h4>
                    {[
                      { name: "E-mail SMTP", icon: Mail, status: "connected", color: "#EA4335" },
                      { name: "Google Calendar", icon: Globe, status: "disconnected", color: "#4285F4" },
                    ].map((integration) => {
                      const Icon = integration.icon;
                      return (
                        <div key={integration.name} className="flex items-center justify-between p-4 rounded-lg dark:bg-white/5 bg-slate-100">
                          <div className="flex items-center gap-4">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${integration.color}20` }}
                            >
                              <Icon className="w-5 h-5" style={{ color: integration.color }} />
                            </div>
                            <div>
                              <p className="dark:text-white text-slate-900 font-medium">{integration.name}</p>
                              <p className="text-sm dark:text-slate-400 text-slate-500">
                                {integration.status === "connected" ? "Conectado" : "Desconectado"}
                              </p>
                            </div>
                          </div>
                          <GlowBadge
                            variant={integration.status === "connected" ? "emerald" : "default"}
                          >
                            {integration.status === "connected" ? "Ativo" : "Inativo"}
                          </GlowBadge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeSection === "data" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold dark:text-white text-slate-900 mb-4">Gerenciamento de Dados</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg dark:bg-white/5 bg-slate-100">
                      <p className="dark:text-white text-slate-900 font-medium mb-2">Exportar Dados</p>
                      <p className="text-sm dark:text-slate-400 text-slate-500 mb-4">Faça download de todos os seus dados</p>
                      <div className="flex gap-3">
                        <button className="px-4 py-2 rounded-lg dark:bg-white/10 bg-slate-200 dark:text-white text-slate-700 dark:hover:bg-white/20 hover:bg-slate-300 transition-colors text-sm">Exportar CSV</button>
                        <button className="px-4 py-2 rounded-lg dark:bg-white/10 bg-slate-200 dark:text-white text-slate-700 dark:hover:bg-white/20 hover:bg-slate-300 transition-colors text-sm">Exportar JSON</button>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-red-400 font-medium mb-2">Zona de Perigo</p>
                      <p className="text-sm dark:text-slate-400 text-slate-500 mb-4">Ações irreversíveis para sua conta</p>
                      <button className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-sm">Excluir Conta</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
