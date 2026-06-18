"use client";

import { BellRing } from "lucide-react";
import { formatTimestamp } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { Reminder } from "@/lib/types";

export interface ReminderItemProps {
  reminder: Reminder;
  className?: string;
}

/** A single reminder row inside the reminders card. */
export function ReminderItem({ reminder, className }: ReminderItemProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1",
          reminder.sent
            ? "bg-surface-muted text-muted-foreground ring-border"
            : "bg-warning/12 text-warning ring-warning/20",
        )}
      >
        <BellRing className="size-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {reminder.message}
        </p>
        <p className="mt-0.5 font-display text-xs tabular-nums text-muted-foreground">
          {formatTimestamp(reminder.remind_at)}
        </p>
      </div>
    </div>
  );
}
