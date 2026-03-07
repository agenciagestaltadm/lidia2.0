"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { Users, Search, Filter, Edit, Trash2, Building2, UserCheck, UserX, Loader2, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { AnimatedInput } from "@/components/ui/animated-input";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useCompanyUsers } from "@/hooks/use-company-users";
import { useState, useMemo } from "react";

const roleColors: Record<string, "green" | "emerald" | "red" | "blue" | "amber" | "default"> = {
  CLIENT_ADMIN: "green",
  CLIENT_MANAGER: "emerald",
  CLIENT_AGENT: "default",
  CLIENT_VIEWER: "blue",
};

const roleLabels: Record<string, string> = {
  CLIENT_ADMIN: "Admin",
  CLIENT_MANAGER: "Manager",
  CLIENT_AGENT: "Agent",
  CLIENT_VIEWER: "Viewer",
};

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <motion.div variants={fadeInUp}>
      <GlassCard className="overflow-hidden" hover={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-emerald-500/10 border-slate-200">
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Usuário</th>
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Empresa</th>
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Função</th>
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Status</th>
                <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Último Login</th>
                <th className="text-right py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Ações</th>
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
function EmptyState({ searchTerm }: { searchTerm: string }) {
  return (
    <motion.div variants={fadeInUp}>
      <GlassCard className="p-8 text-center" hover={false}>
        <Users className="w-12 h-12 mx-auto mb-4 dark:text-slate-600 text-slate-400" />
        <h3 className="text-lg font-medium dark:text-white text-slate-900 mb-2">
          {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
        </h3>
        <p className="dark:text-slate-400 text-slate-600">
          {searchTerm 
            ? "Tente buscar com outros termos" 
            : "Os usuários aparecerão aqui quando forem cadastrados"}
        </p>
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
  if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
  if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
  return date.toLocaleDateString("pt-BR");
}

export default function SuperCompanyUsersPage() {
  const { users, loading, error, refresh } = useCompanyUsers();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(user => 
      user.full_name?.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.company?.name.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // Calculate real statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.is_active).length;
    const inactive = total - active;
    const companies = new Set(users.map(u => u.company_id).filter(Boolean)).size;
    return { total, active, inactive, companies };
  }, [users]);

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
            Usuários Cadastrados na Empresa
          </h1>
          <p className="dark:text-slate-400 text-slate-600 mt-1">
            Gerencie todos os usuários de todas as empresas
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
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

      {/* Filters */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="p-4" hover={false}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <AnimatedInput
                placeholder="Buscar usuários..."
                icon={<Search className="w-5 h-5" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg dark:bg-white/5 bg-slate-100 dark:text-slate-400 text-slate-600 hover:dark:bg-white/10 hover:bg-slate-200 transition-colors flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtrar
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : filteredUsers.length === 0 ? (
        <EmptyState searchTerm={searchTerm} />
      ) : (
        /* Users Table */
        <motion.div variants={fadeInUp}>
          <GlassCard className="overflow-hidden" hover={false}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-emerald-500/10 border-slate-200">
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Usuário</th>
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Empresa</th>
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Função</th>
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-medium dark:text-slate-400 text-slate-500">Último Login</th>
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
                      className="hover:dark:bg-white/[0.02] hover:bg-slate-50 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white shrink-0"
                            style={{
                              background: "linear-gradient(135deg, #10b981, #059669)",
                            }}
                          >
                            {user.full_name 
                              ? user.full_name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                              : user.email.substring(0, 2).toUpperCase()
                            }
                          </div>
                          <div>
                            <p className="font-medium dark:text-white text-slate-900">
                              {user.full_name || "Sem nome"}
                            </p>
                            <p className="text-sm dark:text-slate-400 text-slate-500">{user.email}</p>
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
                        <GlowBadge variant={roleColors[user.role] || "default"}>
                          {roleLabels[user.role] || user.role}
                        </GlowBadge>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            user.is_active ? "bg-emerald-400" : "bg-slate-400"
                          )} />
                          <span className={user.is_active ? "dark:text-emerald-400 text-emerald-600" : "dark:text-slate-400 text-slate-500"}>
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
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 rounded-lg hover:dark:bg-white/5 hover:bg-slate-100 dark:text-slate-400 text-slate-500 hover:dark:text-emerald-400 hover:text-emerald-600 transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg hover:dark:bg-white/5 hover:bg-slate-100 dark:text-slate-400 text-slate-500 hover:dark:text-red-400 hover:text-red-500 transition-colors">
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
    </motion.div>
  );
}
