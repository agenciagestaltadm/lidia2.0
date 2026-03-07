"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Phone, Lock, Building2, Shield, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GlowBadge } from "@/components/ui/glow-badge";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";
import type { CompanyUser, UserFormData } from "@/hooks/use-company-users";
import type { Company } from "@/hooks/use-companies";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: UserFormData) => Promise<{ success: boolean; error?: string }>;
  user?: CompanyUser | null;
  companies: Company[];
  currentCompanyId?: string | null;
  isLoading?: boolean;
}

const roleOptions = [
  { value: "CLIENT_ADMIN", label: "Administrador" },
  { value: "CLIENT_MANAGER", label: "Gerente" },
  { value: "CLIENT_AGENT", label: "Agente" },
  { value: "CLIENT_VIEWER", label: "Visualizador" },
];

const roleDescriptions: Record<string, string> = {
  CLIENT_ADMIN: "Acesso total ao sistema",
  CLIENT_MANAGER: "Gerencia atendimentos e equipe",
  CLIENT_AGENT: "Atendimento ao cliente",
  CLIENT_VIEWER: "Apenas visualização de dados",
};

export function UserModal({
  isOpen,
  onClose,
  onSave,
  user,
  companies,
  currentCompanyId,
  isLoading = false,
}: UserModalProps) {
  const isEditing = !!user;

  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    full_name: "",
    phone: "",
    role: "CLIENT_AGENT",
    company_id: currentCompanyId || "",
    is_active: true,
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          email: user.email,
          full_name: user.full_name || "",
          phone: user.phone || "",
          role: user.role,
          company_id: user.company_id || "",
          is_active: user.is_active,
          password: "",
        });
      } else {
        setFormData({
          email: "",
          full_name: "",
          phone: "",
          role: "CLIENT_AGENT",
          company_id: currentCompanyId || "",
          is_active: true,
          password: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, user, currentCompanyId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email || !formData.email.includes("@")) {
      newErrors.email = "E-mail válido é obrigatório";
    }

    if (!formData.full_name || formData.full_name.trim().length < 2) {
      newErrors.full_name = "Nome completo é obrigatório";
    }

    if (!isEditing && (!formData.password || formData.password.length < 6)) {
      newErrors.password = "Senha deve ter pelo menos 6 caracteres";
    }

    if (!formData.company_id) {
      newErrors.company_id = "Selecione uma empresa";
    }

    if (!formData.role) {
      newErrors.role = "Selecione uma função";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    const result = await onSave(formData);
    setSaving(false);

    if (result.success) {
      onClose();
    } else {
      setErrors({ submit: result.error || "Erro ao salvar usuário" });
    }
  };

  const handleChange = (field: keyof UserFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is changed
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const companyOptions = companies.map((company) => ({
    value: company.id,
    label: company.name,
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 dark:bg-black/80 bg-slate-900/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:max-h-[90vh] overflow-auto z-50"
          >
            <GlassCard className="h-full" glow="green">
              <form onSubmit={handleSubmit} className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b dark:border-white/10 border-slate-200">
                  <div>
                    <h2 className="text-xl font-bold dark:text-white text-slate-900">
                      {isEditing ? "Editar Usuário" : "Novo Usuário"}
                    </h2>
                    <p className="dark:text-slate-400 text-slate-500 text-sm">
                      {isEditing
                        ? "Atualize os dados do usuário"
                        : "Preencha os dados para criar um novo usuário"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-lg dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 dark:hover:bg-white/10 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Error message */}
                  {errors.submit && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                      {errors.submit}
                    </div>
                  )}

                  {/* Company Selection */}
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      <Building2 className="w-4 h-4 inline mr-1" />
                      Empresa
                    </label>
                    <Select
                      value={formData.company_id || ""}
                      onValueChange={(value) => handleChange("company_id", value)}
                      options={companyOptions}
                      placeholder="Selecione uma empresa..."
                      error={errors.company_id}
                    />
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Nome Completo
                    </label>
                    <AnimatedInput
                      type="text"
                      placeholder="Digite o nome completo"
                      value={formData.full_name}
                      onChange={(e) => handleChange("full_name", e.target.value)}
                      error={errors.full_name}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      E-mail
                    </label>
                    <AnimatedInput
                      type="email"
                      placeholder="usuario@empresa.com"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      disabled={isEditing}
                      error={errors.email}
                    />
                    {isEditing && (
                      <p className="text-xs dark:text-slate-500 text-slate-400 mt-1">
                        O e-mail não pode ser alterado
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Telefone (WhatsApp para 2FA)
                    </label>
                    <AnimatedInput
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                    />
                    <p className="text-xs dark:text-slate-500 text-slate-400 mt-1">
                      Opcional - Número para receber códigos 2FA via WhatsApp
                    </p>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Senha {isEditing && "(deixe em branco para manter a atual)"}
                    </label>
                    <AnimatedInput
                      type="password"
                      placeholder={isEditing ? "••••••" : "Digite a senha"}
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      error={errors.password}
                    />
                    {!isEditing && (
                      <p className="text-xs dark:text-slate-500 text-slate-400 mt-1">
                        Mínimo de 6 caracteres
                      </p>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      <Shield className="w-4 h-4 inline mr-1" />
                      Perfil / Função
                    </label>
                    <Select
                      value={formData.role || ""}
                      onValueChange={(value) => handleChange("role", value as UserRole)}
                      options={roleOptions}
                      placeholder="Selecione uma função..."
                      error={errors.role}
                    />
                    {formData.role && (
                      <p className="text-xs dark:text-slate-400 text-slate-500 mt-2">
                        <GlowBadge variant="green" className="mr-2">
                          {roleOptions.find((r) => r.value === formData.role)?.label}
                        </GlowBadge>
                        {roleDescriptions[formData.role]}
                      </p>
                    )}
                  </div>

                  {/* Active Status */}
                  <div className="pt-4 border-t dark:border-white/10 border-slate-200">
                    <Switch
                      checked={formData.is_active ?? true}
                      onCheckedChange={(checked) => handleChange("is_active", checked)}
                      label="Usuário Ativo"
                      description={
                        formData.is_active
                          ? "Usuário pode acessar a plataforma"
                          : "Usuário está restrito e não pode acessar"
                      }
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t dark:border-white/10 border-slate-200">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="px-4 py-2 rounded-lg dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 dark:hover:bg-white/10 hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <NeonButton
                    type="submit"
                    variant="green"
                    disabled={saving || isLoading}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>{isEditing ? "Salvar Alterações" : "Criar Usuário"}</>
                    )}
                  </NeonButton>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
