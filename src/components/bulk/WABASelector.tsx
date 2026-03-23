"use client";

import { useState } from "react";
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Plus,
  Smartphone,
  RefreshCw
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { useWABAConfigs, useSyncTemplates } from "@/hooks/use-waba";
import type { WABAConfig } from "@/types/waba";
import { cn } from "@/lib/utils";

interface WABASelectorProps {
  companyId?: string;
  value: string | null;
  onChange: (configId: string, config: WABAConfig) => void;
  required?: boolean;
}

export function WABASelector({ companyId, value, onChange, required = true }: WABASelectorProps) {
  const { data: configs, isLoading, error, refetch } = useWABAConfigs(companyId);
  const syncTemplates = useSyncTemplates();
  const [syncingConfigId, setSyncingConfigId] = useState<string | null>(null);

  const selectedConfig = configs?.find(c => c.id === value);

  const handleSyncTemplates = async (e: React.MouseEvent, configId: string) => {
    e.stopPropagation();
    setSyncingConfigId(configId);
    await syncTemplates.mutateAsync(configId);
    setSyncingConfigId(null);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'connected':
        return { color: 'bg-emerald-500', icon: CheckCircle, text: 'Conectado' };
      case 'error':
        return { color: 'bg-red-500', icon: AlertCircle, text: 'Erro' };
      case 'pending':
        return { color: 'bg-amber-500', icon: Loader2, text: 'Pendente' };
      default:
        return { color: 'bg-slate-500', icon: AlertCircle, text: 'Desconectado' };
    }
  };

  if (isLoading) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <span className="dark:text-slate-400 text-slate-600">Carregando instâncias WABA...</span>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-4" glow="red">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="dark:text-slate-300 text-slate-700">Erro ao carregar instâncias</span>
          <button 
            onClick={() => refetch()}
            className="ml-auto text-emerald-400 hover:text-emerald-300"
          >
            Tentar novamente
          </button>
        </div>
      </GlassCard>
    );
  }

  if (!configs || configs.length === 0) {
    return (
      <GlassCard className="p-6 text-center" glow="amber">
        <Smartphone className="w-12 h-12 mx-auto mb-3 dark:text-amber-400 text-amber-600" />
        <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">
          Nenhuma instância WABA configurada
        </h3>
        <p className="dark:text-slate-400 text-slate-600 mb-4 text-sm">
          Você precisa configurar uma instância do WhatsApp Business API para enviar mensagens em massa.
        </p>
        <NeonButton variant="blue" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Configurar WABA
        </NeonButton>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {required && !value && (
        <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
          <AlertCircle className="w-4 h-4" />
          <span>Selecione uma instância WABA para continuar</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {configs.map((config) => {
          const status = getStatusConfig(config.status);
          const StatusIcon = status.icon;
          const isSelected = value === config.id;
          const isSyncing = syncingConfigId === config.id;

          return (
            <button
              key={config.id}
              onClick={() => onChange(config.id, config)}
              className={cn(
                "relative text-left transition-all duration-200",
                isSelected && "ring-2 ring-emerald-500 ring-offset-2 ring-offset-transparent"
              )}
            >
              <GlassCard 
                className={cn(
                  "p-4 h-full",
                  isSelected ? "bg-emerald-500/10" : "hover:bg-white/5"
                )}
                glow={isSelected ? "green" : "none"}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      isSelected ? "bg-emerald-500/20" : "dark:bg-white/5 bg-slate-100"
                    )}>
                      <Smartphone className={cn(
                        "w-5 h-5",
                        isSelected ? "text-emerald-400" : "dark:text-slate-400 text-slate-500"
                      )} />
                    </div>
                    <div>
                      <h4 className={cn(
                        "font-medium",
                        isSelected ? "dark:text-white text-slate-900" : "dark:text-slate-200 text-slate-700"
                      )}>
                        {config.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={cn("w-2 h-2 rounded-full", status.color)} />
                        <span className="text-xs dark:text-slate-400 text-slate-500">
                          {status.text}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {config.status === 'connected' && (
                    <button
                      onClick={(e) => handleSyncTemplates(e, config.id)}
                      disabled={isSyncing}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-colors"
                      title="Sincronizar templates"
                    >
                      <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
                    </button>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t dark:border-white/10 border-slate-200">
                  <p className="text-xs dark:text-slate-500 text-slate-500 font-mono">
                    ID: {config.phone_number_id}
                  </p>
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <GlowBadge variant="green">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Selecionado
                    </GlowBadge>
                  </div>
                )}
              </GlassCard>
            </button>
          );
        })}
      </div>
    </div>
  );
}
