"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { Building2, Plus, Search, MoreVertical, Edit, Trash2, Users, CheckCircle, XCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

// Mock companies data
const companies = [
  { id: 1, name: "Empresa ABC Ltda", cnpj: "12.345.678/0001-90", email: "contato@empresaabc.com", plan: "Profissional", users: 8, maxUsers: 10, isActive: true, expiresAt: "2024-12-31" },
  { id: 2, name: "Tech Solutions SA", cnpj: "98.765.432/0001-10", email: "admin@techsolutions.com", plan: "Empresarial", users: 25, maxUsers: -1, isActive: true, expiresAt: "2025-06-30" },
  { id: 3, name: "Comércio Silva", cnpj: "11.222.333/0001-44", email: "silva@comercio.com", plan: "Básico", users: 3, maxUsers: 3, isActive: true, expiresAt: "2024-10-15" },
  { id: 4, name: "Mega Corp", cnpj: "55.666.777/0001-88", email: "ti@megacorp.com", plan: "Personalizado", users: 45, maxUsers: -1, isActive: true, expiresAt: "2025-12-31" },
  { id: 5, name: "Startup Inovadora", cnpj: "33.444.555/0001-22", email: "hello@startup.com", plan: "Básico", users: 2, maxUsers: 3, isActive: false, expiresAt: "2024-08-01" },
];

const planColors: Record<string, string> = {
  "Básico": "emerald",
  "Profissional": "green",
  "Empresarial": "emerald",
  "Personalizado": "green",
};

export default function SuperCompaniesPage() {
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
            Empresas
          </h1>
          <p className="text-slate-400 mt-1">
            Gerencie todas as empresas cadastradas no sistema
          </p>
        </div>
        <NeonButton variant="green">
          <Plus className="w-4 h-4 mr-2" />
          Nova Empresa
        </NeonButton>
      </motion.div>

      {/* Stats */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total de Empresas", value: "24", icon: Building2 },
          { label: "Ativas", value: "22", icon: CheckCircle },
          { label: "Inativas", value: "2", icon: XCircle },
          { label: "Total de Usuários", value: "156", icon: Users },
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

      {/* Search */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="p-4" hover={false}>
          <AnimatedInput
            placeholder="Buscar empresas por nome, CNPJ ou email..."
            icon={<Search className="w-5 h-5 text-slate-400" />}
          />
        </GlassCard>
      </motion.div>

      {/* Companies Table */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="overflow-hidden" hover={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-emerald-500/10">
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Empresa</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Plano</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Usuários</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Validade</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {companies.map((company, index) => (
                  <motion.tr
                    key={company.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-medium text-white">{company.name}</p>
                        <p className="text-sm text-slate-400">{company.cnpj}</p>
                        <p className="text-xs text-slate-500">{company.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <GlowBadge variant={planColors[company.plan] as any}>
                        {company.plan}
                      </GlowBadge>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-white">
                          {company.users}
                          {company.maxUsers > 0 && `/${company.maxUsers}`}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          company.isActive ? "bg-emerald-400" : "bg-red-400"
                        )} />
                        <span className={company.isActive ? "text-emerald-400" : "text-red-400"}>
                          {company.isActive ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-400 text-sm">
                        {new Date(company.expiresAt).toLocaleDateString("pt-BR")}
                      </span>
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
