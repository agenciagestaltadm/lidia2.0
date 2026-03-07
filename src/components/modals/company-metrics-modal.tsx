"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Send,
  Inbox,
  MessageSquare,
  CheckCircle,
  Clock,
  Users,
  Contact,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";
import { GlowBadge } from "@/components/ui/glow-badge";
import type { Company } from "@/hooks/use-companies";
import type { CompanyMetrics } from "@/hooks/use-companies";

interface CompanyMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  fetchMetrics: (companyId: string) => Promise<{ success: boolean; metrics?: CompanyMetrics; error?: string }>;
}

export function CompanyMetricsModal({ isOpen, onClose, company, fetchMetrics }: CompanyMetricsModalProps) {
  const [metrics, setMetrics] = useState<CompanyMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    if (!company) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchMetrics(company.id);
      if (result.success && result.metrics) {
        setMetrics(result.metrics);
      } else {
        setError(result.error || "Erro ao carregar métricas");
      }
    } catch (err) {
      setError("Erro ao carregar métricas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && company) {
      loadMetrics();
    }
  }, [isOpen, company]);

  if (!company) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Métricas: ${company.name}`}
      description="Visualize as estatísticas e métricas da empresa"
      maxWidth="xl"
    >
      <DialogContent className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
            <p className="text-slate-400">Carregando métricas...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <NeonButton variant="green" onClick={loadMetrics}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </NeonButton>
          </div>
        ) : metrics ? (
          <div className="space-y-6">
            {/* Mensagens */}
            <div>
              <h3 className="text-sm font-medium dark:text-slate-300 text-slate-700 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                Mensagens
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4" glow="green">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Send className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold dark:text-white text-slate-900">
                        {metrics.messages.sent.toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs dark:text-slate-400 text-slate-500">
                        Enviadas
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-4" glow="blue">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Inbox className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold dark:text-white text-slate-900">
                        {metrics.messages.received.toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs dark:text-slate-400 text-slate-500">
                        Recebidas
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Atendimentos */}
            <div>
              <h3 className="text-sm font-medium dark:text-slate-300 text-slate-700 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                Atendimentos
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <GlassCard className="p-4" glow="amber">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Clock className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xl font-bold dark:text-white text-slate-900">
                        {metrics.attendances.open.toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs dark:text-slate-400 text-slate-500">
                        Abertos
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-4" glow="green">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xl font-bold dark:text-white text-slate-900">
                        {metrics.attendances.closed.toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs dark:text-slate-400 text-slate-500">
                        Fechados
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-4" glow="red">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10">
                      <Clock className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-xl font-bold dark:text-white text-slate-900">
                        {metrics.attendances.pending.toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs dark:text-slate-400 text-slate-500">
                        Pendentes
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Total de Atendimentos */}
              <div className="mt-3">
                <GlassCard className="p-3" glow="none">
                  <div className="flex items-center justify-between">
                    <span className="text-sm dark:text-slate-400 text-slate-500">
                      Total de Atendimentos
                    </span>
                    <span className="text-lg font-bold dark:text-white text-slate-900">
                      {metrics.attendances.total.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Contatos e Usuários */}
            <div>
              <h3 className="text-sm font-medium dark:text-slate-300 text-slate-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                Cadastros
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4" glow="purple">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Contact className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold dark:text-white text-slate-900">
                        {metrics.contacts.toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs dark:text-slate-400 text-slate-500">
                        Contatos
                      </p>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-4" glow="green">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Users className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold dark:text-white text-slate-900">
                        {metrics.users.toLocaleString("pt-BR")}
                      </p>
                      <p className="text-xs dark:text-slate-400 text-slate-500">
                        Usuários
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            </div>

            {/* Resumo */}
            <div className="pt-4 border-t dark:border-white/10 border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm dark:text-slate-400 text-slate-500">
                  Conexões Ativas
                </span>
                <GlowBadge variant="green">
                  {metrics.connections} conexões
                </GlowBadge>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t dark:border-white/10 border-slate-200 dark:bg-slate-900/50 bg-slate-50/50">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium dark:text-slate-400 text-slate-500 hover:dark:text-white hover:text-slate-900 transition-colors"
        >
          FECHAR
        </button>
      </div>
    </Dialog>
  );
}

export default CompanyMetricsModal;