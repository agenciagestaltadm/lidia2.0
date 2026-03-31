"use client";

import { motion, AnimatePresence } from "framer-motion";
import { QrCode, BadgeCheck, X, Smartphone, Check } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface ConnectionTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQR: () => void;
  onSelectOfficial: () => void;
}

export function ConnectionTypeModal({
  isOpen,
  onClose,
  onSelectQR,
  onSelectOfficial,
}: ConnectionTypeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <GlassCard
              className="w-full max-w-2xl p-0 overflow-hidden"
              glow="green"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b dark:border-white/10 border-slate-200">
                <div>
                  <h2 className="text-xl font-semibold dark:text-white text-slate-900">
                    Nova Conexão WhatsApp
                  </h2>
                  <p className="text-sm dark:text-slate-400 text-slate-600 mt-1">
                    Escolha o tipo de conexão que deseja configurar
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:dark:bg-white/10 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 dark:text-slate-400 text-slate-600" />
                </button>
              </div>

              {/* Options */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* QR Code Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onSelectQR}
                  className={cn(
                    "relative p-6 rounded-xl text-left transition-all",
                    "border-2 border-transparent",
                    "dark:bg-white/5 bg-slate-50",
                    "hover:border-emerald-500/50",
                    "group"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold dark:text-white text-slate-900 text-lg">
                        WhatsApp QR Code
                      </h3>
                      <p className="text-sm dark:text-slate-400 text-slate-600 mt-2 leading-relaxed">
                        Conecte seu WhatsApp pessoal escaneando um QR code. 
                        Ideal para pequenas empresas e testes.
                      </p>
                      <ul className="mt-4 space-y-2">
                        <li className="flex items-center gap-2 text-sm dark:text-slate-300 text-slate-700">
                          <Check className="w-4 h-4 text-emerald-500" />
                          Gratuito e ilimitado
                        </li>
                        <li className="flex items-center gap-2 text-sm dark:text-slate-300 text-slate-700">
                          <Check className="w-4 h-4 text-emerald-500" />
                          Usa seu número pessoal
                        </li>
                        <li className="flex items-center gap-2 text-sm dark:text-slate-300 text-slate-700">
                          <Check className="w-4 h-4 text-emerald-500" />
                          Envio de mídia
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-xl ring-2 ring-emerald-500/0 group-hover:ring-emerald-500/20 transition-all" />
                </motion.button>

                {/* Official API Option */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onSelectOfficial}
                  className={cn(
                    "relative p-6 rounded-xl text-left transition-all",
                    "border-2 border-transparent",
                    "dark:bg-white/5 bg-slate-50",
                    "hover:border-blue-500/50",
                    "group"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                      <BadgeCheck className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold dark:text-white text-slate-900 text-lg">
                        WhatsApp Oficial API
                      </h3>
                      <p className="text-sm dark:text-slate-400 text-slate-600 mt-2 leading-relaxed">
                        API oficial do WhatsApp Business. Recomendado para 
                        empresas com alto volume de mensagens.
                      </p>
                      <ul className="mt-4 space-y-2">
                        <li className="flex items-center gap-2 text-sm dark:text-slate-300 text-slate-700">
                          <Check className="w-4 h-4 text-blue-500" />
                          Número verificado
                        </li>
                        <li className="flex items-center gap-2 text-sm dark:text-slate-300 text-slate-700">
                          <Check className="w-4 h-4 text-blue-500" />
                          Templates de mensagem
                        </li>
                        <li className="flex items-center gap-2 text-sm dark:text-slate-300 text-slate-700">
                          <Check className="w-4 h-4 text-blue-500" />
                          Análises avançadas
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-xl ring-2 ring-blue-500/0 group-hover:ring-blue-500/20 transition-all" />
                </motion.button>
              </div>

              {/* Footer */}
              <div className="p-6 border-t dark:border-white/10 border-slate-200 dark:bg-white/5 bg-slate-50">
                <div className="flex items-center gap-3 text-sm dark:text-slate-400 text-slate-600">
                  <Smartphone className="w-4 h-4" />
                  <span>
                    Não sabe qual escolher?{" "}
                    <button className="text-emerald-500 hover:underline">
                      Veja nossa documentação
                    </button>
                  </span>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
