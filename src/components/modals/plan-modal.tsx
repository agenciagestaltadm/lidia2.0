"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { AnimatedInput } from "@/components/ui/animated-input";
import { Switch } from "@/components/ui/switch";
import { NeonButton } from "@/components/ui/neon-button";
import { GlassCard } from "@/components/ui/glass-card";
import type { Plan } from "@/hooks/use-plans";

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (planData: PlanFormData) => Promise<void>;
  plan?: Plan | null;
  mode: "create" | "edit";
}

export interface PlanFormData {
  name: string;
  description: string;
  price: number;
  max_users: number;
  max_channels: number;
  is_trial: boolean;
  trial_days: number;
  is_active: boolean;
}

const defaultFormData: PlanFormData = {
  name: "",
  description: "",
  price: 0,
  max_users: 1,
  max_channels: 1,
  is_trial: false,
  trial_days: 3,
  is_active: true,
};

export function PlanModal({ isOpen, onClose, onSave, plan, mode }: PlanModalProps) {
  const [formData, setFormData] = useState<PlanFormData>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof PlanFormData, string>>>({});

  // Reset form when modal opens/closes or plan changes
  useEffect(() => {
    if (isOpen) {
      if (plan && mode === "edit") {
        setFormData({
          name: plan.name || "",
          description: plan.description || "",
          price: plan.price || 0,
          max_users: plan.limits?.max_users || 1,
          max_channels: plan.limits?.max_channels || 1,
          is_trial: plan.is_trial || false,
          trial_days: plan.trial_days || 3,
          is_active: plan.is_active ?? true,
        });
      } else {
        setFormData(defaultFormData);
      }
      setErrors({});
    }
  }, [isOpen, plan, mode]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PlanFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome do plano é obrigatório";
    }

    if (formData.price < 0) {
      newErrors.price = "Valor não pode ser negativo";
    }

    if (formData.max_users < 1) {
      newErrors.max_users = "Mínimo de 1 usuário";
    }

    if (formData.max_channels < 1) {
      newErrors.max_channels = "Mínimo de 1 conexão";
    }

    if (formData.is_trial && formData.trial_days < 1) {
      newErrors.trial_days = "Período de trial deve ser pelo menos 1 dia";
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
      console.error("Error saving plan:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar plano. Tente novamente.";
      setErrors({
        name: errorMessage
      });
      alert("Erro ao salvar plano: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const updateField = <K extends keyof PlanFormData>(field: K, value: PlanFormData[K]) => {
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
      title={mode === "create" ? "Criar Plano" : "Editar Plano"}
      description={
        mode === "create"
          ? "Preencha as informações para criar um novo plano"
          : "Atualize as informações do plano"
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit}>
        <DialogContent className="space-y-6">
          {/* Nome do Plano */}
          <div>
            <AnimatedInput
              label="Nome do Plano"
              placeholder="Ex: Profissional, Empresarial..."
              value={formData.name}
              onChange={(e) => updateField("name", e.target.value)}
              error={errors.name}
            />
          </div>

          {/* Valor e Limites */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AnimatedInput
              label="Valor do Plano"
              type="number"
              placeholder="0,00"
              value={formData.price}
              onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
              error={errors.price}
            />
            <AnimatedInput
              label="Conexões"
              type="number"
              placeholder="1"
              value={formData.max_channels}
              onChange={(e) => updateField("max_channels", parseInt(e.target.value) || 1)}
              error={errors.max_channels}
            />
            <AnimatedInput
              label="Usuários"
              type="number"
              placeholder="1"
              value={formData.max_users}
              onChange={(e) => updateField("max_users", parseInt(e.target.value) || 1)}
              error={errors.max_users}
            />
          </div>

          {/* Toggle Trial */}
          <div className="pt-4 border-t dark:border-white/10 border-slate-200">
            <Switch
              checked={formData.is_trial}
              onCheckedChange={(checked) => updateField("is_trial", checked)}
              label="Trial"
              description="Ativar período de teste para este plano"
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
                    <h4 className="text-sm font-semibold text-amber-500">Atenção!!</h4>
                    <p className="text-sm dark:text-slate-300 text-slate-600 mt-1">
                      Ao ativar o trial, os dados da Empresa serão apagados do sistema após o vencimento do período de teste.
                    </p>
                  </div>
                </div>
              </GlassCard>

              {/* Período de Trial */}
              <AnimatedInput
                label="Período de Trial (dias)"
                type="number"
                placeholder="3"
                value={formData.trial_days}
                onChange={(e) => updateField("trial_days", parseInt(e.target.value) || 3)}
                error={errors.trial_days}
              />
            </motion.div>
          )}

          {/* Status do Plano */}
          <div className="flex items-center justify-between pt-4 border-t dark:border-white/10 border-slate-200">
            <span className="text-sm font-medium dark:text-slate-300 text-slate-700">
              Status do Plano
            </span>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => updateField("is_active", checked)}
              label={formData.is_active ? "Ativo" : "Inativo"}
            />
          </div>
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

export default PlanModal;