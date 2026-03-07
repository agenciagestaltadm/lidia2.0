"use client";

export const dynamic = "force-dynamic";

import { motion } from "framer-motion";
import { 
  Contact, 
  Search,
  Plus,
  Phone,
  Mail,
  Building,
  MoreVertical,
  Filter
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Mock data for contacts
const contacts = [
  { 
    id: 1, 
    name: "João Silva", 
    email: "joao.silva@email.com",
    phone: "(11) 99999-9999",
    company: "Empresa ABC",
    tags: ["Cliente", "VIP"],
    lastContact: "2 dias atrás"
  },
  { 
    id: 2, 
    name: "Maria Santos", 
    email: "maria.santos@email.com",
    phone: "(11) 98888-8888",
    company: "Empresa XYZ",
    tags: ["Lead"],
    lastContact: "1 semana atrás"
  },
  { 
    id: 3, 
    name: "Pedro Costa", 
    email: "pedro.costa@email.com",
    phone: "(11) 97777-7777",
    company: "Costa Ltda",
    tags: ["Cliente"],
    lastContact: "3 dias atrás"
  },
  { 
    id: 4, 
    name: "Ana Oliveira", 
    email: "ana.oliveira@email.com",
    phone: "(11) 96666-6666",
    company: "Oliveira Corp",
    tags: ["Parceiro"],
    lastContact: "Ontem"
  },
];

const tagColors: Record<string, string> = {
  "Cliente": "bg-emerald-500/20 text-emerald-400",
  "Lead": "bg-amber-500/20 text-amber-400",
  "VIP": "bg-purple-500/20 text-purple-400",
  "Parceiro": "bg-blue-500/20 text-blue-400",
};

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <GlowBadge variant="green">Contatos</GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-900">
            Gerenciamento de Contatos
          </h1>
          <p className="dark:text-slate-400 text-slate-500 mt-1">
            Organize e gerencie seus contatos e clientes
          </p>
        </div>
        <NeonButton variant="green">
          <Plus className="w-4 h-4 mr-2" />
          Novo Contato
        </NeonButton>
      </motion.div>

      {/* Stats */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: "Total de Contatos", value: "156", icon: Contact },
          { label: "Clientes", value: "89", icon: Building },
          { label: "Leads", value: "45", icon: Filter },
          { label: "Novos Este Mês", value: "12", icon: Plus },
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

      {/* Search */}
      <motion.div variants={fadeInUp}>
        <GlassCard className="p-4" hover={false}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <AnimatedInput
                placeholder="Buscar contatos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="w-5 h-5 dark:text-slate-400 text-slate-500" />}
              />
            </div>
            <NeonButton variant="ghost" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </NeonButton>
          </div>
        </GlassCard>
      </motion.div>

      {/* Contacts Grid */}
      <motion.div 
        variants={staggerContainer}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {filteredContacts.map((contact, index) => (
          <motion.div
            key={contact.id}
            variants={fadeInUp}
            custom={index}
          >
            <GlassCard className="p-5 group cursor-pointer" glow="green">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-medium">
                    {contact.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h3 className="font-medium dark:text-white text-slate-900">{contact.name}</h3>
                    <p className="text-sm dark:text-slate-400 text-slate-500">{contact.company}</p>
                  </div>
                </div>
                <button className="p-2 rounded-lg dark:hover:bg-white/5 hover:bg-slate-100 dark:text-slate-400 text-slate-500 opacity-0 group-hover:opacity-100 transition-all">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm dark:text-slate-400 text-slate-500">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{contact.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm dark:text-slate-400 text-slate-500">
                  <Phone className="w-4 h-4" />
                  <span>{contact.phone}</span>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-1">
                  {contact.tags.map(tag => (
                    <span 
                      key={tag} 
                      className={cn("text-xs px-2 py-0.5 rounded-full", tagColors[tag] || "dark:bg-white/10 bg-slate-200 dark:text-slate-400 text-slate-600")}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-xs dark:text-slate-500 text-slate-400">{contact.lastContact}</span>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
