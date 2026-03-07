"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { Building2, Plus, Search, Edit, Trash2, Users, CheckCircle, XCircle, Loader2, AlertCircle, BarChart3 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useCompanies, type Company } from "@/hooks/use-companies";
import { usePlans } from "@/hooks/use-plans";
import { useState, useMemo } from "react";
import { CompanyModal, CompanyMetricsModal, type CompanyFormData } from "@/components/modals";

const planColors: Record<string, "green" | "emerald" | "red" | "blue" | "amber" | "default"> = {
  "Básico": "emerald",
  "Profissional": "green",
  "Empresarial": "emerald",
  "Personalizado": "green",
};

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <motion.div variants={fadeInUp}>
      <GlassCard className="overflow-hidden" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-emerald-500/10 dark:border-emerald-500/10 border-slate-200">
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Empresa</th>
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Plano</th>
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Usuários</th>
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Status</th>
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Criado em</th>
                <th className="text-right py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-white/5 divide-slate-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-6">
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded w-32"></div>
                      <div className="h-3 bg-slate-700/20 dark:bg-slate-700/20 bg-slate-100 rounded w-24"></div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-6 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded-full w-20"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded w-8"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded w-12"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded w-20"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-8 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded w-16 ml-auto"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Error state component
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div variants={fadeInUp}>
      <GlassCard className="p-8 text-center" hover={false}>
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">Erro ao carregar empresas</h3>
        <p className="dark:text-slate-400 text-slate-600 mb-4">{error}</p>
        <NeonButton variant="green" onClick={onRetry}>
          Tentar novamente
        </NeonButton>
      </GlassCard>
    </motion.div>
  );
}

// Empty state component
function EmptyState({ searchTerm, onCreateClick }: { searchTerm: string; onCreateClick: () => void }) {
  return (
    <motion.div variants={fadeInUp}>
      <GlassCard className="p-8 text-center" hover={false}>
        <Building2 className="w-12 h-12 mx-auto mb-4 dark:text-slate-600 text-slate-400" />
        <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">
          {searchTerm ? "Nenhuma empresa encontrada" : "Nenhuma empresa cadastrada"}
        </h3>
        <p className="dark:text-slate-400 text-slate-600 mb-4">
          {searchTerm 
            ? "Tente buscar com outros termos" 
            : "Comece cadastrando a primeira empresa"}
        </p>
        {!searchTerm && (
          <NeonButton variant="green" onClick={onCreateClick}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Empresa
          </NeonButton>
        )}
      </GlassCard>
    </motion.div>
  );
}

