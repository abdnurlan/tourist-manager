"use client";

import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  ImageIcon,
  Mic,
  Terminal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { az, intentLabel } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";
import { formatTimestamp } from "@/lib/utils/date";
import type { AiHistoryItem, TgKind } from "@/lib/types";

const KIND_FALLBACK: Record<Exclude<TgKind, "text">, string> = {
  voice: az.ai.voice_message,
  photo: az.ai.photo_message,
  document: az.ai.document_message,
  command: az.ai.command_message,
};

const KIND_ICON: Partial<Record<TgKind, LucideIcon>> = {
  voice: Mic,
  photo: ImageIcon,
  document: FileText,
  command: Terminal,
};

interface HistoryItemProps {
  item: AiHistoryItem;
  index: number;
}

/** A single past Telegram/AI message in the history rail. */
export function HistoryItem({ item, index }: HistoryItemProps) {
  const isIn = item.direction === "in";
  const KindIcon = KIND_ICON[item.kind];
  const intentText = item.intent ? intentLabel(item.intent) : undefined;

  const text =
    item.content ??
    item.transcript ??
    (item.kind !== "text" ? KIND_FALLBACK[item.kind] : "");

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: Math.min(index * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-3 rounded-xl border border-border bg-surface p-3 shadow-xs transition-colors hover:border-accent/30"
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full ring-1",
          isIn
            ? "bg-surface-muted text-muted-foreground ring-border"
            : "bg-accent-subtle text-accent ring-accent/20",
        )}
      >
        {isIn ? (
          <ArrowUpRight className="size-4" strokeWidth={2} />
        ) : (
          <ArrowDownLeft className="size-4" strokeWidth={2} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-foreground">
            {isIn ? az.ai.you : az.ai.assistant}
          </span>
          <span className="shrink-0 font-display text-xs tabular-nums tracking-tight text-muted-foreground">
            {formatTimestamp(item.created_at)}
          </span>
        </div>
        <p className="mt-0.5 flex items-start gap-1.5 text-sm text-muted-foreground">
          {KindIcon && <KindIcon className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />}
          <span className="line-clamp-3 break-words">{text}</span>
        </p>
        {intentText && (
          <span className="stamp mt-1.5 inline-flex rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {intentText}
          </span>
        )}
      </div>
    </motion.li>
  );
}
