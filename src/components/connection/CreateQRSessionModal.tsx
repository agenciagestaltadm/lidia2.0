"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Loader2,
  QrCode,
  CheckCircle,
  Copy,
  Smartphone,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWhatsAppQR } from "@/hooks/use-whatsapp-qr";
import type { WhatsAppSession } from "@/types/whatsapp";

interface CreateQRSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WhatsAppSession | null;
  onCreateSession: (name: string) => Promise<WhatsAppSession | null>;
}

export function CreateQRSessionModal({
  isOpen,
  onClose,
  session,
  onCreateSession,
}: CreateQRSessionModalProps) {
  const [sessionName, setSessionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdSession, setCreatedSession] = useState<WhatsAppSession | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const {
    qrCode,
    status,
    phone,
    pushName,
    loading: qrLoading,
    startConnection,
    cancelConnection,
  } = useWhatsAppQR(createdSession?.id || null);

  const handleCreate = async () => {
    if (!sessionName.trim()) return;

    setIsCreating(true);
    const newSession = await onCreateSession(sessionName.trim());
    if (newSession) {
      setCreatedSession(newSession);
    }
    setIsCreating(false);
  };

  const handleStartConnection = () => {
    if (createdSession) {
      startConnection();
    }
  };

  const handleClose = () => {
    cancelConnection();
    setSessionName("");
    setCreatedSession(null);
    setCopiedToken(false);
    onClose();
  };

  const copyToken = () => {
    if (createdSession?.token) {
      navigator.clipboard.writeText(createdSession.token);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
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
              className="w-full max-w-md p-0 overflow-hidden"
              glow="green"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b dark:border-white/10 border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <QrCode className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold dark:text-white text-slate-900">
                      {!createdSession
                        ? "Nova Conexão QR"
                        : status === "connected"
                        ? "Conectado!"
                        : "Conectar WhatsApp"}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg hover:dark:bg-white/10 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 dark:text-slate-400 text-slate-600" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {!createdSession ? (
                  // Formulário de criação
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="session-name">Nome da Conexão</Label>
                      <Input
                        id="session-name"
                        placeholder="Ex: WhatsApp Loja Principal"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        className="dark:bg-white/5 bg-slate-50"
                      />
                      <p className="text-xs dark:text-slate-500 text-slate-500">
                        Dê um nome fácil de identificar para esta conexão
                      </p>
                    </div>

                    <Button
                      onClick={handleCreate}
                      disabled={!sessionName.trim() || isCreating}
                      className="w-full bg-emerald-500 hover:bg-emerald-600"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        "Criar Conexão"
                      )}
                    </Button>
                  </div>
                ) : status === "idle" ? (
                  // Token gerado, aguardando iniciar conexão
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 mb-2">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                      </div>
                      <h3 className="font-medium dark:text-white text-slate-900">
                        Conexão criada com sucesso!
                      </h3>
                      <p className="text-sm dark:text-slate-400 text-slate-600">
                        Token de acesso gerado automaticamente
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Token de Acesso</Label>
                      <div className="flex gap-2">
                        <div className="flex-1 p-3 rounded-lg dark:bg-white/5 bg-slate-100 font-mono text-sm break-all dark:text-slate-300 text-slate-700">
                          {createdSession.token}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={copyToken}
                          className={cn(
                            "shrink-0",
                            copiedToken && "text-emerald-500 border-emerald-500"
                          )}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={handleStartConnection}
                      className="w-full bg-emerald-500 hover:bg-emerald-600"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Conectar WhatsApp
                    </Button>
                  </div>
                ) : status === "connecting" || status === "waiting_qr" || status === "timeout" ? (
                  // Exibindo QR code
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm dark:text-slate-300 text-slate-700 mb-4">
                        Escaneie o QR code com seu WhatsApp
                      </p>

                      {qrCode ? (
                        <div className="inline-block p-4 rounded-xl dark:bg-white bg-white">
                          <img
                            src={qrCode}
                            alt="QR Code WhatsApp"
                            className="w-64 h-64"
                          />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-64 h-64 rounded-xl dark:bg-white/5 bg-slate-100">
                          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        </div>
                      )}

                      <p className="text-xs dark:text-slate-500 text-slate-500 mt-4">
                        Abra o WhatsApp no seu celular → Configurações →
                        Dispositivos Conectados → Conectar um dispositivo
                      </p>
                    </div>

                    {status === "timeout" && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>QR code expirado. Tente novamente.</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          cancelConnection();
                          startConnection();
                        }}
                        className="flex-1"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Novo QR
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : status === "connected" ? (
                  // Conectado com sucesso
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10">
                      <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium dark:text-white text-slate-900">
                        WhatsApp Conectado!
                      </h3>
                      <p className="text-sm dark:text-slate-400 text-slate-600 mt-1">
                        {pushName || phone}
                      </p>
                      {phone && (
                        <p className="text-sm text-emerald-500 font-medium mt-1">
                          {phone}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleClose}
                      className="w-full bg-emerald-500 hover:bg-emerald-600"
                    >
                      Concluir
                    </Button>
                  </div>
                ) : status === "error" ? (
                  // Erro
                  <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10">
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-white text-slate-900">
                        Erro na conexão
                      </h3>
                      <p className="text-sm dark:text-slate-400 text-slate-600 mt-1">
                        Ocorreu um erro ao conectar. Tente novamente.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={startConnection}
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                      >
                        Tentar Novamente
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1"
                      >
                        Fechar
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
