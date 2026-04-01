"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PresenceIndicatorProps {
  status: "available" | "unavailable" | "composing" | "recording";
  isTyping?: boolean;
  isDarkMode?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PresenceIndicator({
  status,
  isTyping = false,
  isDarkMode = true,
  size = "md",
}: PresenceIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  const statusColors = {
    available: "bg-green-500",
    unavailable: "bg-gray-400",
    composing: "bg-blue-500",
    recording: "bg-red-500",
  };

  const statusLabels = {
    available: "Online",
    unavailable: "Offline",
    composing: "Digitando...",
    recording: "Gravando áudio...",
  };

  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={isTyping ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.6, repeat: Infinity }}
        className={cn(
          "rounded-full",
          sizeClasses[size],
          statusColors[status],
          status === "available" && "shadow-lg shadow-green-500/50"
        )}
      />
      <span
        className={cn(
          "text-xs font-medium",
          isDarkMode ? "text-[#8696a0]" : "text-gray-500"
        )}
      >
        {isTyping ? statusLabels.composing : statusLabels[status]}
      </span>
    </div>
  );
}

interface TypingIndicatorProps {
  isDarkMode?: boolean;
}

export function TypingIndicator({ isDarkMode = true }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -8, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
          }}
          className={cn(
            "w-2 h-2 rounded-full",
            isDarkMode ? "bg-[#8696a0]" : "bg-gray-400"
          )}
        />
      ))}
    </div>
  );
}

interface MessageStatusIconProps {
  status: "sent" | "delivered" | "read" | "failed";
  isDarkMode?: boolean;
  size?: "sm" | "md";
}

export function MessageStatusIcon({
  status,
  isDarkMode = true,
  size = "sm",
}: MessageStatusIconProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
  };

  const statusColors = {
    sent: isDarkMode ? "text-[#8696a0]" : "text-gray-400",
    delivered: isDarkMode ? "text-[#8696a0]" : "text-gray-400",
    read: "text-blue-500",
    failed: "text-red-500",
  };

  return (
    <svg
      className={cn(sizeClasses[size], statusColors[status])}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      {status === "sent" && (
        <polyline points="20 6 9 17 4 12" />
      )}
      {status === "delivered" && (
        <>
          <polyline points="20 6 9 17 4 12" />
          <polyline points="9 17 20 6" />
        </>
      )}
      {status === "read" && (
        <>
          <polyline points="20 6 9 17 4 12" />
          <polyline points="9 17 20 6" />
        </>
      )}
      {status === "failed" && (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      )}
    </svg>
  );
}
