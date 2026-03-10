"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, Video, ExternalLink, Loader2 } from "lucide-react";

interface VideoConfModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onSend: (jitsiLink: string) => void;
}

export function VideoConfModal({ isOpen, onClose, isDarkMode, onSend }: VideoConfModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const generateJitsiLink = () => {
    const roomName = `lidia-meeting-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    return `https://meet.jit.si/${roomName}`;
  };

  const handleCreateMeeting = async () => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    const jitsiLink = generateJitsiLink();
    
    // Send the link to the conversation
    onSend(jitsiLink);
    
    // Open Jitsi in new tab
    window.open(jitsiLink, '_blank', 'noopener,noreferrer');
    
    setIsLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={!isLoading ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-[90%] max-w-md rounded-2xl shadow-2xl overflow-hidden",
              isDarkMode ? "bg-[#1f2c33]" : "bg-white"
            )}
          >
            {/* Header */}
            <div className={cn(
              "px-4 py-3 border-b flex items-center justify-between",
              isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
            )}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Video className="w-4 h-4 text-white" />
                </div>
                <h3 className={cn(
                  "font-medium",
                  isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                )}>
                  Videoconferência
                </h3>
              </div>
              {!isLoading && (
                <button
                  onClick={onClose}
                  className={cn(
                    "p-1 rounded-full hover:bg-black/10 transition-colors",
                    isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <div className={cn(
                "p-4 rounded-xl mb-4",
                isDarkMode ? "bg-[#2a3942]" : "bg-gray-50"
              )}>
                <p className={cn(
                  "text-sm mb-2",
                  isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                )}>
                  Criar uma reunião no Jitsi Meet
                </p>
                <p className={cn(
                  "text-xs",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}>
                  Um link de videoconferência será gerado e enviado automaticamente para o contato. Você será redirecionado para a reunião em uma nova aba.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6">
                {[
                  "Videoconferência segura e criptografada",
                  "Sem limite de tempo",
                  "Compartilhamento de tela",
                  "Gravação disponível",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isDarkMode ? "bg-[#00a884]" : "bg-emerald-500"
                    )} />
                    <span className={cn(
                      "text-sm",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-600"
                    )}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className={cn(
                    "flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors",
                    isDarkMode 
                      ? "text-[#e9edef] hover:bg-[#2a3942]" 
                      : "text-gray-700 hover:bg-gray-100",
                    isLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateMeeting}
                  disabled={isLoading}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all",
                    "bg-purple-500 text-white hover:bg-purple-600",
                    isLoading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Criar Reunião
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
