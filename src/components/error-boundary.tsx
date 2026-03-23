"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { GlassCard } from "./ui/glass-card";
import { NeonButton } from "./ui/neon-button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center min-h-[400px] p-6"
        >
          <GlassCard className="max-w-md w-full p-8 text-center" hover={false}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center"
            >
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </motion.div>

            <h3 className="text-xl font-semibold mb-2 dark:text-white text-slate-900">
              Algo deu errado
            </h3>

            <p className="text-muted-foreground mb-6">
              Ocorreu um erro inesperado ao carregar esta página. Nossa equipe foi notificada.
            </p>

            {this.state.error && (
              <div className="bg-muted/50 rounded-lg p-3 mb-6 text-left">
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <NeonButton variant="green" onClick={this.handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Recarregar página
            </NeonButton>
          </GlassCard>
        </motion.div>
      );
    }

    return this.props.children;
  }
}
