"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Search, 
  Plus, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Shield,
  User,
  Check,
  X,
  Save,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { UserRole, UserPermissions, DEFAULT_PERMISSIONS } from "@/types";

// Mock data for users
const mockUsers = [
  { id: "1", name: "Ana Silva", email: "ana.silva@empresa.com", role: "CLIENT_ADMIN" as UserRole, status: "active", lastActive: "2 min atrás", avatar: "AS" },
  { id: "2", name: "Carlos Santos", email: "carlos.santos@empresa.com", role: "CLIENT_MANAGER" as UserRole, status: "active", lastActive: "15 min atrás", avatar: "CS" },
  { id: "3", name: "Mariana Costa", email: "mariana.costa@empresa.com", role: "CLIENT_AGENT" as UserRole, status: "active", lastActive: "1 hora atrás", avatar: "MC" },
  { id: "4", name: "Pedro Lima", email: "pedro.lima@empresa.com", role: "CLIENT_AGENT" as UserRole, status: "offline", lastActive: "3 horas atrás", avatar: "PL" },
  { id: "5", name: "Juliana Martins", email: "juliana.martins@empresa.com", role: "CLIENT_MANAGER" as UserRole, status: "active", lastActive: "30 min atrás", avatar: "JM" },
  { id: "6", name: "Ricardo Oliveira", email: "ricardo.oliveira@empresa.com", role: "CLIENT_AGENT" as UserRole, status: "offline", lastActive: "1 dia atrás", avatar: "RO" },
];

// Permission configuration for UI
const PERMISSIONS_CONFIG: { key: keyof UserPermissions; label: string; description: string }[] = [
  { key: "canViewCentral", label: "Página Central", description: "Acesso à página central" },
  { key: "canViewAttendances", label: "Atendimentos", description: "Gerenciar atendimentos" },
  { key: "canViewContacts", label: "Contatos", description: "Gerenciar contatos" },
  { key: "canSendBulk", label: "Disparo em Bulk", description: "Enviar mensagens em massa" },
  { key: "canViewKanban", label: "Kanban", description: "Acesso ao pipeline" },
  { key: "canManageConnection", label: "Canal de Conexão", description: "Configurar canais" },
  { key: "canManageUsers", label: "Gerenciar Usuários", description: "Criar/editar usuários" },
  { key: "canViewSettings", label: "Configurações", description: "Acesso às configurações" },
];

const roleColors: Record<UserRole, string> = {
  SUPER_USER: "purple",
  CLIENT_ADMIN: "green",
  CLIENT_MANAGER: "emerald",
  CLIENT_AGENT: "default",
};

const roleLabels: Record<UserRole, string> = {
  SUPER_USER: "Super Usuário",
  CLIENT_ADMIN: "Administrador",
  CLIENT_MANAGER: "Gerente",
  CLIENT_AGENT: "Agente",
};

