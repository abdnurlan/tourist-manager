"use client";

import { motion } from "framer-motion";
import { CalendarRange, Map } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils/cn";
import { formatDateRange } from "@/lib/utils/date";
import { az } from "@/lib/i18n/az";
import type { Tour } from "@/lib/types";

export interface TourResultCardProps {
  tour: Tour;
  onClick?: (tour: Tour) => void;
  className?: string;
}

/** Compact tour search result: icon chip, title, date range + event count, status. */
export function TourResultCard({ tour, onClick, className }: TourResultCardProps) {
  const count = tour.events_count ?? 0;

  return (
    <motion.div whileTap={{ scale: 0.985 }}>
      <Card
        interactive={Boolean(onClick)}
        onClick={onClick ? () => onClick(tour) : undefined}
        className={cn(
          "flex items-start gap-3.5 p-4",
          onClick && "cursor-pointer",
          className,
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent">
          <Map className="size-5" strokeWidth={2} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-body font-semibold leading-tight text-foreground">
              {tour.title}
            </p>
            <StatusBadge tourStatus={tour.status} className="shrink-0" />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarRange className="size-3.5 shrink-0" />
              <span className="font-display font-medium tabular-nums text-foreground">
                {formatDateRange(tour.start_date, tour.end_date)}
              </span>
            </span>
            <span className="tabular-nums">
              {count} {az.common.events}
            </span>
          </div>

          {tour.description && (
            <p className="mt-1.5 line-clamp-1 text-sm text-muted-foreground">
              {tour.description}
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
