"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { 
  Send, 
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  FileText,
  Target,
  Settings,
  Check
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCompanies } from "@/hooks/use-companies";
import { 
  useCampaigns, 
  useCreateCampaign, 
  useStartCampaign,
  usePauseCampaign,
  useCancelCampaign,
  useCampaignProgress 
} from "@/hooks/use-campaigns";
import { WABASelector } from "@/components/bulk/WABASelector";
import { ContactSelector } from "@/components/bulk/ContactSelector";
import { TemplateSelector } from "@/components/bulk/TemplateSelector";
import { IntervalConfig } from "@/components/bulk/IntervalConfig";
import type { WABAConfig } from "@/types/waba";
import type { WABATemplate } from "@/types/waba";
import type { ContactSelectionMode, CSVContact } from "@/types/campaigns";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Status config for campaigns
const statusConfig = {
  draft: { label: "Rascunho", color: "bg-slate-500", icon: FileText },
  scheduled: { label: "Agendada", color: "bg-blue-500", icon: Clock },
  running: { label: "Em Execução", color: "bg-amber-500", icon: Play },
  paused: { label: "Pausada", color: "bg-orange-500", icon: Pause },
  completed: { label: "Concluída", color: "bg-emerald-500", icon: CheckCircle },
  cancelled: { label: "Cancelada", color: "bg-red-500", icon: X },
  failed: { label: "Falhou", color: "bg-red-600", icon: AlertCircle },
};

// Wizard steps
const steps = [
  { id: 'waba', label: 'Instância WABA', icon: Target },
  { id: 'contacts', label: 'Destinatários', icon: Users },
  { id: 'message', label: 'Mensagem', icon: MessageSquare },
  { id: 'interval', label: 'Intervalo', icon: Settings },
  { id: 'review', label: 'Revisar', icon: Check },
];

