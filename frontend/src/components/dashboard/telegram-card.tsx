"use client";

import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { az } from "@/lib/i18n/az";
import { formatTimestamp } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { TelegramStatus } from "@/lib/types";

export interface TelegramCardProps {
  status: TelegramStatus;
  className?: string;
}

/** Telegram connection status card (CONTRACT §6.2, §9.11). */
export function TelegramCard({ status, className }: TelegramCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-info/12 text-info ring-1 ring-info/15">
          <Send className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {az.dashboard.telegram}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="relative flex size-2">
              {status.connected && (
                <motion.span
                  className="absolute inline-flex size-full rounded-full bg-success/60"
                  animate={{ scale: [1, 1.9], opacity: [0.6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <span
                className={cn(
                  "relative inline-flex size-2 rounded-full",
                  status.connected ? "bg-success" : "bg-muted-foreground",
                )}
              />
            </span>
            <span className="font-display text-body font-semibold text-foreground">
              {status.connected ? az.telegram.connected : az.telegram.disconnected}
            </span>
          </div>
        </div>
        <Badge variant={status.connected ? "info" : "neutral"} className="shrink-0">
          {status.mode === "webhook"
            ? az.telegram.mode_webhook
            : az.telegram.mode_polling}
        </Badge>
      </div>

      {status.last_message_at && (
        <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
          {az.telegram.last_message}: {" "}
          <span className="tabular-nums">
            {formatTimestamp(status.last_message_at)}
          </span>
        </p>
      )}
    </Card>
  );
}
