"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CalendarRange, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateRange } from "@/lib/utils/date";
import { eventCountLabel } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Tour } from "@/lib/types";

export interface TourMiniCardProps {
  tour: Tour;
  className?: string;
}

/** Compact ticket-stub tour card for the dashboard tour sections. */
export function TourMiniCard({ tour, className }: TourMiniCardProps) {
  const router = useRouter();
  return (
    <motion.div whileTap={{ scale: 0.985 }} className="h-full">
      <Card
        interactive
        ticket
        onClick={() => router.push(`/tours/${tour.id}`)}
        className={cn(
          "flex h-full cursor-pointer flex-col gap-3 py-5 pr-5",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate font-display text-body font-semibold leading-tight text-foreground">
            {tour.title}
          </p>
          <StatusBadge tourStatus={tour.status} className="shrink-0" />
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange className="size-3.5 shrink-0" />
            <span className="font-display tabular-nums">
              {formatDateRange(tour.start_date, tour.end_date)}
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <Layers className="size-3.5 shrink-0" />
            {eventCountLabel(tour.events_count)}
          </span>
        </div>
      </Card>
    </motion.div>
  );
}
