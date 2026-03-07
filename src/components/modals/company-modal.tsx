"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { AnimatedInput } from "@/components/ui/animated-input";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { NeonButton } from "@/components/ui/neon-button";
import { GlassCard } from "@/components/ui/glass-card";
import type { Company } from "@/hooks/use-companies";
import type { Plan } from "@/hooks/use-plans";

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (companyData: CompanyFormData) => Promise<void>;
  company?: Company | null;
  plans: Plan[];
  mode: "create" | "edit";
}

export interface CompanyFormData {
  name: string;
  document: string | null;
  identity: string | null;
  plan_id: string | null;
  max_users: number;
  max_connections: number;
  is_active: boolean;
  is_trial: boolean;
  trial_period: number;
}

const defaultFormData: CompanyFormData = {
  name: "",
  document: "",
  identity: "",
  plan_id: null,
  max_users: 1,
  max_connections: 1,
  is_active: true,
  is_trial: false,
  trial_period: 3,
};

export function CompanyModal({ isOpen, onClose, onSave, company, plans, mode }: CompanyModalProps) {
  const [formData, setFormData] = useState<CompanyFormData>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyFormData, string>>>({});

  // Format plan options for select
  const planOptions = plans
    .filter((p) => p.is_active)
    .map((plan) => ({
      value: plan.id,
      label: `${plan.name} ${plan.is_trial ? "(Trial)" : ""}`,
    }));

  // Reset form when modal opens/closes or company changes
  useEffect(() => {
    if (isOpen) {
      if (company && mode === "edit") {
        setFormData({
          name: company.name || "",
          document: company.document || "",
          identity: company.identity || "",
          plan_id: company.plan_id || "",
          max_users: company.max_users || 1,
          max_connections: company.max_connections || 1,
          is_active: company.is_active ?? true,
          is_trial: company.is_trial || false,
          trial_period: company.trial_period || 3,
        });
      } else {
        setFormData(defaultFormData);
      }
      setErrors({});
    }
  }, [isOpen, company, mode]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CompanyFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome da empresa é obrigatório";
    }

    if (formData.max_users < 1) {
      newErrors.max_users = "Mínimo de 1 usuário";
    }

    if (formData.max_connections < 1) {
      newErrors.max_connections = "Mínimo de 1 conexão";
    }

    if (formData.is_trial && formData.trial_period < 1) {
      newErrors.trial_period = "Período de teste deve ser pelo menos 1 dia";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving company:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar empresa. Tente novamente.";
      setErrors({
        name: errorMessage
      });
      alert("Erro ao salvar empresa: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof CompanyFormData>(field: K, value: CompanyFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Criar Tenant" : "Editar Tenant"}
      description={
        mode === "create"
          ? "Preencha as informações para criar uma nova empresa"
          : "Atualize as informações da empresa"
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between pb-4 border-b dark:border-white/10 border-slate-200">
            <span className="text-sm font-medium dark:text-slate-300 text-slate-700">
              Status
            </span>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => updateField("is_active", checked)}
              label={formData.is_active ? "Ativo" : "Inativo"}
            />
          </div>

          {/* Nome da Empresa */}
          <div>
            <AnimatedInput
              label="Nome"
              placeholder="Nome da empresa"
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              error={errors.name}
            />
          </div>

          {/* Documento e Identidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatedInput
              label="CNPJ/Documento"
              placeholder="00.000.000/0000-00"
              value={formData.document || ""}
              onChange={(e) => updateField("document", e.target.value || null)}
            />
            <AnimatedInput
              label="Identidade"
              placeholder="Nome fantasia ou identificador"
              value={formData.identity || ""}
              onChange={(e) => updateField("identity", e.target.value || null)}
            />
          </div>

          {/* Plano */}
          <Select
            label="Plano"
            value={formData.plan_id || ""}
            onValueChange={(value) => updateField("plan_id", value || null)}
            options={[{ value: "", label: "Selecione um plano..." }, ...planOptions]}
            placeholder="Selecione um plano"
          />

          {/* Limites */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t dark:border-white/10 border-slate-200">
            <AnimatedInput
              label="Limite de Usuários"
              type="number"
              placeholder="1"
              value={formData.max_users}
              onChange={(e) => updateField("max_users", parseInt(e.target.value) || 1)}
              error={errors.max_users}
            />
            <AnimatedInput
              label="Limite de Conexões"
              type="number"
              placeholder="1"
              value={formData.max_connections}
              onChange={(e) => updateField("max_connections", parseInt(e.target.value) || 1)}
              error={errors.max_connections}
            />
          </div>

          {/* Toggle Trial */}
          <div className="pt-4 border-t dark:border-white/10 border-slate-200">
            <Switch
              checked={formData.is_trial}
              onCheckedChange={(checked) => updateField("is_trial", checked)}
              label="Trial Ativo"
              description="Empresa em período de teste"
            />
          </div>

          {/* Trial Section */}
          {formData.is_trial && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Alerta */}
              <GlassCard className="p-4 border-amber-500/30" glow="none">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-500">Atenção!</h4>
                    <p className="text-sm dark:text-slate-300 text-slate-600 mt-1">
                      Ao ativar o trial, os dados da Empresa serão apagados do sistema, após o vencimento do período de teste.
                    </p>
                  </div>
                </div>
              </GlassCard>

              {/* Período de Teste */}
              <AnimatedInput
                label="Período de Teste (dias)"
                type="number"
                placeholder="3"
                value={formData.trial_period}
                onChange={(e) => updateField("trial_period", parseInt(e.target.value) || 3)}
                error={errors.trial_period}
              />
            </motion.div>
          )}
        </DialogContent>

        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium dark:text-slate-400 text-slate-500 hover:dark:text-white hover:text-slate-900 transition-colors"
          >
            CANCELAR
          </button>
          <NeonButton type="submit" disabled={loading}>
            {loading ? "Salvando..." : "SALVAR"}
          </NeonButton>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

export default CompanyModal;