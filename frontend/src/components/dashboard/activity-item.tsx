"use client";

import {
  CalendarPlus,
  PencilLine,
  MapPinned,
  Send,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { SourceBadge } from "@/components/shared/source-badge";
import { formatTimestamp } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { RecentActivityItem, RecentActivityKind } from "@/lib/types";

const KIND_ICON: Record<RecentActivityKind, LucideIcon> = {
  event_created: CalendarPlus,
  event_updated: PencilLine,
  tour_created: MapPinned,
  telegram_message: Send,
  ai_message: Sparkles,
};

export interface ActivityItemProps {
  item: RecentActivityItem;
  className?: string;
}

/** A single recent-activity row (icon + title + source pill + time). */
export function ActivityItem({ item, className }: ActivityItemProps) {
  const Icon = KIND_ICON[item.kind] ?? PencilLine;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground ring-1 ring-border">
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate text-sm font-medium text-foreground">
            {item.title}
          </p>
          {item.source !== "manual" && (
            <SourceBadge source={item.source} className="shrink-0" />
          )}
        </div>
        <p className="mt-0.5 font-display text-xs tabular-nums text-muted-foreground">
          {formatTimestamp(item.created_at)}
        </p>
      </div>
    </div>
  );
}
