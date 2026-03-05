"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { CreditCard, Plus, Edit, Trash2, Check, Crown } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { staggerContainer, fadeInUp } from "@/lib/animations";

// Mock plans data
const plans = [
  {
    id: 1,
    name: "Básico",
    type: "basic",
    price: 99,
    description: "Ideal para pequenas empresas",
    features: [
      "Até 3 usuários",
      "1.000 atendimentos/mês",
      "Suporte por email",
      "Relatórios básicos",
    ],
    maxUsers: 3,
    maxAttendances: 1000,
    hasApiAccess: false,
    hasBulkMessaging: false,
    hasAdvancedAnalytics: false,
    activeCompanies: 12,
  },
  {
    id: 2,
    name: "Profissional",
    type: "professional",
    price: 299,
    description: "Para empresas em crescimento",
    features: [
      "Até 10 usuários",
      "5.000 atendimentos/mês",
      "Suporte prioritário",
      "Relatórios avançados",
      "API de integração",
    ],
    maxUsers: 10,
    maxAttendances: 5000,
    hasApiAccess: true,
    hasBulkMessaging: true,
    hasAdvancedAnalytics: true,
    activeCompanies: 8,
    isPopular: true,
  },
  {
    id: 3,
    name: "Empresarial",
    type: "enterprise",
    price: 799,
    description: "Solução completa para grandes empresas",
    features: [
      "Usuários ilimitados",
      "Atendimentos ilimitados",
      "Suporte 24/7",
      "Relatórios personalizados",
      "API completa",
      "Disparo em massa",
      "Onboarding dedicado",
    ],
    maxUsers: -1,
    maxAttendances: -1,
    hasApiAccess: true,
    hasBulkMessaging: true,
    hasAdvancedAnalytics: true,
    activeCompanies: 3,
  },
  {
    id: 4,
    name: "Personalizado",
    type: "custom",
    price: null,
    description: "Solução sob medida",
    features: [
      "Tudo do Empresarial",
      "Desenvolvimentos customizados",
      "SLA garantido",
      "Gerente de conta dedicado",
    ],
    maxUsers: -1,
    maxAttendances: -1,
    hasApiAccess: true,
    hasBulkMessaging: true,
    hasAdvancedAnalytics: true,
    activeCompanies: 1,
  },
];

export default function SuperPlansPage() {
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
            <GlowBadge variant="green" pulse>
              <Crown className="w-3 h-3 mr-1" />
              Super Admin
            </GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Planos do Super Usuário
          </h1>
          <p className="text-slate-400 mt-1">
            Gerencie os planos disponíveis para as empresas
          </p>
        </div>
        <NeonButton variant="green">
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </NeonButton>
      </motion.div>

      {/* Stats */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total de Planos", value: "4", subtext: "Ativos" },
          { label: "Empresas Ativas", value: "24", subtext: "Usando planos" },
          { label: "Receita Mensal", value: "R$ 12.4K", subtext: "Recorrente" },
          { label: "Ticket Médio", value: "R$ 516", subtext: "Por empresa" },
        ].map((stat, index) => (
          <motion.div key={stat.label} variants={fadeInUp} custom={index}>
            <GlassCard className="p-4" glow="green">
              <p className="text-slate-400 text-xs">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              <p className="text-xs text-emerald-400">{stat.subtext}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* Plans Grid */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
      >
        {plans.map((plan, index) => (
          <motion.div key={plan.id} variants={fadeInUp} custom={index}>
            <GlassCard 
              className="h-full flex flex-col" 
              glow={plan.isPopular ? "green" : "none"}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-emerald-500 text-black text-xs font-bold rounded-full">
                    Mais Popular
                  </span>
                </div>
              )}
              
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-emerald-400 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  {plan.price ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">
                        R$ {plan.price}
                      </span>
                      <span className="text-slate-400">/mês</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-emerald-400">
                      Sob Consulta
                    </span>
                  )}
                  <p className="text-sm text-slate-400 mt-1">{plan.description}</p>
                </div>

                <div className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Empresas:</span>
                    <span className="text-emerald-400 font-medium">
                      {plan.activeCompanies} ativas
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
