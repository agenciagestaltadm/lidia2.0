"use client";

export const dynamic = "force-dynamic";

import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  Edit,
  Trash2,
  Building2,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
  Plus,
  Power,
  PowerOff,
  X,
  Shield,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { Select } from "@/components/ui/select";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import {
  useCompanyUsers,
  type CompanyUser,
  type UserFilters,
} from "@/hooks/use-company-users";
import { useCompanies } from "@/hooks/use-companies";
import { UserModal } from "@/components/modals";
import { useState, useMemo } from "react";
import type { UserRole } from "@/types";

const roleColors: Record<
  string,
  "green" | "emerald" | "red" | "blue" | "amber" | "default"
> = {
  CLIENT_ADMIN: "green",
  CLIENT_MANAGER: "emerald",
  CLIENT_AGENT: "default",
  CLIENT_VIEWER: "blue",
};

const roleLabels: Record<string, string> = {
  CLIENT_ADMIN: "Administrador",
  CLIENT_MANAGER: "Gerente",
  CLIENT_AGENT: "Agente",
  CLIENT_VIEWER: "Visualizador",
};

const statusOptions = [
  { value: "all", label: "Todos os Status" },
  { value: "active", label: "Ativos" },
  { value: "inactive", label: "Inativos" },
];

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <motion.div variants={fadeInUp}>
      <GlassCard className="overflow-hidden" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-emerald-500/10 border-slate-200">
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">
                  Usuário
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">
                  Empresa
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">
                  Função
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">
                  Status
                </th>
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">
                  Último Login
                </th>
                <th className="text-right py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-white/5 divide-slate-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded w-24"></div>
                        <div className="h-3 bg-slate-700/20 dark:bg-slate-700/20 bg-slate-100 rounded w-32"></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded w-20"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-6 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-200 rounded-full w-16"></div>
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
        <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">
          Erro ao carregar usuários
        </h3>
        <p className="dark:text-slate-400 text-slate-600 mb-4">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
        >
          Tentar novamente
        </button>
      </GlassCard>
    </motion.div>
  );
}

