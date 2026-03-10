"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { MessageSquare, CornerDownLeft } from "lucide-react";
import type { QuickReply } from "@/hooks/use-quick-replies";

interface QuickRepliesDropdownProps {
  isOpen: boolean;
  searchTerm: string;
  quickReplies: QuickReply[];
  isDarkMode: boolean;
  onSelect: (reply: QuickReply) => void;
  onClose: () => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function QuickRepliesDropdown({
  isOpen,
  searchTerm,
  quickReplies,
  isDarkMode,
  onSelect,
  onClose,
  inputRef,
}: QuickRepliesDropdownProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Filter quick replies based on search term
  const filteredReplies = quickReplies.filter((reply) => {
    const term = searchTerm.toLowerCase();
    return (
      reply.shortcut.toLowerCase().includes(term) ||
      reply.title.toLowerCase().includes(term) ||
      reply.content.toLowerCase().includes(term)
    );
  });

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  // Scroll selected item into view
  useEffect(() => {
    if (itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredReplies.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case "Enter":
        case "Tab":
          e.preventDefault();
          if (filteredReplies[selectedIndex]) {
            onSelect(filteredReplies[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          inputRef.current?.focus();
          break;
      }
    },
    [isOpen, filteredReplies, selectedIndex, onSelect, onClose, inputRef]
  );

  // Attach keyboard listener
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, inputRef]);

  // Calculate position - show above input or below if no space
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, placement: 'above' as 'above' | 'below' });

  useEffect(() => {
    if (isOpen && inputRef.current && dropdownRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const dropdownHeight = Math.min(320, filteredReplies.length * 70 + 80); // Approximate height
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      
      // If not enough space above, show below
      const showBelow = spaceAbove < dropdownHeight && spaceBelow > spaceAbove;
      
      setPosition({
        top: showBelow ? rect.bottom + 8 : rect.top - dropdownHeight - 8,
        left: rect.left,
        width: Math.min(400, rect.width, window.innerWidth - 32),
        placement: showBelow ? 'below' : 'above',
      });
    }
  }, [isOpen, inputRef, filteredReplies.length]);

  if (!isOpen || filteredReplies.length === 0) return null;

  const highlightMatch = (text: string, term: string) => {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className={cn(
            "rounded px-0.5",
            isDarkMode
              ? "bg-[#00a884]/30 text-[#00a884]"
              : "bg-[#00a884]/20 text-[#00a884]"
          )}
        >
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: position.placement === 'below' ? -10 : 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position.placement === 'below' ? -10 : 10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            position: "fixed",
            top: Math.max(10, position.top),
            left: position.left,
            width: position.width,
            maxWidth: "calc(100vw - 32px)",
          }}
          className={cn(
            "z-[102] rounded-xl shadow-2xl overflow-hidden",
            "backdrop-blur-md border",
            isDarkMode
              ? "bg-[#1f2c33]/95 border-[#2a2a2a]"
              : "bg-white/95 border-gray-200"
          )}
        >
          {/* Header */}
          <div
            className={cn(
              "px-3 py-2 border-b flex items-center justify-between",
              isDarkMode ? "border-[#2a2a2a]" : "border-gray-100"
            )}
          >
            <span
              className={cn(
                "text-xs font-medium",
                isDarkMode ? "text-[#8696a0]" : "text-gray-500"
              )}
            >
              Mensagens Rápidas
            </span>
            <div className="flex items-center gap-1 text-xs text-[#8696a0]">
              <CornerDownLeft className="w-3 h-3" />
              <span>Enter para selecionar</span>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[280px] overflow-y-auto">
            {filteredReplies.map((reply, index) => (
              <button
                key={reply.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                onClick={() => onSelect(reply)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  "w-full px-4 py-3 text-left transition-all duration-150 border-l-2",
                  index === selectedIndex
                    ? isDarkMode
                      ? "bg-[#2a3942] border-[#00a884]"
                      : "bg-gray-100 border-[#00a884]"
                    : isDarkMode
                      ? "bg-transparent border-transparent hover:bg-[#252f36]"
                      : "bg-transparent border-transparent hover:bg-gray-50"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                      isDarkMode ? "bg-[#374045]" : "bg-gray-100"
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        "w-4 h-4",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <code
                        className={cn(
                          "px-1.5 py-0.5 rounded text-xs font-mono font-medium",
                          isDarkMode
                            ? "bg-[#00a884]/20 text-[#00a884]"
                            : "bg-[#00a884]/10 text-[#00a884]"
                        )}
                      >
                        /
                        {highlightMatch(reply.shortcut, searchTerm)}
                      </code>
                      <span
                        className={cn(
                          "font-medium text-sm truncate",
                          isDarkMode ? "text-[#e9edef]" : "text-gray-900"
                        )}
                      >
                        {highlightMatch(reply.title, searchTerm)}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "text-xs line-clamp-2",
                        isDarkMode ? "text-[#8696a0]" : "text-gray-500"
                      )}
                    >
                      {highlightMatch(reply.content, searchTerm)}
                    </p>
                  </div>

                  {/* Selected indicator */}
                  {index === selectedIndex && (
                    <motion.div
                      layoutId="selected-indicator"
                      className="self-center"
                    >
                      <CornerDownLeft className="w-4 h-4 text-[#00a884]" />
                    </motion.div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div
            className={cn(
              "px-3 py-2 border-t flex items-center justify-between text-xs",
              isDarkMode
                ? "border-[#2a2a2a] text-[#8696a0]"
                : "border-gray-100 text-gray-400"
            )}
          >
            <span>
              {filteredReplies.length}{" "}
              {filteredReplies.length === 1 ? "resultado" : "resultados"}
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-mono",
                    isDarkMode ? "bg-[#374045]" : "bg-gray-200"
                  )}
                >
                  ↑↓
                </kbd>
                <span>navegar</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-mono",
                    isDarkMode ? "bg-[#374045]" : "bg-gray-200"
                  )}
                >
                  esc
                </kbd>
                <span>fechar</span>
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
