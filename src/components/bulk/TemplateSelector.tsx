"use client";

import { useState } from "react";
import { 
  FileText, 
  CheckCircle, 
  Loader2,
  AlertCircle,
  RefreshCw,
  MessageSquare
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { useTemplates } from "@/hooks/use-templates";
import type { WABATemplate } from "@/types/waba";
import { cn } from "@/lib/utils";

interface TemplateSelectorProps {
  configId?: string;
  value: string | null;
  onChange: (templateId: string, template: WABATemplate) => void;
}

export function TemplateSelector({ configId, value, onChange }: TemplateSelectorProps) {
  const { data: templates, isLoading, error } = useTemplates(configId);
  const [showCustomMessage, setShowCustomMessage] = useState(false);

  const selectedTemplate = templates?.find(t => t.id === value);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'MARKETING':
        return 'bg-purple-500';
      case 'UTILITY':
        return 'bg-blue-500';
      case 'AUTHENTICATION':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'MARKETING':
        return 'Marketing';
      case 'UTILITY':
        return 'Utilidade';
      case 'AUTHENTICATION':
        return 'Autenticação';
      default:
        return category;
    }
  };

  if (isLoading) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          <span className="dark:text-slate-400 text-slate-600">
            Carregando templates...
          </span>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-4" glow="red">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="dark:text-slate-300 text-slate-700">
            Erro ao carregar templates
          </span>
        </div>
      </GlassCard>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <GlassCard className="p-6 text-center">
        <FileText className="w-12 h-12 mx-auto mb-3 dark:text-slate-500 text-slate-400" />
        <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">
          Nenhum template aprovado
        </h3>
        <p className="text-sm dark:text-slate-400 text-slate-500 mb-4">
          Sincronize os templates da sua conta Meta ou crie um novo.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
        {templates.map((template) => {
          const isSelected = value === template.id;
          const bodyComponent = template.components?.find(c => c.type === 'BODY');
          const previewText = bodyComponent?.text?.substring(0, 100) || 'Sem preview';

          return (
            <button
              key={template.id}
              onClick={() => onChange(template.id, template)}
              className={cn(
                "relative text-left transition-all duration-200",
                isSelected && "ring-2 ring-emerald-500 ring-offset-2 ring-offset-transparent"
              )}
            >
              <GlassCard 
                className={cn(
                  "p-4",
                  isSelected ? "bg-emerald-500/10" : "hover:bg-white/5"
                )}
                glow={isSelected ? "green" : "none"}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      getCategoryColor(template.category)
                    )} />
                    <h4 className={cn(
                      "font-medium",
                      isSelected ? "dark:text-white text-slate-900" : "dark:text-slate-200 text-slate-700"
                    )}>
                      {template.name}
                    </h4>
                  </div>
                  <GlowBadge variant="default" className="text-xs">
                    {getCategoryLabel(template.category)}
                  </GlowBadge>
                </div>

                <p className="text-sm dark:text-slate-400 text-slate-500 line-clamp-2 mb-2">
                  {previewText}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs dark:text-slate-500 text-slate-400">
                    {template.language}
                  </span>
                  {isSelected && (
                    <GlowBadge variant="green">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Selecionado
                    </GlowBadge>
                  )}
                </div>
              </GlassCard>
            </button>
          );
        })}
      </div>
    </div>
  );
}