// Empty state component
function EmptyState({
  searchTerm,
  onAdd,
  onClearFilters,
}: {
  searchTerm: string;
  onAdd: () => void;
  onClearFilters: () => void;
}) {
  return (
    <motion.div variants={fadeInUp}>
      <GlassCard className="p-12 text-center" hover={false}>
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">
          {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
        </h3>
        <p className="dark:text-slate-400 text-slate-600 mb-6">
          {searchTerm
            ? "Tente ajustar os filtros ou buscar com outros termos"
            : "Comece adicionando um novo usuário ao sistema."}
        </p>
        <div className="flex justify-center gap-3">
          {searchTerm && (
            <button
              onClick={onClearFilters}
              className="px-4 py-2 rounded-lg dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 dark:hover:bg-white/10 hover:bg-slate-100 transition-colors"
            >
              Limpar Filtros
            </button>
          )}
          <NeonButton variant="green" onClick={onAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Usuário
          </NeonButton>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// Format relative time
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "Nunca";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Agora";
  if (diffMins < 60) return `${diffMins} min atrás`;
  if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? "s" : ""} atrás`;
  if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? "s" : ""} atrás`;
  return date.toLocaleDateString("pt-BR");
}

// Componente de badge de filtro ativo
function ActiveFilterBadge({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-emerald-300 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

export default function SuperCompanyUsersPage() {
  const {
    users,
    loading,
    error,
    refresh,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    // Novas funções de filtragem
    filters,
    updateFilters,
    resetFilters,
    getAvailableRoles,
    allRoleOptions,
  } = useCompanyUsers();

  const { companies } = useCompanies();

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);

  // State for delete confirmation
  const [deletingUser, setDeletingUser] = useState<CompanyUser | null>(null);

  // Opções de empresa para o select
  const companyOptions = useMemo(
    () => [
      { value: "all", label: "Todas as Empresas" },
      ...companies.map((company) => ({
        value: company.id,
        label: company.name,
      })),
    ],
    [companies]
  );

  // Opções de role baseadas na empresa selecionada
  const roleOptions = useMemo(() => {
    const availableRoles = getAvailableRoles(filters.companyId ?? null);
    return [
      { value: "all", label: "Todas as Funções" },
      ...availableRoles,
    ];
  }, [getAvailableRoles, filters.companyId]);

  // Verificar se há filtros ativos
  const hasActiveFilters = useMemo(() => {
    return (
      filters.companyId !== null ||
      filters.role !== null ||
      filters.status !== "all" ||
      (filters.searchTerm && filters.searchTerm.length > 0)
    );
  }, [filters]);

  // Calcular estatísticas reais
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.is_active).length;
    const inactive = total - active;
    const companiesSet = new Set(users.map((u) => u.company_id).filter(Boolean))
      .size;
    return { total, active, inactive, companies: companiesSet };
  }, [users]);

  // Handlers
  const handleAddUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: CompanyUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (
    userData: Parameters<typeof createUser>[0]
  ) => {
    if (editingUser) {
      // Remove password if empty (don't change password)
      const updateData = { ...userData };
      if (!updateData.password) {
        delete updateData.password;
        delete (updateData as { email?: string }).email;
      }
      return await updateUser(editingUser.id, updateData);
    } else {
      // Criar usuário com verificação automática de email
      return await createUser(userData, { autoVerifyEmail: true });
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    const result = await deleteUser(deletingUser.id);
    if (result.success) {
      setDeletingUser(null);
    }
  };

  const handleToggleStatus = async (user: CompanyUser) => {
    await toggleUserStatus(user.id, !user.is_active);
  };

  // Handler para mudança de empresa (reseta role se necessário)
  const handleCompanyChange = (value: string) => {
    const companyId = value === "all" ? null : value;
    updateFilters({
      companyId,
      role: null, // Resetar role ao mudar empresa
    });
  };

  // Handler para busca
  const handleSearchChange = (value: string) => {
    updateFilters({ searchTerm: value });
  };

  // Renderizar badges de filtros ativos
  const renderActiveFilters = () => {
    const badges = [];

    if (filters.companyId) {
      const company = companies.find((c) => c.id === filters.companyId);
      badges.push(
        <ActiveFilterBadge
          key="company"
          label={`Empresa: ${company?.name || "Selecionada"}`}
          onRemove={() => updateFilters({ companyId: null })}
        />
      );
    }

    if (filters.role) {
      badges.push(
        <ActiveFilterBadge
          key="role"
          label={`Função: ${roleLabels[filters.role]}`}
          onRemove={() => updateFilters({ role: null })}
        />
      );
    }

    if (filters.status && filters.status !== "all") {
      const statusLabel =
        filters.status === "active" ? "Ativos" : "Inativos";
      badges.push(
        <ActiveFilterBadge
          key="status"
          label={`Status: ${statusLabel}`}
          onRemove={() => updateFilters({ status: "all" })}
        />
      );
    }

    if (filters.searchTerm) {
      badges.push(
        <ActiveFilterBadge
          key="search"
          label={`Busca: "${filters.searchTerm}"`}
          onRemove={() => updateFilters({ searchTerm: "" })}
        />
      );
    }

    return badges;
  };

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
            <GlowBadge variant="green">Gestão</GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900">
            Usuários Cadastrados na Empresa
          </h1>
          <p className="dark:text-slate-400 text-slate-600 mt-1">
            Gerencie todos os usuários de todas as empresas
          </p>
        </div>
        <NeonButton variant="green" onClick={handleAddUser}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </NeonButton>
      </motion.div>

      {/* Stats */}
      <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total de Usuários", value: stats.total, icon: Users },
          { label: "Ativos", value: stats.active, icon: UserCheck },
          { label: "Inativos", value: stats.inactive, icon: UserX },
          { label: "Empresas", value: stats.companies, icon: Building2 },
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
                    <p className="dark:text-slate-400 text-slate-500 text-xs">
                      {stat.label}
                    </p>
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

      {/* Filters */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="p-4" hover={false}>
          <div className="space-y-4">
            {/* Linha de filtros principais */}
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1 min-w-[250px]">
                <AnimatedInput
                  placeholder="Buscar usuários por nome, email ou empresa..."
                  icon={<Search className="w-5 h-5" />}
                  value={filters.searchTerm || ""}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              {/* Filtro por Empresa */}
              <div className="w-full lg:w-64">
                <Select
                  value={filters.companyId || "all"}
                  onValueChange={handleCompanyChange}
                  options={companyOptions}
                  placeholder="Todas as Empresas"
                />
              </div>

              {/* Filtro por Role */}
              <div className="w-full lg:w-56">
                <Select
                  value={filters.role || "all"}
                  onValueChange={(value) =>
                    updateFilters({
                      role: value === "all" ? null : (value as UserRole),
                    })
                  }
                  options={roleOptions}
                  placeholder="Todas as Funções"
                />
              </div>

              {/* Filtro por Status */}
              <div className="w-full lg:w-48">
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) =>
                    updateFilters({
                      status: value as UserFilters["status"],
                    })
                  }
                  options={statusOptions}
                  placeholder="Status"
                />
              </div>

              {/* Botão de limpar filtros */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-lg dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 dark:hover:bg-white/10 hover:bg-slate-200 transition-colors flex items-center gap-2 whitespace-nowrap"
                  title="Limpar todos os filtros"
                >
                  <X className="w-4 h-4" />
                  Limpar
                </button>
              )}
            </div>

            {/* Filtros ativos (badges) */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t dark:border-white/10 border-slate-200">
                <span className="text-sm dark:text-slate-500 text-slate-500">
                  Filtros ativos:
                </span>
                {renderActiveFilters()}
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : users.length === 0 ? (
        <EmptyState
          searchTerm={filters.searchTerm || ""}
          onAdd={handleAddUser}
          onClearFilters={resetFilters}
        />
      ) : (
        /* Users Table */
        <motion.div variants={fadeInUp}>
          <GlassCard className="overflow-hidden" hover={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-emerald-500/10 border-slate-200">
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">
                      Usuário
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">
                      Empresa
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">
                      Função
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">
                      Último Login
                    </th>
                    <th className="text-right py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-white/5 divide-slate-100">
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "hover:dark:bg-white/[0.02] hover:bg-slate-50 transition-colors group",
                        !user.is_active && "opacity-60"
                      )}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0"
                            style={{
                              background: user.is_active
                                ? "linear-gradient(135deg, #10b981, #059669)"
                                : "linear-gradient(135deg, #64748b, #475569)",
                            }}
                          >
                            {user.full_name
                              ? user.full_name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .substring(0, 2)
                                  .toUpperCase()
                              : user.email.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium dark:text-white text-slate-900">
                              {user.full_name || "Sem nome"}
                            </p>
                            <p className="text-sm dark:text-slate-400 text-slate-500">
                              {user.email}
                            </p>
                            {user.phone && (
                              <p className="text-xs dark:text-slate-500 text-slate-400">
                                {user.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 dark:text-slate-400 text-slate-500" />
                          <span className="dark:text-slate-300 text-slate-700 text-sm">
                            {user.company?.name || "Sem empresa"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <GlowBadge variant={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </GlowBadge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              user.is_active ? "bg-emerald-500" : "bg-slate-500"
                            )}
                          />
                          <span
                            className={cn(
                              "text-sm",
                              user.is_active
                                ? "dark:text-emerald-400 text-emerald-600"
                                : "dark:text-slate-400 text-slate-500"
                            )}
                          >
                            {user.is_active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="dark:text-slate-400 text-slate-500 text-sm">
                          {formatRelativeTime(user.last_sign_in_at)}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              user.is_active
                                ? "dark:text-slate-400 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10"
                                : "dark:text-slate-400 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                            )}
                            title={
                              user.is_active
                                ? "Desativar usuário"
                                : "Ativar usuário"
                            }
                          >
                            {user.is_active ? (
                              <PowerOff className="w-4 h-4" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 rounded-lg dark:text-slate-400 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="Editar usuário"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="p-2 rounded-lg dark:text-slate-400 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Excluir usuário"
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

            {/* Results count */}
            <div className="px-6 py-4 border-t dark:border-white/10 border-slate-200 flex items-center justify-between">
              <p className="text-sm dark:text-slate-400 text-slate-500">
                Mostrando {users.length} usuário{users.length !== 1 ? "s" : ""}
                {hasActiveFilters && " (filtrados)"}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* User Modal */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveUser}
        user={editingUser}
        companies={companies}
        isLoading={loading}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 dark:bg-black/80 bg-slate-900/60 backdrop-blur-sm z-50"
              onClick={() => setDeletingUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50"
            >
              <GlassCard className="p-6" glow="red">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-2">
                    Excluir Usuário
                  </h3>
                  <p className="dark:text-slate-400 text-slate-500 mb-6">
                    Tem certeza que deseja excluir{" "}
                    <strong>{deletingUser.full_name || deletingUser.email}</strong>?
                    Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setDeletingUser(null)}
                      className="px-4 py-2 rounded-lg dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900 dark:hover:bg-white/10 hover:bg-slate-100 transition-colors"
                    >
                      Cancelar
                    </button>
                    <NeonButton variant="red" onClick={handleDeleteUser}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </NeonButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
