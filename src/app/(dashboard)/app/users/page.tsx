"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Plus,
  Filter,
  Edit,
  Trash2,
  Mail,
  Shield,
  User,
  Building2,
  Loader2,
  AlertCircle,
  Power,
  PowerOff,
  MoreVertical,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { Select } from "@/components/ui/select";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { useCompanyUsers, type CompanyUser } from "@/hooks/use-company-users";
import { useCompanies } from "@/hooks/use-companies";
import { useAuth } from "@/hooks/use-auth";
import { UserModal } from "@/components/modals";
import type { UserRole } from "@/types";

const roleColors: Record<UserRole, "green" | "emerald" | "blue" | "amber" | "purple" | "default"> = {
  SUPER_USER: "purple",
  CLIENT_ADMIN: "green",
  CLIENT_MANAGER: "emerald",
  CLIENT_AGENT: "blue",
  CLIENT_VIEWER: "amber",
};

const roleLabels: Record<UserRole, string> = {
  SUPER_USER: "Super Usuário",
  CLIENT_ADMIN: "Administrador",
  CLIENT_MANAGER: "Gerente",
  CLIENT_AGENT: "Agente",
  CLIENT_VIEWER: "Visualizador",
};

const statusLabels = {
  active: "Ativo",
  inactive: "Inativo",
};

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <motion.div variants={fadeInUp}>
      <GlassCard className="overflow-hidden" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-white/10 border-slate-200">
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Usuário</th>
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Função</th>
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Status</th>
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Último Acesso</th>
                <th className="text-right py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-white/5 divide-slate-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-32"></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16 ml-auto"></div>
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
        <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">Erro ao carregar usuários</h3>
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
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div variants={fadeInUp}>
      <GlassCard className="p-12 text-center" hover={false}>
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">Nenhum usuário encontrado</h3>
        <p className="dark:text-slate-400 text-slate-600 mb-6">
          Comece adicionando um novo usuário à sua equipe.
        </p>
        <NeonButton variant="green" onClick={onAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Usuário
        </NeonButton>
      </GlassCard>
    </motion.div>
  );
}

