"use client";

import { motion } from "framer-motion";
import { CalendarEventPill } from "./calendar-event-pill";
import { CalendarTourPill } from "./calendar-tour-pill";
import { typeStyle } from "./event-type-style";
import { buildMonthGrid, groupByDate, groupToursByDate } from "./calendar-utils";
import { cn } from "@/lib/utils/cn";
import { parseDateISO, toDateISO, todayISO } from "@/lib/utils/date";
import type { EventWithTour, Tour } from "@/lib/types";
import { az } from "@/lib/i18n/az";

export interface MonthViewProps {
  anchorISO: string;
  events: EventWithTour[];
  tours: Tour[];
  onSelectEvent: (event: EventWithTour) => void;
  onSelectTour: (tour: Tour) => void;
  /** Drill into the day view when a date cell is clicked. */
  onSelectDay: (dateISO: string) => void;
}

const MAX_VISIBLE = 4;

/** Professional Monday-first 6-week month grid, editorial "journal" framing.
 *  Always renders the full 7×6 grid: AZ weekday headers, dimmed adjacent-month
 *  days, today highlighted, and type-colored event chips (lib/event-meta). */
export function MonthView({
  anchorISO,
  events,
  tours,
  onSelectEvent,
  onSelectTour,
  onSelectDay,
}: MonthViewProps) {
  const grid = buildMonthGrid(anchorISO);
  const byDate = groupByDate(events);
  const toursByDate = groupToursByDate(tours);
  const today = todayISO();
  const currentMonth = parseDateISO(anchorISO).getMonth();

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      {/* Weekday header — uppercase journal labels */}
      <div className="grid grid-cols-7 border-b border-border bg-surface-muted/50">
        {az.calendar.weekdaysShort.map((wd, i) => (
          <div
            key={i}
            className={cn(
              "px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.08em]",
              i >= 5 ? "text-terracotta/80" : "text-muted-foreground",
            )}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* 42-cell grid */}
      <div className="grid grid-cols-7 grid-rows-6">
        {grid.map((date, i) => {
          const iso = toDateISO(date);
          const dayEvents = byDate.get(iso) ?? [];
          const dayTours = toursByDate.get(iso) ?? [];
          const visibleTours = dayTours.slice(0, MAX_VISIBLE);
          const visibleEvents = dayEvents.slice(0, MAX_VISIBLE - visibleTours.length);
          const inMonth = date.getMonth() === currentMonth;
          const isToday = iso === today;
          const isWeekend = (date.getDay() + 6) % 7 >= 5;
          const overflow =
            dayTours.length + dayEvents.length - visibleTours.length - visibleEvents.length;
          const row = Math.floor(i / 7);

          return (
            <motion.div
              key={iso}
              role="button"
              tabIndex={0}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.18,
                delay: row * 0.03,
                ease: [0.16, 1, 0.3, 1],
              }}
              onClick={() => onSelectDay(iso)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectDay(iso);
                }
              }}
              className={cn(
                "group relative flex min-h-[112px] flex-col gap-1 border-b border-r border-border/60 p-1.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                "hover:bg-surface-muted/40",
                i % 7 === 6 && "border-r-0",
                i >= 35 && "border-b-0",
                !inMonth && "bg-surface-muted/25",
                isWeekend && inMonth && "bg-accent-subtle/15",
                isToday && "bg-accent-subtle/30",
              )}
            >
              {/* Day number — Fraunces date stamp */}
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center self-end rounded-full font-display text-sm tabular-nums",
                  inMonth ? "text-foreground" : "text-muted-foreground/45",
                  isToday &&
                    "bg-accent font-semibold text-accent-foreground shadow-xs",
                )}
              >
                {date.getDate()}
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {visibleTours.map((tour) => (
                  <CalendarTourPill
                    key={tour.id}
                    tour={tour}
                    onClick={onSelectTour}
                    variant="compact"
                  />
                ))}
                {visibleEvents.map((ev) => (
                  <CalendarEventPill
                    key={ev.id}
                    event={ev}
                    onClick={onSelectEvent}
                    variant="compact"
                  />
                ))}
                {overflow > 0 && (
                  <span className="pl-1 text-[11px] font-medium tabular-nums text-muted-foreground">
                    +{overflow}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/** Mobile-friendly month dots indicator (used under a compact month). */
export function MonthDots({ events }: { events: EventWithTour[] }) {
  const types = Array.from(new Set(events.map((e) => e.type))).slice(0, 4);
  return (
    <div className="flex items-center gap-0.5">
      {types.map((t) => (
        <motion.span
          key={t}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="size-1.5 rounded-full"
          style={typeStyle(t).dotStyle}
        />
      ))}
    </div>
  );
}
