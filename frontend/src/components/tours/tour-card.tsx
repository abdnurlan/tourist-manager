"use client";

import { motion } from "framer-motion";
import { CalendarRange, Pencil, Trash2, MoreVertical, Ticket } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils/cn";
import { formatDateRange } from "@/lib/utils/date";
import { eventCountLabel } from "@/lib/utils/format";
import { az } from "@/lib/i18n/az";
import type { Tour } from "@/lib/types";

export interface TourCardProps {
  tour: Tour;
  onClick?: (tour: Tour) => void;
  onEdit?: (tour: Tour) => void;
  onDelete?: (tour: Tour) => void;
  /** Dim slightly while an optimistic create is pending. */
  pending?: boolean;
  className?: string;
}

/** Boarding-pass style tour card: perforated stub edge, Fraunces date range,
 *  rubber-stamp status, event count chip, quick edit/delete. Props unchanged. */
export function TourCard({
  tour,
  onClick,
  onEdit,
  onDelete,
  pending,
  className,
}: TourCardProps) {
  const hasMenu = Boolean(onEdit || onDelete);

  return (
    <motion.div whileTap={onClick ? { scale: 0.985 } : undefined}>
      <Card
        ticket
        interactive={Boolean(onClick)}
        onClick={onClick ? () => onClick(tour) : undefined}
        className={cn(
          "group flex h-full flex-col gap-3 py-5 pr-5",
          onClick && "cursor-pointer",
          pending && "pointer-events-none opacity-60",
          className,
        )}
      >
        {/* Header: title + status stamp + menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="mb-1.5 inline-flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              <Ticket className="size-3.5 text-accent" strokeWidth={2} />
              {az.screen.tours}
            </span>
            <h3 className="truncate font-display text-h3 font-semibold leading-tight text-foreground">
              {tour.title}
            </h3>
          </div>

          {hasMenu && !pending && (
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => e.stopPropagation()}
                className="-mr-1 -mt-1 rounded-lg p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-surface-muted focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"
                aria-label={az.action.edit}
              >
                <MoreVertical className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                onClick={(e) => e.stopPropagation()}
              >
                {onEdit && (
                  <DropdownMenuItem onSelect={() => onEdit(tour)}>
                    <Pencil />
                    {az.action.edit}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem destructive onSelect={() => onDelete(tour)}>
                    <Trash2 />
                    {az.action.delete}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {tour.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {tour.description}
          </p>
        )}

        {/* Date range — the boarding-pass "itinerary" line, in Fraunces. */}
        <div className="mt-auto flex items-center gap-2 pt-1">
          <CalendarRange className="size-4 shrink-0 text-muted-foreground" />
          <span className="font-display text-base font-medium tabular-nums text-foreground">
            {formatDateRange(tour.start_date, tour.end_date)}
          </span>
        </div>

        {/* Stub footer: status stamp + event count, divided like a perforation. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-dashed border-border pt-3">
          <StatusBadge tourStatus={tour.status} />
          <span className="ml-auto inline-flex items-center rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
            {eventCountLabel(tour.events_count ?? 0)}
          </span>
        </div>
      </Card>
    </motion.div>
  );
}
