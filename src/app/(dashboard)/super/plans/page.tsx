"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  Check,
  Crown,
  Users,
  MessageSquare,
  Zap,
  Loader2,
  AlertCircle,
  RefreshCw,
  History,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { cn, formatCurrency } from "@/lib/utils";
import { usePlans, type Plan } from "@/hooks/use-plans";

// Feature limit display
function FeatureLimit({
  icon: Icon,
  label,
  value,
  unlimited = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  unlimited?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm dark:text-slate-400 text-slate-500">
      <Icon className="w-4 h-4 text-emerald-500/60" />
      <span>{label}:</span>
      <span className="dark:text-emerald-400 text-emerald-600 font-medium">
        {unlimited || value === -1 ? "Ilimitado" : value.toLocaleString("pt-BR")}
      </span>
    </div>
  );
}

// Plan Card Component
function PlanCard({
  plan,
  onEdit,
  onDelete,
  onToggleStatus,
  activeCompanies,
}: {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onDelete: (plan: Plan) => void;
  onToggleStatus: (plan: Plan) => void;
  activeCompanies: number;
}) {
  const limits = plan.limits || {};
  const features = plan.features || [];

  return (
    <motion.div variants={fadeInUp}>
      <GlassCard
        className="h-full flex flex-col relative overflow-hidden"
        glow={plan.is_active ? "green" : "none"}
        hover
      >
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <GlowBadge variant={plan.is_active ? "green" : "red"}>
            {plan.is_active ? "Ativo" : "Inativo"}
          </GlowBadge>
        </div>

        {/* Popular Badge */}
        {activeCompanies > 5 && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-black text-xs font-bold rounded-full shadow-lg shadow-emerald-500/20">
              Mais Popular
            </span>
          </div>
        )}

        <div className="p-6 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold dark:text-white text-slate-900">{plan.name}</h3>
              <p className="text-sm dark:text-slate-400 text-slate-500 mt-1">{plan.description}</p>
            </div>
          </div>

          {/* Price */}
          <div className="mb-6">
            {plan.price ? (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold dark:text-white text-slate-900">
                  {formatCurrency(plan.price)}
                </span>
                <span className="dark:text-slate-400 text-slate-500">/mês</span>
              </div>
            ) : (
              <span className="text-2xl font-bold text-emerald-400">
                Sob Consulta
              </span>
            )}
          </div>

          {/* Features */}
          <div className="space-y-2 mb-6">
            <FeatureLimit
              icon={Users}
              label="Usuários"
              value={limits.max_users || 1}
              unlimited={limits.max_users === -1}
            />
            <FeatureLimit
              icon={MessageSquare}
              label="Canais"
              value={limits.max_channels || 1}
              unlimited={limits.max_channels === -1}
            />
            <FeatureLimit
              icon={Zap}
              label="Mensagens/dia"
              value={limits.max_bulk_messages_per_day || 100}
              unlimited={limits.max_bulk_messages_per_day === -1}
            />
          </div>

          {/* Additional Features */}
          {features.length > 0 && (
            <div className="space-y-2 mb-6">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm dark:text-slate-300 text-slate-600">{feature}</span>
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="pt-4 border-t dark:border-white/10 border-slate-200">
            <div className="flex items-center justify-between text-sm">
              <span className="dark:text-slate-400 text-slate-500">Empresas ativas:</span>
              <span className="dark:text-emerald-400 text-emerald-600 font-medium">
                {activeCompanies}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t dark:border-white/5 border-slate-200 flex gap-2">
          <button
            onClick={() => onEdit(plan)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg dark:bg-white/5 bg-slate-100 dark:text-slate-300 text-slate-600 dark:hover:bg-white/10 hover:bg-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200"
          >
            <Edit className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={() => onToggleStatus(plan)}
            className={cn(
              "px-4 py-2 rounded-lg transition-all duration-200",
              plan.is_active
                ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
            )}
          >
            {plan.is_active ? "Desativar" : "Ativar"}
          </button>
          <button
            onClick={() => onDelete(plan)}
            className="px-4 py-2 rounded-lg dark:bg-white/5 bg-slate-100 dark:text-slate-400 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Loading Skeleton
function PlanCardSkeleton() {
  return (
    <GlassCard className="h-full p-6" hover={false}>
      <div className="animate-pulse space-y-4">
        <div className="h-6 dark:bg-white/10 bg-slate-200 rounded w-3/4" />
        <div className="h-4 dark:bg-white/10 bg-slate-200 rounded w-1/2" />
        <div className="h-10 dark:bg-white/10 bg-slate-200 rounded w-1/3" />
        <div className="space-y-2">
          <div className="h-4 dark:bg-white/10 bg-slate-200 rounded" />
          <div className="h-4 dark:bg-white/10 bg-slate-200 rounded" />
          <div className="h-4 dark:bg-white/10 bg-slate-200 rounded" />
        </div>
      </div>
    </GlassCard>
  );
}

export default function SuperPlansPage() {
  const {
    plans,
    loading,
    error,
    refetch,
    togglePlanStatus,
    deletePlan,
  } = usePlans();

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [actionLoading, setActionLoading] = useState(false);

  const handleEdit = (plan: Plan) => {
    setSelectedPlan(plan);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedPlan(null);
    setModalMode("create");
    setShowModal(true);
  };

  const handleDelete = async (plan: Plan) => {
    if (!confirm(`Tem certeza que deseja excluir o plano "${plan.name}"?`)) {
      return;
    }

    setActionLoading(true);
    const result = await deletePlan(plan.id);
    setActionLoading(false);

    if (!result.success) {
      alert(result.error);
    }
  };

  const handleToggleStatus = async (plan: Plan) => {
    setActionLoading(true);
    const result = await togglePlanStatus(plan.id, !plan.is_active);
    setActionLoading(false);

    if (!result.success) {
      alert(result.error);
    }
  };

  // Calculate stats
  const stats = {
    totalPlans: plans.length,
    activePlans: plans.filter((p) => p.is_active).length,
    inactivePlans: plans.filter((p) => !p.is_active).length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 dark:bg-white/10 bg-slate-200 rounded w-48 mb-2" />
            <div className="h-4 dark:bg-white/10 bg-slate-200 rounded w-64" />
          </div>
          <div className="h-10 dark:bg-white/10 bg-slate-200 rounded w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <PlanCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <GlassCard className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold dark:text-white text-slate-900 mb-2">
            Erro ao carregar planos
          </h3>
          <p className="text-sm dark:text-slate-400 text-slate-500 mb-4">{error}</p>
          <NeonButton onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </NeonButton>
        </GlassCard>
      </div>
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
      <motion.div
        variants={fadeInUp}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GlowBadge variant="green">
              <Crown className="w-3 h-3 mr-1" />
              Super Admin
            </GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900">
            Planos do Sistema
          </h1>
          <p className="dark:text-slate-400 text-slate-500 mt-1">
            Gerencie os planos disponíveis para as empresas
          </p>
        </div>
        <NeonButton onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </NeonButton>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerContainer} className="grid grid-cols-3 gap-4">
        {[
          { label: "Total de Planos", value: stats.totalPlans },
          { label: "Planos Ativos", value: stats.activePlans },
          { label: "Planos Inativos", value: stats.inactivePlans },
        ].map((stat, index) => (
          <motion.div key={stat.label} variants={fadeInUp} custom={index}>
            <GlassCard className="p-4" glow="green">
              <p className="dark:text-slate-400 text-slate-500 text-xs">{stat.label}</p>
              <p className="text-2xl font-bold dark:text-white text-slate-900 mt-1">{stat.value}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Plans Grid */}
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {plans.map((plan, index) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            activeCompanies={0} // TODO: Fetch from hook
          />
        ))}
      </motion.div>

      {/* Empty State */}
      {plans.length === 0 && (
        <motion.div variants={fadeInUp} className="text-center py-16">
          <CreditCard className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold dark:text-white text-slate-900 mb-2">
            Nenhum plano cadastrado
          </h3>
          <p className="dark:text-slate-400 text-slate-500 mb-4">
            Crie o primeiro plano para começar
          </p>
          <NeonButton onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Plano
          </NeonButton>
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg"
            >
              <GlassCard className="p-6" glow="green">
                <h2 className="text-xl font-bold text-white mb-4">
                  {modalMode === "create" ? "Novo Plano" : "Editar Plano"}
                </h2>
                <p className="text-slate-400 text-sm">
                  Formulário de {modalMode === "create" ? "criação" : "edição"}{" "}
                  de plano será implementado aqui.
                </p>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <NeonButton onClick={() => setShowModal(false)}>
                    Salvar
                  </NeonButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
