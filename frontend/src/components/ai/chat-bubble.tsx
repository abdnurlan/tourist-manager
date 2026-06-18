"use client";

import { motion } from "framer-motion";
import { Compass, User } from "lucide-react";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";
import { formatTimestamp } from "@/lib/utils/date";
import { SourceBadge } from "@/components/shared/source-badge";
import type { ChatMessage } from "./types";

interface ChatBubbleProps {
  message: ChatMessage;
}

/** Editorial message bubble (user right / assistant left). */
export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex w-full items-end gap-2.5",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar — assistant wears a small brass compass mark */}
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full shadow-xs ring-1",
          isUser
            ? "bg-surface-muted text-muted-foreground ring-border"
            : "bg-gradient-to-br from-accent to-accent-hover text-accent-foreground ring-accent/30",
        )}
      >
        {isUser ? (
          <User className="size-4" strokeWidth={2} />
        ) : (
          <Compass className="size-4" strokeWidth={2} />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "px-4 py-2.5 text-body leading-relaxed shadow-sm",
            isUser
              ? "rounded-2xl rounded-br-md bg-accent text-accent-foreground"
              : "rounded-2xl rounded-bl-md border border-border bg-surface text-foreground",
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        <div
          className={cn(
            "flex items-center gap-2 px-1 text-xs text-muted-foreground",
            isUser ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="font-display tabular-nums tracking-tight">
            {message.createdAt ? formatTimestamp(message.createdAt) : az.ai.now}
          </span>
          {!isUser && message.source && (
            <SourceBadge source={message.source} withIcon />
          )}
        </div>
      </div>
    </motion.div>
  );
}
