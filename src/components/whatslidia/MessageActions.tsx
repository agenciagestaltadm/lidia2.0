"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  MoreVertical,
  Copy,
  Share2,
  Trash2,
  Reply,
  Pin,
} from "lucide-react";
import { ReactionPicker } from "./ReactionPicker";

interface MessageActionsProps {
  messageId: string;
  onReaction?: (emoji: string) => void;
  onForward?: () => void;
  onDelete?: () => void;
  onReply?: () => void;
  onCopy?: () => void;
  isDarkMode?: boolean;
}

export function MessageActions({
  messageId,
  onReaction,
  onForward,
  onDelete,
  onReply,
  onCopy,
  isDarkMode = true,
}: MessageActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: () => void | undefined) => {
    if (action) {
      action();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Botão de menu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100",
          isDarkMode
            ? "hover:bg-[#2a3942] text-[#8696a0]"
            : "hover:bg-gray-100 text-gray-500"
        )}
        title="Ações da mensagem"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {/* Menu de ações */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute top-full right-0 mt-1 rounded-lg shadow-lg z-50 min-w-[200px]",
              isDarkMode ? "bg-[#2a3942]" : "bg-white border border-gray-200"
            )}
          >
            <div className="py-1">
              {/* Reação */}
              {onReaction && (
                <div className="px-3 py-2 border-b border-[#374045]">
                  <ReactionPicker
                    onReactionSelect={onReaction}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}

              {/* Responder */}
              {onReply && (
                <button
                  onClick={() => handleAction(onReply)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                    isDarkMode
                      ? "hover:bg-[#374045] text-[#e9edef]"
                      : "hover:bg-gray-100 text-gray-900"
                  )}
                >
                  <Reply className="w-4 h-4" />
                  Responder
                </button>
              )}

              {/* Copiar */}
              {onCopy && (
                <button
                  onClick={() => handleAction(onCopy)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                    isDarkMode
                      ? "hover:bg-[#374045] text-[#e9edef]"
                      : "hover:bg-gray-100 text-gray-900"
                  )}
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </button>
              )}

              {/* Encaminhar */}
              {onForward && (
                <button
                  onClick={() => handleAction(onForward)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                    isDarkMode
                      ? "hover:bg-[#374045] text-[#e9edef]"
                      : "hover:bg-gray-100 text-gray-900"
                  )}
                >
                  <Share2 className="w-4 h-4" />
                  Encaminhar
                </button>
              )}

              {/* Deletar */}
              {onDelete && (
                <button
                  onClick={() => handleAction(onDelete)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-red-500",
                    isDarkMode
                      ? "hover:bg-[#374045]"
                      : "hover:bg-red-50"
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
