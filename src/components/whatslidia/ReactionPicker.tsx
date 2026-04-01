"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ReactionPickerProps {
  onReactionSelect: (emoji: string) => void;
  isDarkMode?: boolean;
}

const COMMON_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "👏", "🔥"];

export function ReactionPicker({
  onReactionSelect,
  isDarkMode = true,
}: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customEmoji, setCustomEmoji] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Fecha picker ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleReactionClick = (emoji: string) => {
    onReactionSelect(emoji);
    setIsOpen(false);
    setCustomEmoji("");
  };

  const handleCustomEmojiSubmit = () => {
    if (customEmoji.trim()) {
      handleReactionClick(customEmoji.trim());
    }
  };

  return (
    <div ref={pickerRef} className="relative">
      {/* Botão para abrir picker */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-1.5 rounded-full transition-colors",
          isDarkMode
            ? "hover:bg-[#2a3942] text-[#8696a0]"
            : "hover:bg-gray-100 text-gray-500"
        )}
        title="Adicionar reação"
      >
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
        </svg>
      </button>

      {/* Picker */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute bottom-full right-0 mb-2 p-3 rounded-lg shadow-lg z-50",
              isDarkMode ? "bg-[#2a3942]" : "bg-white border border-gray-200"
            )}
          >
            {/* Reações comuns */}
            <div className="flex gap-2 mb-3 flex-wrap max-w-[280px]">
              {COMMON_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className={cn(
                    "text-2xl p-2 rounded-lg transition-all hover:scale-110",
                    isDarkMode
                      ? "hover:bg-[#374045]"
                      : "hover:bg-gray-100"
                  )}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input para emoji customizado */}
            <div className="border-t border-[#374045] pt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleCustomEmojiSubmit();
                    }
                  }}
                  placeholder="Emoji customizado"
                  maxLength={2}
                  className={cn(
                    "flex-1 px-2 py-1 rounded text-sm outline-none",
                    isDarkMode
                      ? "bg-[#1f2c33] text-white placeholder-[#8696a0]"
                      : "bg-gray-100 text-gray-900 placeholder-gray-500"
                  )}
                />
                <button
                  onClick={handleCustomEmojiSubmit}
                  disabled={!customEmoji.trim()}
                  className={cn(
                    "px-3 py-1 rounded text-sm font-medium transition-colors",
                    customEmoji.trim()
                      ? isDarkMode
                        ? "bg-[#00a884] text-white hover:bg-[#00a884]/90"
                        : "bg-emerald-500 text-white hover:bg-emerald-600"
                      : isDarkMode
                      ? "bg-[#374045] text-[#8696a0] cursor-not-allowed"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  )}
                >
                  Enviar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
