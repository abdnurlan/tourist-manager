"use client";

import { Send, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsCard, SettingsRow } from "./settings-card";
import { az } from "@/lib/i18n/az";
import { formatTimestamp } from "@/lib/utils/date";
import type { TelegramStatus } from "@/lib/types";

export interface TelegramCardProps {
  status: TelegramStatus | null | undefined;
  loading?: boolean;
}

/** Telegram bot statusu + necə qoşulmaq haqqında qısa məlumat. */
export function TelegramCard({ status, loading }: TelegramCardProps) {
  const connected = status?.connected ?? false;
  const modeLabel =
    status?.mode === "webhook"
      ? az.telegram.mode_webhook
      : az.telegram.mode_polling;

  return (
    <SettingsCard icon={Send} title={az.settings.telegram}>
      <div className="space-y-0">
        <SettingsRow label={az.settings.telegram_status}>
          {loading ? (
            <Skeleton className="h-5 w-20 rounded-full" />
          ) : (
            <Badge variant={connected ? "success" : "danger"}>
              {connected ? az.telegram.connected : az.telegram.disconnected}
            </Badge>
          )}
        </SettingsRow>

        <SettingsRow label={az.settings.telegram_mode}>
          {loading ? (
            <Skeleton className="h-4 w-28 rounded-md" />
          ) : (
            <span className="text-muted-foreground">{modeLabel}</span>
          )}
        </SettingsRow>

        <SettingsRow label={az.telegram.last_message}>
          {loading ? (
            <Skeleton className="h-4 w-24 rounded-md" />
          ) : status?.last_message_at ? (
            <span className="font-display tabular-nums">
              {formatTimestamp(status.last_message_at)}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {az.settings.telegram_never}
            </span>
          )}
        </SettingsRow>
      </div>

      {/* Necə qoşulmaq haqqında qısa məlumat */}
      <div className="mt-4 flex gap-3 rounded-xl bg-accent-subtle/60 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {az.settings.telegram_how_title}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {az.settings.telegram_how_body}
          </p>
        </div>
      </div>
    </SettingsCard>
  );
}
