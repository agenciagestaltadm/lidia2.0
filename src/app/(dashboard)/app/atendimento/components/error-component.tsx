"use client";

import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { NeonButton } from "@/components/ui/neon-button";

interface ErrorComponentProps {
  error?: string;
  onRetry?: () => void;
}

export function ErrorComponent({ error, onRetry }: ErrorComponentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center min-h-[400px]"
    >
      <GlassCard className="max-w-md w-full p-8 text-center" hover={false}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center"
        >
          <AlertCircle className="w-8 h-8 text-red-500" />
        </motion.div>

        <h3 className="text-xl font-semibold mb-2 dark:text-white text-slate-900">
          Erro ao carregar dados
        </h3>

        <p className="text-muted-foreground mb-6">
          {error || "Ocorreu um erro inesperado ao carregar as informações. Tente novamente."}
        </p>

        {onRetry && (
          <NeonButton variant="green" onClick={onRetry} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </NeonButton>
        )}
      </GlassCard>
    </motion.div>
  );
}
