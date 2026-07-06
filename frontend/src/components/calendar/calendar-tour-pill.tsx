"use client";

import { motion } from "framer-motion";
import { CalendarRange, MapPinned } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils/cn";
import { formatDateRange } from "@/lib/utils/date";
import type { Tour } from "@/lib/types";

export interface CalendarTourPillProps {
  tour: Tour;
  onClick: (tour: Tour) => void;
  variant?: "compact" | "full";
  className?: string;
}

const TOUR_ACCENT: Record<Tour["status"], string> = {
  planned: "#2563eb",
  active: "#059669",
  completed: "#64748b",
  cancelled: "#dc2626",
};

const TOUR_TINT: Record<Tour["status"], string> = {
  planned: "#dbeafe",
  active: "#d1fae5",
  completed: "#e2e8f0",
  cancelled: "#fee2e2",
};

/** Clickable tour marker for calendar views, visually distinct from event pills. */
export function CalendarTourPill({
  tour,
  onClick,
  variant = "compact",
  className,
}: CalendarTourPillProps) {
  const accent = TOUR_ACCENT[tour.status];
  const tint = TOUR_TINT[tour.status];
  const cancelled = tour.status === "cancelled";
  const range = formatDateRange(tour.start_date, tour.end_date);

  if (variant === "compact") {
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(tour);
        }}
        title={`${tour.title} · ${range}`}
        style={{
          backgroundColor: tint,
          color: accent,
          boxShadow: `inset 2px 0 0 0 ${accent}`,
        }}
        className={cn(
          "flex w-full items-center gap-1 rounded-md py-0.5 pl-2 pr-1.5 text-left text-[11px] font-semibold leading-tight transition-[filter,transform]",
          cancelled && "line-through opacity-60",
          "hover:brightness-[0.97]",
          className,
        )}
      >
        <CalendarRange className="size-3 shrink-0" />
        <span className="truncate">{tour.title}</span>
      </motion.button>
    );
  }

  return (
    <motion.div whileTap={{ scale: 0.985 }}>
      <Card
        interactive
        onClick={() => onClick(tour)}
        className={cn(
          "group relative flex cursor-pointer items-start gap-3 overflow-hidden p-4 pl-5",
          cancelled && "opacity-70",
          className,
        )}
      >
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ backgroundColor: accent }}
        />
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: tint, color: accent }}
        >
          <MapPinned className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-body font-semibold leading-tight text-foreground",
              cancelled && "line-through",
            )}
          >
            {tour.title}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{range}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <StatusBadge tourStatus={tour.status} />
            <span className="text-xs font-medium text-muted-foreground">
              {tour.events_count} tədbir
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