export default function UsersPage() {
  const { canManageUsers, isCompanyAdmin } = usePermissions();
  const { user: currentUser } = useAuth();
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  
  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CompanyUser | null>(null);
  
  // State for delete confirmation
  const [deletingUser, setDeletingUser] = useState<CompanyUser | null>(null);

  // Get company ID from current user
  const currentCompanyId = currentUser?.companyId || null;
  const isSuperUser = currentUser?.role === "SUPER_USER";

  // Fetch users - if super user, can see all users. If regular user, only see company users
  const { 
    users, 
    loading, 
    error, 
    totalCount,
    refresh,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
  } = useCompanyUsers(isSuperUser ? undefined : currentCompanyId);

  // Fetch companies for filter
  const { companies, loading: loadingCompanies } = useCompanies();

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = 
        (user.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone || "").includes(searchQuery);
      
      const matchesRole = selectedRole === "all" || user.role === selectedRole;
      const matchesStatus = selectedStatus === "all" || 
        (selectedStatus === "active" ? user.is_active : !user.is_active);
      const matchesCompany = selectedCompany === "all" || user.company_id === selectedCompany;
      
      return matchesSearch && matchesRole && matchesStatus && matchesCompany;
    });
  }, [users, searchQuery, selectedRole, selectedStatus, selectedCompany]);

  // Stats
  const stats = useMemo(() => {
    const activeUsers = users.filter((u) => u.is_active).length;
    const adminUsers = users.filter((u) => u.role === "CLIENT_ADMIN").length;
    const agentUsers = users.filter((u) => u.role === "CLIENT_AGENT").length;
    
    return {
      total: users.length,
      active: activeUsers,
      admins: adminUsers,
      agents: agentUsers,
    };
  }, [users]);

  // Check permissions
  if (!canManageUsers()) {
    return (
      <div className="flex items-center justify-center h-full">
        <GlassCard className="p-8 text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-2">Acesso Restrito</h2>
          <p className="dark:text-slate-400 text-slate-500">
            Você não tem permissão para gerenciar usuários.
          </p>
        </GlassCard>
      </div>
    );
  }

  // Handlers
  const handleAddUser = () => {
    console.log("[UsersPage] handleAddUser called");
    setEditingUser(null);
    setIsModalOpen(true);
    console.log("[UsersPage] isModalOpen set to true");
  };

  const handleEditUser = (user: CompanyUser) => {
    console.log("[UsersPage] handleEditUser called", user);
    setEditingUser(user);
    setIsModalOpen(true);
    console.log("[UsersPage] isModalOpen set to true for editing");
  };

  const handleSaveUser = async (userData: Parameters<typeof createUser>[0]) => {
    if (editingUser) {
      // Remove password if empty (don't change password)
      const updateData = { ...userData };
      if (!updateData.password) {
        delete updateData.password;
        delete (updateData as { email?: string }).email;
      }
      return await updateUser(editingUser.id, updateData);
    } else {
      return await createUser(userData);
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

  // Filter options
  const roleFilterOptions = [
    { value: "all", label: "Todas as Funções" },
    { value: "CLIENT_ADMIN", label: "Administrador" },
    { value: "CLIENT_MANAGER", label: "Gerente" },
    { value: "CLIENT_AGENT", label: "Agente" },
    { value: "CLIENT_VIEWER", label: "Visualizador" },
  ];

  const statusFilterOptions = [
    { value: "all", label: "Todos os Status" },
    { value: "active", label: "Ativo" },
    { value: "inactive", label: "Inativo" },
  ];

  const companyFilterOptions = [
    { value: "all", label: "Todas as Empresas" },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  // Format last sign in
  const formatLastSignIn = (date: string | null) => {
    if (!date) return "Nunca";
    
    const lastSignIn = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - lastSignIn.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 30) return `${diffDays} dias atrás`;
    
    return lastSignIn.toLocaleDateString("pt-BR");
  };

  // Get user initials
  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6"
      >
        <motion.div variants={fadeInUp}>
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-48 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
        </motion.div>
        <LoadingSkeleton />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6"
      >
        <ErrorState error={error} onRetry={refresh} />
      </motion.div>
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
      <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GlowBadge variant="green">Gestão</GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900">
            Gerenciamento de Usuários
          </h1>
          <p className="dark:text-slate-400 text-slate-500 mt-1">
            Gerencie permissões e acessos da equipe
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
          { label: "Usuários Ativos", value: stats.active, icon: User },
          { label: "Administradores", value: stats.admins, icon: Shield },
          { label: "Agentes", value: stats.agents, icon: Mail },
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
        })}
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="p-4" hover={false}>
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="w-full md:w-96">
              <AnimatedInput
                placeholder="Buscar por nome, e-mail ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5 dark:text-slate-400 text-slate-500" />}
              />
            </div>
            
            {/* Filter Selects */}
            <div className="flex flex-wrap gap-3">
              {/* Company Filter - Only for super users */}
              {isSuperUser && (
                <Select
                  value={selectedCompany}
                  onValueChange={setSelectedCompany}
                  options={companyFilterOptions}
                  placeholder="Filtrar por empresa..."
                  className="w-full md:w-56"
                />
              )}
              
              <Select
                value={selectedRole}
                onValueChange={setSelectedRole}
                options={roleFilterOptions}
                placeholder="Filtrar por função..."
                className="w-full md:w-48"
              />
              
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                options={statusFilterOptions}
                placeholder="Filtrar por status..."
                className="w-full md:w-40"
              />
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
        <EmptyState onAdd={handleAddUser} />
      ) : (
        <motion.div variants={fadeInUp}>
          <GlassCard className="overflow-hidden" hover={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-white/10 border-slate-200">
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Usuário</th>
                    {isSuperUser && (
                      <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Empresa</th>
                    )}
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Função</th>
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Último Acesso</th>
                    <th className="text-right py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-white/5 divide-slate-100">
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "dark:hover:bg-white/[0.02] hover:bg-slate-50 transition-colors",
                        !user.is_active && "opacity-60"
                      )}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
                            style={{
                              background: user.is_active
                                ? "linear-gradient(135deg, #10b981, #059669)"
                                : "linear-gradient(135deg, #64748b, #475569)",
                            }}
                          >
                            {getInitials(user.full_name)}
                          </div>
                          <div>
                            <p className="font-medium dark:text-white text-slate-900">
                              {user.full_name || "Sem nome"}
                            </p>
                            <p className="text-sm dark:text-slate-400 text-slate-500">{user.email}</p>
                            {user.phone && (
                              <p className="text-xs dark:text-slate-500 text-slate-400">{user.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {isSuperUser && (
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 dark:text-slate-400 text-slate-500" />
                            <span className="dark:text-slate-300 text-slate-700 text-sm">
                              {user.company?.name || "Sem empresa"}
                            </span>
                          </div>
                        </td>
                      )}
                      
                      <td className="py-4 px-6">
                        <GlowBadge variant={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </GlowBadge>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            user.is_active ? "bg-emerald-500" : "bg-slate-500"
                          )} />
                          <span className={cn(
                            "text-sm",
                            user.is_active 
                              ? "dark:text-emerald-400 text-emerald-600" 
                              : "dark:text-slate-400 text-slate-500"
                          )}>
                            {user.is_active ? "Ativo" : "Inativo"}
                          </span>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <span className="dark:text-slate-400 text-slate-500 text-sm">
                          {formatLastSignIn(user.last_sign_in_at)}
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
                            title={user.is_active ? "Desativar usuário" : "Ativar usuário"}
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
                          
                          {/* Delete - Only for company admins */}
                          {isCompanyAdmin() && user.role !== "CLIENT_ADMIN" && (
                            <button
                              onClick={() => setDeletingUser(user)}
                              className="p-2 rounded-lg dark:text-slate-400 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Excluir usuário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Results count */}
            <div className="px-6 py-4 border-t dark:border-white/10 border-slate-200">
              <p className="text-sm dark:text-slate-400 text-slate-500">
                Mostrando {filteredUsers.length} de {totalCount} usuários
              </p>
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
        currentCompanyId={currentCompanyId || undefined}
        isLoading={loadingCompanies}
      />

      {/* Delete Confirmation Modal */}
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
                  Tem certeza que deseja excluir <strong>{deletingUser.full_name || deletingUser.email}</strong>?
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
    </motion.div>
  );
}