export default function BulkPage() {
  const { user } = useAuth();
  const { companies } = useCompanies();
  const companyId = user?.companyId;
  
  // Fetch campaigns
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns(companyId);
  
  // Campaign mutations
  const createCampaign = useCreateCampaign();
  const startCampaign = useStartCampaign();
  const pauseCampaign = usePauseCampaign();
  const cancelCampaign = useCancelCampaign();

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [selectedWABA, setSelectedWABA] = useState<string | null>(null);
  const [wabaConfig, setWABAConfig] = useState<WABAConfig | null>(null);
  const [contactMode, setContactMode] = useState<ContactSelectionMode>('manual');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<CSVContact[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateConfig, setTemplateConfig] = useState<WABATemplate | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [useTemplate, setUseTemplate] = useState(true);
  const [minInterval, setMinInterval] = useState(5);
  const [maxInterval, setMaxInterval] = useState(15);

  // Reset form
  const resetForm = () => {
    setCampaignName("");
    setSelectedWABA(null);
    setWABAConfig(null);
    setContactMode('manual');
    setSelectedContactIds([]);
    setCsvData([]);
    setSelectedTemplate(null);
    setTemplateConfig(null);
    setCustomMessage("");
    setUseTemplate(true);
    setMinInterval(5);
    setMaxInterval(15);
    setCurrentStep(0);
  };

  // Handle wizard open/close
  const openWizard = () => {
    resetForm();
    setShowWizard(true);
  };

  const closeWizard = () => {
    setShowWizard(false);
    resetForm();
  };

  // Navigation
  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'waba':
        return !!selectedWABA;
      case 'contacts':
        if (contactMode === 'manual') return selectedContactIds.length > 0;
        if (contactMode === 'csv') return csvData.length > 0;
        return true; // 'all' mode
      case 'message':
        return useTemplate ? !!selectedTemplate : customMessage.trim().length > 0;
      case 'interval':
        return minInterval > 0 && maxInterval >= minInterval;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1 && canProceed()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submit campaign
  const submitCampaign = async () => {
    if (!companyId || !user?.id) return;

    try {
      await createCampaign.mutateAsync({
        name: campaignName,
        waba_config_id: selectedWABA!,
        contact_selection_mode: contactMode,
        selected_contact_ids: contactMode === 'manual' ? selectedContactIds : undefined,
        csv_data: contactMode === 'csv' ? csvData : undefined,
        template_id: useTemplate ? selectedTemplate! : undefined,
        custom_message: !useTemplate ? customMessage : undefined,
        min_interval_seconds: minInterval,
        max_interval_seconds: maxInterval,
        company_id: companyId,
        created_by: user.id,
      });

      closeWizard();
    } catch (error) {
      console.error('Error creating campaign:', error);
    }
  };

  // Get recipient count
  const getRecipientCount = () => {
    if (contactMode === 'manual') return selectedContactIds.length;
    if (contactMode === 'csv') return csvData.length;
    return campaigns?.[0]?.total_recipients || 0; // Estimate for 'all'
  };

  // Render wizard step content
  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'waba':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white text-slate-900">
              Selecione a Instância WABA
            </h3>
            <p className="dark:text-slate-400 text-slate-500">
              Escolha qual instância do WhatsApp Business API será usada para enviar as mensagens.
            </p>
            <WABASelector
              companyId={companyId}
              value={selectedWABA}
              onChange={(id, config) => {
                setSelectedWABA(id);
                setWABAConfig(config);
              }}
              required
            />
          </div>
        );

      case 'contacts':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white text-slate-900">
              Selecione os Destinatários
            </h3>
            <p className="dark:text-slate-400 text-slate-500">
              Escolha como deseja selecionar os contatos para esta campanha.
            </p>
            <ContactSelector
              companyId={companyId}
              mode={contactMode}
              selectedIds={selectedContactIds}
              csvData={csvData}
              onChange={(mode, ids, csv) => {
                setContactMode(mode);
                if (ids) setSelectedContactIds(ids);
                if (csv) setCsvData(csv);
              }}
            />
          </div>
        );

      case 'message':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white text-slate-900">
              Escolha a Mensagem
            </h3>
            <p className="dark:text-slate-400 text-slate-500">
              Selecione um template aprovado ou escreva uma mensagem personalizada.
            </p>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setUseTemplate(true)}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                  useTemplate
                    ? "bg-emerald-500 text-white"
                    : "dark:bg-white/5 bg-slate-100 dark:text-slate-300 text-slate-600"
                )}
              >
                Usar Template
              </button>
              <button
                onClick={() => setUseTemplate(false)}
                className={cn(
                  "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                  !useTemplate
                    ? "bg-emerald-500 text-white"
                    : "dark:bg-white/5 bg-slate-100 dark:text-slate-300 text-slate-600"
                )}
              >
                Mensagem Personalizada
              </button>
            </div>

            {useTemplate ? (
              <TemplateSelector
                configId={selectedWABA!}
                value={selectedTemplate}
                onChange={(id, template) => {
                  setSelectedTemplate(id);
                  setTemplateConfig(template);
                }}
              />
            ) : (
              <div>
                <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                  Mensagem
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Digite sua mensagem aqui..."
                  rows={6}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg dark:bg-white/5 bg-slate-100",
                    "dark:border-white/10 border-slate-200 border",
                    "dark:text-white text-slate-900 dark:placeholder:text-slate-500 placeholder:text-slate-400",
                    "focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50",
                    "transition-all resize-none"
                  )}
                />
                <div className="flex justify-between mt-2 text-xs dark:text-slate-500 text-slate-400">
                  <span>{customMessage.length} caracteres</span>
                  <span>Limite: 4096</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'interval':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold dark:text-white text-slate-900">
              Configure o Intervalo
            </h3>
            <p className="dark:text-slate-400 text-slate-500">
              Defina o tempo de espera aleatório entre cada mensagem enviada.
            </p>
            <IntervalConfig
              minSeconds={minInterval}
              maxSeconds={maxInterval}
              onChange={(min, max) => {
                setMinInterval(min);
                setMaxInterval(max);
              }}
            />
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold dark:text-white text-slate-900">
              Revisar Campanha
            </h3>
            
            <div className="space-y-4">
              <GlassCard className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-medium dark:text-white text-slate-900">
                    Instância WABA
                  </h4>
                </div>
                <p className="dark:text-slate-300 text-slate-700">
                  {wabaConfig?.name}
                </p>
                <p className="text-sm dark:text-slate-500 text-slate-500">
                  ID: {wabaConfig?.phone_number_id}
                </p>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-medium dark:text-white text-slate-900">
                    Destinatários
                  </h4>
                </div>
                <p className="dark:text-slate-300 text-slate-700">
                  {contactMode === 'all' && 'Todos os contatos'}
                  {contactMode === 'manual' && `${selectedContactIds.length} contatos selecionados`}
                  {contactMode === 'csv' && `${csvData.length} contatos do CSV`}
                </p>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-medium dark:text-white text-slate-900">
                    Mensagem
                  </h4>
                </div>
                <p className="dark:text-slate-300 text-slate-700">
                  {useTemplate 
                    ? `Template: ${templateConfig?.name}`
                    : 'Mensagem personalizada'
                  }
                </p>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Settings className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-medium dark:text-white text-slate-900">
                    Intervalo
                  </h4>
                </div>
                <p className="dark:text-slate-300 text-slate-700">
                  Entre {minInterval}s e {maxInterval}s entre mensagens
                </p>
              </GlassCard>
            </div>
          </div>
        );

      default:
        return null;
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
            <GlowBadge variant="green">Disparo Bulk</GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900">
            Disparo em Massa
          </h1>
          <p className="dark:text-slate-400 text-slate-500 mt-1">
            Envie mensagens para múltiplos contatos via WhatsApp Business API
          </p>
        </div>
        <NeonButton variant="green" onClick={openWizard}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </NeonButton>
      </motion.div>

      {/* Stats */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {campaignsLoading ? (
          [1, 2, 3, 4].map((i) => (
            <GlassCard key={i} className="p-4 animate-pulse">
              <div className="h-8 bg-slate-700/30 rounded" />
            </GlassCard>
          ))
        ) : (
          [
            { 
              label: "Campanhas", 
              value: campaigns?.length || 0, 
              icon: Send 
            },
            { 
              label: "Em Execução", 
              value: campaigns?.filter(c => c.status === 'running').length || 0, 
              icon: Play 
            },
            { 
              label: "Concluídas", 
              value: campaigns?.filter(c => c.status === 'completed').length || 0, 
              icon: CheckCircle 
            },
            { 
              label: "Taxa de Entrega", 
              value: "94%", 
              icon: MessageSquare 
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} variants={fadeInUp} custom={index}>
                <GlassCard className="p-4" glow="green">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg dark:bg-white/5 bg-slate-100">
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
          })
        )}
      </motion.div>

      {/* Campaign List */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="overflow-hidden" hover={false}>
          <div className="p-4 border-b dark:border-white/10 border-slate-200">
            <h2 className="text-lg font-semibold dark:text-white text-slate-900">
              Campanhas
            </h2>
          </div>
          
          {campaignsLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="divide-y dark:divide-white/5 divide-slate-100">
              {campaigns.map((campaign, index) => {
                const status = statusConfig[campaign.status];
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 dark:hover:bg-white/[0.02] hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full ${status.color} flex items-center justify-center`}>
                          <StatusIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium dark:text-white text-slate-900">
                            {campaign.name}
                          </h3>
                          <p className="text-sm dark:text-slate-400 text-slate-500">
                            {format(new Date(campaign.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm dark:text-slate-400 text-slate-500">Destinatários</p>
                          <p className="dark:text-white text-slate-900 font-medium">
                            {campaign.total_recipients}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm dark:text-slate-400 text-slate-500">Enviadas</p>
                          <p className="text-emerald-400 font-medium">
                            {campaign.sent_count}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm dark:text-slate-400 text-slate-500">Status</p>
                          <GlowBadge 
                            variant={
                              campaign.status === 'completed' ? 'green' :
                              campaign.status === 'running' ? 'default' :
                              campaign.status === 'failed' ? 'red' :
                              'default'
                            }
                          >
                            {status.label}
                          </GlowBadge>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Send className="w-12 h-12 mx-auto mb-3 dark:text-slate-600 text-slate-400" />
              <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">
                Nenhuma campanha
              </h3>
              <p className="dark:text-slate-400 text-slate-500 mb-4">
                Crie sua primeira campanha de disparo em massa
              </p>
              <NeonButton variant="green" onClick={openWizard}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Campanha
              </NeonButton>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            <GlassCard className="h-full flex flex-col" hover={false}>
              {/* Wizard Header */}
              <div className="p-6 border-b dark:border-white/10 border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold dark:text-white text-slate-900">
                    Nova Campanha
                  </h2>
                  <button
                    onClick={closeWizard}
                    className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;

                    return (
                      <div key={step.id} className="flex items-center">
                        <div
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                            isActive && "bg-emerald-500/20",
                            isCompleted && "opacity-50"
                          )}
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              isActive
                                ? "bg-emerald-500 text-white"
                                : isCompleted
                                ? "bg-emerald-500/50 text-white"
                                : "dark:bg-white/10 bg-slate-200 dark:text-slate-400 text-slate-500"
                            )}
                          >
                            {isCompleted ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <StepIcon className="w-4 h-4" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-sm font-medium hidden md:block",
                              isActive
                                ? "dark:text-white text-slate-900"
                                : "dark:text-slate-400 text-slate-500"
                            )}
                          >
                            {step.label}
                          </span>
                        </div>
                        {index < steps.length - 1 && (
                          <ChevronRight className="w-4 h-4 dark:text-slate-600 text-slate-300 mx-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Wizard Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {currentStep === 0 && (
                  <AnimatedInput
                    label="Nome da Campanha"
                    placeholder="Ex: Promoção de Verão"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="mb-6"
                  />
                )}
                {renderStepContent()}
              </div>

              {/* Wizard Footer */}
              <div className="p-6 border-t dark:border-white/10 border-slate-200 flex justify-between">
                <NeonButton
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Anterior
                </NeonButton>

                {currentStep < steps.length - 1 ? (
                  <NeonButton
                    variant="green"
                    onClick={nextStep}
                    disabled={!canProceed()}
                  >
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </NeonButton>
                ) : (
                  <NeonButton
                    variant="green"
                    onClick={submitCampaign}
                    disabled={createCampaign.isPending || !campaignName.trim()}
                  >
                    {createCampaign.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Criar Campanha
                      </>
                    )}
                  </NeonButton>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
