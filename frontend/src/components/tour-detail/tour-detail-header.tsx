"use client";

import { motion } from "framer-motion";
import { CalendarRange, Compass, Layers, Pencil, Plane, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { az } from "@/lib/i18n/az";
import { formatDateRange } from "@/lib/utils/date";
import { dayCountLabel, eventCountLabel } from "@/lib/utils/format";
import type { Tour } from "@/lib/types";

export interface TourDetailHeaderProps {
  tour: Tour;
  dayCount: number;
  eventCount: number;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Tour detail hero styled as a boarding-pass / ticket-stub:
 * perforated left edge (TicketCard), Fraunces tour title, date range,
 * a rubber-stamp status badge (slight rotation), and day/event counts.
 */
export function TourDetailHeader({
  tour,
  dayCount,
  eventCount,
  onEdit,
  onDelete,
}: TourDetailHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      <TicketCard className="overflow-hidden shadow-md">
        {/* boarding-pass top rail */}
        <div className="flex items-center justify-between gap-3 border-b border-dashed border-border px-5 py-2.5 pl-7 md:px-7 md:pl-9">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Plane className="size-3.5 text-accent" />
            {az.screen.tour_detail}
          </span>
          <motion.span
            initial={{ rotate: -3, scale: 0.92, opacity: 0 }}
            animate={{ rotate: -3, scale: 1, opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="origin-center"
          >
            <StatusBadge tourStatus={tour.status} className="stamp ring-2" />
          </motion.span>
        </div>

        <div className="flex flex-col gap-5 p-5 pl-7 md:flex-row md:items-end md:justify-between md:p-7 md:pl-9">
          <div className="min-w-0 space-y-3.5">
            <h1 className="font-display text-h1 font-bold leading-tight tracking-tight text-foreground md:text-display">
              {tour.title}
            </h1>

            {/* boarding-pass field row */}
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <Field icon={CalendarRange} label={az.field.start_date}>
                <span className="font-display text-base font-semibold tabular-nums text-foreground">
                  {formatDateRange(tour.start_date, tour.end_date)}
                </span>
              </Field>
              <Field icon={Layers} label={az.common.days}>
                <span className="font-display text-base font-semibold tabular-nums text-foreground">
                  {dayCountLabel(dayCount)}
                </span>
                <span className="text-muted-foreground"> · </span>
                <span className="font-display text-base font-semibold tabular-nums text-foreground">
                  {eventCountLabel(eventCount)}
                </span>
              </Field>
            </div>

            {tour.description && (
              <p className="max-w-2xl text-body leading-relaxed text-muted-foreground">
                {tour.description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onEdit}>
              <Pencil className="size-4" />
              {az.action.edit}
            </Button>
            <Button variant="destructive-ghost" size="sm" onClick={onDelete}>
              <Trash2 className="size-4" />
              {az.action.delete}
            </Button>
          </div>
        </div>

        {/* faint compass watermark — travel-journal motif */}
        <Compass
          aria-hidden
          strokeWidth={1}
          className="pointer-events-none absolute -bottom-6 -right-6 size-32 text-accent/[0.05]"
        />
      </TicketCard>
    </motion.div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarRange;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <span className="flex items-center gap-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <p className="mt-1 leading-tight">{children}</p>
    </div>
  );
}
