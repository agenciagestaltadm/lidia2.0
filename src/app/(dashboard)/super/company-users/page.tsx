"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { Users, Search, Filter, MoreVertical, Edit, Trash2, Building2, UserCheck, UserX } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

// Mock company users data
const companyUsers = [
  { id: 1, name: "Ana Silva", email: "ana.silva@empresaabc.com", company: "Empresa ABC Ltda", role: "Admin", isActive: true, lastLogin: "2 min atrás" },
  { id: 2, name: "Carlos Santos", email: "carlos@techsolutions.com", company: "Tech Solutions SA", role: "Manager", isActive: true, lastLogin: "15 min atrás" },
  { id: 3, name: "Mariana Costa", email: "mariana@empresaabc.com", company: "Empresa ABC Ltda", role: "Agent", isActive: true, lastLogin: "1 hora atrás" },
  { id: 4, name: "Pedro Lima", email: "pedro@techsolutions.com", company: "Tech Solutions SA", role: "Agent", isActive: false, lastLogin: "3 dias atrás" },
  { id: 5, name: "Juliana Martins", email: "juliana@megacorp.com", company: "Mega Corp", role: "Admin", isActive: true, lastLogin: "30 min atrás" },
  { id: 6, name: "Ricardo Oliveira", email: "ricardo@comercio.com", company: "Comércio Silva", role: "Manager", isActive: true, lastLogin: "2 horas atrás" },
];

const roleColors: Record<string, string> = {
  Admin: "green",
  Manager: "emerald",
  Agent: "default",
};

export default function SuperCompanyUsersPage() {
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
            Usuários Cadastrados na Empresa
          </h1>
          <p className="text-slate-400 mt-1">
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
          { label: "Total de Usuários", value: "156", icon: Users },
          { label: "Ativos", value: "142", icon: UserCheck },
          { label: "Inativos", value: "14", icon: UserX },
          { label: "Empresas", value: "24", icon: Building2 },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={fadeInUp} custom={index}>
              <GlassCard className="p-4" glow={index % 2 === 0 ? "green" : "none"}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
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
                icon={<Search className="w-5 h-5 text-slate-400" />}
              />
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-colors flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtrar
              </button>
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
                <tr className="border-b border-emerald-500/10">
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Usuário</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Empresa</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Função</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Último Login</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {companyUsers.map((user, index) => (
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
                            background: "linear-gradient(135deg, #10b981, #059669)",
                          }}
                        >
                          {user.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-sm text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300 text-sm">{user.company}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <GlowBadge variant={roleColors[user.role] as any}>
                        {user.role}
                      </GlowBadge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          user.isActive ? "bg-emerald-400" : "bg-slate-500"
                        )} />
                        <span className={user.isActive ? "text-emerald-400" : "text-slate-400"}>
                          {user.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-400 text-sm">{user.lastLogin}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-emerald-400 transition-colors">
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
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
