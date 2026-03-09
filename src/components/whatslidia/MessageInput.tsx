"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Plus,
  Smile,
  Mic,
  Send,
  Paperclip,
  Image,
  FileText,
  Video,
  X,
  Clock,
} from "lucide-react";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  isWithin24Hours?: boolean;
}

export function MessageInput({
  onSend,
  disabled = false,
  isWithin24Hours = true,
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(
        inputRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  // Handle recording timer
  useEffect(() => {
    if (isRecording) {
      recordingInterval.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, [isRecording]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const attachmentOptions = [
    { icon: Image, label: "Foto/Vídeo", color: "bg-[#0073e6]" },
    { icon: FileText, label: "Documento", color: "bg-[#7f66ff]" },
    { icon: Video, label: "Câmera", color: "bg-[#ff2e74]" },
    { icon: Clock, label: "Template", color: "bg-[#009de2]" },
  ];

  if (!isWithin24Hours) {
    return (
      <div className="h-16 px-4 flex items-center justify-center bg-[#1f2c33] border-t border-[#2a2a2a]">
        <div className="flex items-center gap-3 text-[#8696a0]">
          <Clock className="w-5 h-5" />
          <span className="text-sm">
            Janela de 24h fechada. Use um template para contatar.
          </span>
          <button className="px-4 py-2 bg-[#00a884] text-white text-sm rounded-lg hover:bg-[#00a884]/90 transition-colors">
            Ver Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1f2c33] border-t border-[#2a2a2a]">
      {/* Attachment Menu */}
      <AnimatePresence>
        {showAttachments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 border-b border-[#2a2a2a]"
          >
            <div className="flex items-center gap-4">
              {attachmentOptions.map((option, index) => (
                <motion.button
                  key={option.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                      option.color
                    )}
                  >
                    <option.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-[#8696a0]">{option.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="h-16 px-4 flex items-center gap-3">
        {/* Attachment Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAttachments(!showAttachments)}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            showAttachments
              ? "bg-[#00a884] text-white"
              : "text-[#aebac1] hover:bg-[#2a3942]"
          )}
        >
          {showAttachments ? (
            <X className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </motion.button>

        {/* Emoji Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#aebac1] hover:bg-[#2a3942] transition-colors"
        >
          <Smile className="w-5 h-5" />
        </motion.button>

        {/* Input Field */}
        {isRecording ? (
          <div className="flex-1 flex items-center justify-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[#e9edef] font-medium">
              Gravando {formatRecordingTime(recordingTime)}
            </span>
          </div>
        ) : (
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem"
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full min-h-[44px] max-h-[120px] px-4 py-2.5 bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] text-sm rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#00a884]/50 transition-all scrollbar-thin scrollbar-thumb-[#374045]",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            />
          </div>
        )}

        {/* Send/Record Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (message.trim()) {
              handleSend();
            } else {
              setIsRecording(!isRecording);
            }
          }}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
            message.trim()
              ? "bg-[#00a884] text-white hover:bg-[#00a884]/90"
              : isRecording
              ? "bg-red-500 text-white"
              : "text-[#aebac1] hover:bg-[#2a3942]"
          )}
        >
          {message.trim() ? (
            <Send className="w-5 h-5 ml-0.5" />
          ) : isRecording ? (
            <Send className="w-5 h-5 ml-0.5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
