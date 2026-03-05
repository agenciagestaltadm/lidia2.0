"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion } from "framer-motion";
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
  User
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

// Mock data for users
const users = [
  { id: 1, name: "Ana Silva", email: "ana.silva@empresa.com", role: "Admin", status: "active", lastActive: "2 min atrás", avatar: "AS" },
  { id: 2, name: "Carlos Santos", email: "carlos.santos@empresa.com", role: "Manager", status: "active", lastActive: "15 min atrás", avatar: "CS" },
  { id: 3, name: "Mariana Costa", email: "mariana.costa@empresa.com", role: "Agent", status: "active", lastActive: "1 hora atrás", avatar: "MC" },
  { id: 4, name: "Pedro Lima", email: "pedro.lima@empresa.com", role: "Agent", status: "offline", lastActive: "3 horas atrás", avatar: "PL" },
  { id: 5, name: "Juliana Martins", email: "juliana.martins@empresa.com", role: "Viewer", status: "active", lastActive: "30 min atrás", avatar: "JM" },
  { id: 6, name: "Ricardo Oliveira", email: "ricardo.oliveira@empresa.com", role: "Agent", status: "offline", lastActive: "1 dia atrás", avatar: "RO" },
];

const roleColors: Record<string, string> = {
  Admin: "cyan",
  Manager: "violet",
  Agent: "fuchsia",
  Viewer: "default",
};

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

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
            <GlowBadge variant="cyan">Gestão</GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Gerenciamento de Usuários
          </h1>
          <p className="text-slate-400 mt-1">
            Gerencie permissões e acessos da equipe
          </p>
        </div>
        <NeonButton variant="cyan">
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
          { label: "Total de Usuários", value: users.length, icon: Users },
          { label: "Ativos Agora", value: "4", icon: User },
          { label: "Administradores", value: "1", icon: Shield },
          { label: "Agentes", value: "3", icon: Mail },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={fadeInUp} custom={index}>
              <GlassCard className="p-4" glow={index % 2 === 0 ? "cyan" : "violet"}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    <Icon className="w-5 h-5 text-cyan-400" />
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
            <div className="flex gap-2">
              {["all", "Admin", "Manager", "Agent", "Viewer"].map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    selectedRole === role
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : "bg-white/5 text-slate-400 hover:bg-white/10"
                  )}
                >
                  {role === "all" ? "Todos" : role}
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
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Última Atividade</th>
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
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white"
                          style={{
                            background: "linear-gradient(135deg, #00f0ff, #8b5cf6)",
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
                        {user.role}
                      </GlowBadge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${user.status === "active" ? "bg-emerald-400" : "bg-slate-500"}`} />
                        <span className={user.status === "active" ? "text-emerald-400" : "text-slate-400"}>
                          {user.status === "active" ? "Online" : "Offline"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-400 text-sm">{user.lastActive}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-cyan-400 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="py-12 text-center">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Nenhum usuário encontrado</p>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