export default function SuperCompaniesPage() {
  const { companies, loading, error, refetch, createCompany, updateCompany, deleteCompany, toggleCompanyStatus, getCompanyMetrics } = useCompanies();
  const { plans } = usePlans();
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");

  // Filter companies based on search term
  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companies;
    const term = searchTerm.toLowerCase();
    return companies.filter(company => 
      company.name.toLowerCase().includes(term) ||
      company.document?.toLowerCase().includes(term)
    );
  }, [companies, searchTerm]);

  // Calculate real statistics
  const stats = useMemo(() => {
    const total = companies.length;
    const active = companies.filter(c => c.is_active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [companies]);

  // Modal handlers
  const handleCreateCompany = () => {
    setSelectedCompany(null);
    setModalMode("create");
    setShowCompanyModal(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setModalMode("edit");
    setShowCompanyModal(true);
  };

  const handleSaveCompany = async (formData: CompanyFormData) => {
    const companyData = {
      name: formData.name,
      document: formData.document || null,
      identity: formData.identity || null,
      plan_id: formData.plan_id || null,
      max_users: formData.max_users,
      max_connections: formData.max_connections,
      is_active: formData.is_active,
      is_trial: formData.is_trial,
      trial_period: formData.trial_period,
    };

    try {
      if (modalMode === "create") {
        const result = await createCompany(companyData);
        if (!result.success) {
          throw new Error(result.error || "Erro ao criar empresa");
        }
      } else if (selectedCompany) {
        const result = await updateCompany(selectedCompany.id, companyData);
        if (!result.success) {
          throw new Error(result.error || "Erro ao atualizar empresa");
        }
      }
    } catch (err) {
      console.error("Error in handleSaveCompany:", err);
      throw err;
    }
  };

  const handleDeleteCompany = async (company: Company) => {
    if (!confirm(`Tem certeza que deseja excluir a empresa "${company.name}"?`)) {
      return;
    }
    const result = await deleteCompany(company.id);
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleViewMetrics = (company: Company) => {
    setSelectedCompany(company);
    setShowMetricsModal(true);
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
            <GlowBadge variant="green">Gestão</GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900">
            Empresas
          </h1>
          <p className="dark:text-slate-400 text-slate-600 mt-1">
            Gerencie todas as empresas cadastradas no sistema
          </p>
        </div>
        <NeonButton variant="green" onClick={handleCreateCompany}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Empresa
        </NeonButton>
      </motion.div>

      {/* Stats */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {[
          { label: "Total de Empresas", value: stats.total, icon: Building2 },
          { label: "Ativas", value: stats.active, icon: CheckCircle },
          { label: "Inativas", value: stats.inactive, icon: XCircle },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={fadeInUp} custom={index}>
              <GlassCard className="p-4" glow={index % 2 === 0 ? "green" : "none"}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg dark:bg-emerald-500/10 bg-emerald-100">
                    <Icon className="w-5 h-5 dark:text-emerald-400 text-emerald-600" />
                  </div>
                  <div>
                    <p className="dark:text-slate-400 text-slate-500 text-xs">{stat.label}</p>
                    <p className="text-xl font-bold dark:text-white text-slate-900">
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin inline" />
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="p-4" hover={false}>
          <AnimatedInput
            placeholder="Buscar empresas por nome, CNPJ ou email..."
            icon={<Search className="w-5 h-5" />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </GlassCard>
      </motion.div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : filteredCompanies.length === 0 ? (
        <EmptyState searchTerm={searchTerm} onCreateClick={handleCreateCompany} />
      ) : (
        /* Companies Table */
        <motion.div variants={fadeInUp}>
          <GlassCard className="overflow-hidden" hover={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-emerald-500/10 border-slate-200">
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Empresa</th>
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Plano</th>
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Limites</th>
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Trial</th>
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Status</th>
                    <th className="text-right py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-white/5 divide-slate-100">
                  {filteredCompanies.map((company, index) => (
                    <motion.tr
                      key={company.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:dark:bg-white/[0.02] hover:bg-slate-50 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium text-white shrink-0"
                            style={{
                              background: "linear-gradient(135deg, #10b981, #059669)",
                            }}
                          >
                            {company.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium dark:text-white text-slate-900">{company.name}</p>
                            {company.document && (
                              <p className="text-sm dark:text-slate-400 text-slate-500">
                                {company.document.length === 14 
                                  ? company.document.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
                                  : company.document
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {company.plan ? (
                          <GlowBadge variant={planColors[company.plan.name] || "default"}>
                            {company.plan.name}
                          </GlowBadge>
                        ) : (
                          <span className="dark:text-slate-500 text-slate-400 text-sm">Sem plano</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          <p className="dark:text-slate-300 text-slate-700">
                            <span className="dark:text-slate-500 text-slate-400">Usuários:</span>{" "}
                            {company.max_users}
                          </p>
                          <p className="dark:text-slate-300 text-slate-700">
                            <span className="dark:text-slate-500 text-slate-400">Conexões:</span>{" "}
                            {company.max_connections}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {company.is_trial ? (
                            <>
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              <span className="dark:text-amber-400 text-amber-600 text-sm">
                                {company.trial_period} dias
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              <span className="dark:text-slate-500 text-slate-400 text-sm">
                                Inativo
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            company.is_active ? "bg-emerald-400" : "bg-red-400"
                          )} />
                          <span className={company.is_active ? "dark:text-emerald-400 text-emerald-600" : "dark:text-red-400 text-red-500"}>
                            {company.is_active ? "Ativa" : "Inativa"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewMetrics(company)}
                            className="p-2 rounded-lg hover:dark:bg-white/5 hover:bg-slate-100 dark:text-slate-400 text-slate-500 hover:dark:text-blue-400 hover:text-blue-600 transition-colors"
                            title="Ver Métricas"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditCompany(company)}
                            className="p-2 rounded-lg hover:dark:bg-white/5 hover:bg-slate-100 dark:text-slate-400 text-slate-500 hover:dark:text-emerald-400 hover:text-emerald-600 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCompany(company)}
                            className="p-2 rounded-lg hover:dark:bg-white/5 hover:bg-slate-100 dark:text-slate-400 text-slate-500 hover:dark:text-red-400 hover:text-red-500 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Modais */}
      <CompanyModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        onSave={handleSaveCompany}
        company={selectedCompany}
        plans={plans}
        mode={modalMode}
      />

      <CompanyMetricsModal
        isOpen={showMetricsModal}
        onClose={() => setShowMetricsModal(false)}
        company={selectedCompany}
        fetchMetrics={getCompanyMetrics}
      />
    </motion.div>
  );
}
