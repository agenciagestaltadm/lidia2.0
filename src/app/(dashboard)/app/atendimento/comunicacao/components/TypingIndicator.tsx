"use client";

import { motion } from "framer-motion";

export function TypingIndicator() {
  // Em uma implementação real, isso viria do hook useChatRealtime
  const typingUsers: { name: string }[] = [];

  if (typingUsers.length === 0) return null;

  const text =
    typingUsers.length === 1
      ? `${typingUsers[0].name} está digitando...`
      : typingUsers.length === 2
      ? `${typingUsers[0].name} e ${typingUsers[1].name} estão digitando...`
      : `${typingUsers.length} pessoas estão digitando...`;

  return (
    <div className="px-4 py-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{
                y: [0, -4, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
        <span className="italic">{text}</span>
      </div>
    </div>
  );
}
