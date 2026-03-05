"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Camera,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Shield,
  Award,
  Save,
  Check
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GlowBadge } from "@/components/ui/glow-badge";
import { NeonButton } from "@/components/ui/neon-button";
import { AnimatedInput } from "@/components/ui/animated-input";
import { staggerContainer, fadeInUp } from "@/lib/animations";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setIsEditing(false);
    }, 1500);
  };

  const stats = [
    { label: "Atendimentos", value: "247", icon: Briefcase },
    { label: "Taxa de Conversão", value: "68%", icon: Award },
    { label: "Na Empresa", value: "2 anos", icon: Calendar },
  ];

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
            <GlowBadge variant="cyan">Perfil</GlowBadge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Meu Perfil
          </h1>
          <p className="text-slate-400 mt-1">
            Gerencie suas informações pessoais
          </p>
        </div>
        <NeonButton 
          variant={saved ? "fuchsia" : isEditing ? "cyan" : "ghost"} 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Salvo!
            </>
          ) : isEditing ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </>
          ) : (
            <>
              <User className="w-4 h-4 mr-2" />
              Editar Perfil
            </>
          )}
        </NeonButton>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <motion.div variants={fadeInUp} className="lg:col-span-1">
          <GlassCard className="p-6 text-center" glow="violet">
            {/* Avatar */}
            <div className="relative inline-block mb-4">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto"
                style={{
                  background: "linear-gradient(135deg, #00f0ff, #8b5cf6)",
                }}
              >
                AS
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 p-2 rounded-full bg-cyan-500 text-white hover:bg-cyan-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            <h2 className="text-xl font-bold text-white">Ana Silva</h2>
            <p className="text-slate-400">ana.silva@empresa.com</p>
            
            <div className="flex items-center justify-center gap-2 mt-3">
              <GlowBadge variant="cyan">Admin</GlowBadge>
              <GlowBadge variant="emerald">Ativo</GlowBadge>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label}>
                    <Icon className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                    <p className="text-lg font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          {/* Security Card */}
          <GlassCard className="p-5 mt-4" glow="cyan">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-white">Segurança</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">2FA</span>
                <GlowBadge variant="emerald">Ativado</GlowBadge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Último login</span>
                <span className="text-sm text-slate-300">Hoje, 09:45</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Right Column - Form */}
        <motion.div variants={fadeInUp} className="lg:col-span-2 space-y-4">
          <GlassCard className="p-6" hover={false}>
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              Informações Pessoais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatedInput
                label="Nome Completo"
                defaultValue="Ana Silva"
                disabled={!isEditing}
                icon={<User className="w-5 h-5 text-slate-400" />}
              />
              <AnimatedInput
                label="E-mail"
                defaultValue="ana.silva@empresa.com"
                disabled={!isEditing}
                icon={<Mail className="w-5 h-5 text-slate-400" />}
              />
              <AnimatedInput
                label="Telefone"
                defaultValue="(11) 99999-9999"
                disabled={!isEditing}
                icon={<Phone className="w-5 h-5 text-slate-400" />}
              />
              <AnimatedInput
                label="Data de Nascimento"
                defaultValue="15/03/1990"
                disabled={!isEditing}
                icon={<Calendar className="w-5 h-5 text-slate-400" />}
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6" hover={false}>
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-violet-400" />
              Informações Profissionais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatedInput
                label="Cargo"
                defaultValue="Administradora do Sistema"
                disabled={!isEditing}
                icon={<Briefcase className="w-5 h-5 text-slate-400" />}
              />
              <AnimatedInput
                label="Departamento"
                defaultValue="TI / Suporte"
                disabled={!isEditing}
                icon={<Shield className="w-5 h-5 text-slate-400" />}
              />
              <div className="md:col-span-2">
                <AnimatedInput
                  label="Endereço"
                  defaultValue="Av. Paulista, 1000 - São Paulo, SP"
                  disabled={!isEditing}
                  icon={<MapPin className="w-5 h-5 text-slate-400" />}
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6" hover={false}>
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-fuchsia-400" />
              Preferências
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <p className="text-white font-medium">Notificações por E-mail</p>
                  <p className="text-sm text-slate-400">Receber atualizações importantes por e-mail</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" disabled={!isEditing} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <p className="text-white font-medium">Notificações Push</p>
                  <p className="text-sm text-slate-400">Receber notificações no navegador</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" disabled={!isEditing} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-white font-medium">Perfil Público</p>
                  <p className="text-sm text-slate-400">Permitir que outros usuários vejam seu perfil</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" disabled={!isEditing} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
