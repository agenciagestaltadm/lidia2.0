"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, MapPin, Navigation, Send } from "lucide-react";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onSend: (locationData: { address: string; lat?: number; lng?: number }) => void;
  mode: "send" | "request";
}

export function LocationModal({ isOpen, onClose, isDarkMode, onSend, mode }: LocationModalProps) {
  const [address, setAddress] = useState("");

  const handleSend = () => {
    if (mode === "request") {
      onSend({ address: "" });
      onClose();
    } else {
      if (address.trim()) {
        onSend({ address: address.trim() });
        setAddress("");
        onClose();
      }
    }
  };

  const isSendMode = mode === "send";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
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
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  isSendMode ? "bg-green-500" : "bg-lime-500"
                )}>
                  {isSendMode ? (
                    <MapPin className="w-4 h-4 text-white" />
                  ) : (
                    <Navigation className="w-4 h-4 text-white" />
                  )}
                </div>
                <h3 className={cn(
                  "font-medium",
                  isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                )}>
                  {isSendMode ? "Enviar Localização" : "Solicitar Localização"}
                </h3>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "p-1 rounded-full hover:bg-black/10 transition-colors",
                  isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {isSendMode ? (
                <>
                  {/* Send Location Mode */}
                  <div className={cn(
                    "p-4 rounded-xl mb-4 text-center",
                    isDarkMode ? "bg-[#2a3942]" : "bg-gray-50"
                  )}>
                    <div className={cn(
                      "w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center",
                      isDarkMode ? "bg-[#374045]" : "bg-gray-200"
                    )}>
                      <MapPin className={cn(
                        "w-8 h-8",
                        isDarkMode ? "text-green-400" : "text-green-600"
                      )} />
                    </div>
                    <p className={cn(
                      "text-sm",
                      isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                    )}>
                      Informe o endereço que deseja compartilhar
                    </p>
                  </div>

                  <div>
                    <label className={cn(
                      "block text-xs font-medium mb-1.5",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}>
                      Endereço *
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Rua, número, bairro, cidade, estado, CEP"
                      rows={3}
                      className={cn(
                        "w-full px-3 py-2 text-sm rounded-lg outline-none focus:ring-2 focus:ring-green-500/50 transition-all resize-none",
                        isDarkMode 
                          ? "bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]" 
                          : "bg-gray-100 text-gray-900 placeholder-gray-500"
                      )}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Request Location Mode */}
                  <div className={cn(
                    "p-4 rounded-xl text-center",
                    isDarkMode ? "bg-[#2a3942]" : "bg-gray-50"
                  )}>
                    <div className={cn(
                      "w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center",
                      isDarkMode ? "bg-[#374045]" : "bg-gray-200"
                    )}>
                      <Navigation className={cn(
                        "w-8 h-8",
                        isDarkMode ? "text-lime-400" : "text-lime-600"
                      )} />
                    </div>
                    <p className={cn(
                      "text-sm font-medium mb-2",
                      isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                    )}>
                      Solicitar Localização
                    </p>
                    <p className={cn(
                      "text-xs",
                      isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                    )}>
                      Uma mensagem será enviada solicitando que o contato compartilhe sua localização atual.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className={cn(
              "px-4 py-3 border-t flex items-center justify-end gap-2",
              isDarkMode ? "border-[#2a2a2a]" : "border-gray-200"
            )}>
              <button
                onClick={onClose}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  isDarkMode 
                    ? "text-[#e9edef] hover:bg-[#2a3942]" 
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                disabled={isSendMode && !address.trim()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
                  isSendMode ? "bg-green-500 hover:bg-green-600" : "bg-lime-500 hover:bg-lime-600",
                  "text-white",
                  isSendMode && !address.trim() && "opacity-50 cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
                {isSendMode ? "Enviar Localização" : "Solicitar"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