export default function UsersPage() {
  const { isCompanyAdmin, canManageUsers } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, UserPermissions>>({});

  // Check if user can manage this page
  if (!canManageUsers()) {
    return (
      <div className="flex items-center justify-center h-full">
        <GlassCard className="p-8 text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
          <p className="text-slate-400">
            Você não tem permissão para gerenciar usuários.
          </p>
        </GlassCard>
      </div>
    );
  }

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleEditPermissions = (userId: string, currentRole: UserRole) => {
    setEditingUser(userId);
    // Initialize with default permissions based on role
    const defaults = DEFAULT_PERMISSIONS[currentRole as Exclude<UserRole, "SUPER_USER">];
    setUserPermissions(prev => ({
      ...prev,
      [userId]: prev[userId] || defaults
    }));
  };

  const handlePermissionChange = (userId: string, permission: keyof UserPermissions, value: boolean) => {
    setUserPermissions(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [permission]: value
      }
    }));
  };

  const handleSavePermissions = async (userId: string) => {
    // Here you would call the API to save permissions
    // await updateUserPermissions(userId, userPermissions[userId]);
    setEditingUser(null);
  };

  const handleSetAllPermissions = (userId: string, role: Exclude<UserRole, "SUPER_USER">) => {
    setUserPermissions(prev => ({
      ...prev,
      [userId]: { ...DEFAULT_PERMISSIONS[role] }
    }));
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
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Gerenciamento de Usuários
          </h1>
          <p className="text-slate-400 mt-1">
            Gerencie permissões e acessos da equipe
          </p>
        </div>
        <NeonButton variant="green">
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </NeonButton>
      </motion.div>

      {/* Stats */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total de Usuários", value: mockUsers.length, icon: Users },
          { label: "Ativos Agora", value: "4", icon: User },
          { label: "Administradores", value: "1", icon: Shield },
          { label: "Agentes", value: "3", icon: Mail },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={fadeInUp} custom={index}>
              <GlassCard className="p-4" glow="green">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">{stat.label}</p>
                    <p className="text-xl font-bold text-white">{stat.value}</p>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5 text-slate-400" />}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "CLIENT_ADMIN", "CLIENT_MANAGER", "CLIENT_AGENT"].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    selectedRole === role
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/5 text-slate-400 hover:bg-white/10"
                  )}
                >
                  {role === "all" ? "Todos" : roleLabels[role as UserRole]}
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Users Table */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="overflow-hidden" hover={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Usuário</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Função</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Último Acesso</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
                          style={{
                            background: "linear-gradient(135deg, #10b981, #059669)",
                          }}
                        >
                          {user.avatar}
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-sm text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <GlowBadge variant={roleColors[user.role] as any}>
                        {roleLabels[user.role]}
                      </GlowBadge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          user.status === "active" ? "bg-emerald-500" : "bg-slate-500"
                        )} />
                        <span className="text-slate-300 text-sm capitalize">
                          {user.status === "active" ? "Ativo" : "Offline"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-400 text-sm">{user.lastActive}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditPermissions(user.id, user.role)}
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          title="Editar Permissões"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        {isCompanyAdmin() && user.role !== "CLIENT_ADMIN" && (
                          <button className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
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
        </GlassCard>
      </motion.div>

      {/* Permission Editor Modal */}
      <AnimatePresence>
        {editingUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              onClick={() => setEditingUser(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[90vh] overflow-auto z-50"
            >
              <GlassCard className="h-full" glow="green">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white">Gerenciar Permissões</h2>
                      <p className="text-slate-400 text-sm">
                        Configure as permissões de acesso do usuário
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingUser(null)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Quick Templates */}
                  <div className="mb-6">
                    <p className="text-sm font-medium text-slate-300 mb-3">Templates Rápidos</p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleSetAllPermissions(editingUser, "CLIENT_ADMIN")}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm hover:bg-emerald-500/30 transition-colors"
                      >
                        Administrador (Tudo)
                      </button>
                      <button
                        onClick={() => handleSetAllPermissions(editingUser, "CLIENT_MANAGER")}
                        className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition-colors"
                      >
                        Gerente (Padrão)
                      </button>
                      <button
                        onClick={() => handleSetAllPermissions(editingUser, "CLIENT_AGENT")}
                        className="px-3 py-1.5 rounded-lg bg-slate-500/20 text-slate-400 text-sm hover:bg-slate-500/30 transition-colors"
                      >
                        Agente (Básico)
                      </button>
                    </div>
                  </div>

                  {/* Permissions Grid */}
                  <div className="grid gap-3 mb-6">
                    {PERMISSIONS_CONFIG.map((perm) => {
                      const isEnabled = userPermissions[editingUser]?.[perm.key] ?? false;
                      return (
                        <div
                          key={perm.key}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer",
                            isEnabled
                              ? "bg-emerald-500/10 border-emerald-500/30"
                              : "bg-white/5 border-white/10 hover:bg-white/[0.07]"
                          )}
                          onClick={() => handlePermissionChange(editingUser, perm.key, !isEnabled)}
                        >
                          <div className="flex items-center gap-3">
                            {isEnabled ? (
                              <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded border border-slate-500" />
                            )}
                            <div>
                              <p className={cn(
                                "font-medium",
                                isEnabled ? "text-emerald-400" : "text-slate-300"
                              )}>
                                {perm.label}
                              </p>
                              <p className="text-xs text-slate-500">{perm.description}</p>
                            </div>
                          </div>
                          {isEnabled ? (
                            <ToggleRight className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-slate-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      Cancelar
                    </button>
                    <NeonButton variant="green" onClick={() => handleSavePermissions(editingUser)}>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Permissões
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
