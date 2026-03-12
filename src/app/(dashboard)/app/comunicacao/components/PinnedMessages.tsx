"use client";

import { motion } from "framer-motion";
import { Pin, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatPinnedMessage } from "@/types/internal-chat";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

interface PinnedMessagesProps {
  messages: ChatPinnedMessage[];
  onClose: () => void;
}

export function PinnedMessages({ messages, onClose }: PinnedMessagesProps) {
  const [expanded, setExpanded] = useState(false);

  if (!messages || messages.length === 0) return null;

  const displayMessages = expanded ? messages : messages.slice(0, 1);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="border-b border-border bg-muted/30"
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {messages.length === 1
                ? "Mensagem fixada"
                : `${messages.length} mensagens fixadas`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className={cn("max-h-32", expanded && "max-h-64")}>
          <div className="space-y-2">
            {displayMessages.map((pinned) => (
              <PinnedMessageItem key={pinned.id} pinned={pinned} />
            ))}
          </div>
        </ScrollArea>

        {!expanded && messages.length > 1 && (
          <button
            onClick={() => setExpanded(true)}
            className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Ver todas as {messages.length} mensagens fixadas
          </button>
        )}
      </div>
    </motion.div>
  );
}

function PinnedMessageItem({ pinned }: { pinned: ChatPinnedMessage }) {
  const message = pinned.message;
  if (!message) return null;

  return (
    <div className="flex gap-3 p-2 rounded-lg bg-background/50 hover:bg-background transition-colors">
      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-medium">
        {message.sender?.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{message.sender?.name}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(pinned.pinnedAt), "dd/MM/yyyy HH:mm", {
              locale: ptBR,
            })}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {message.content}
        </p>
      </div>
    </div>
  );
}
