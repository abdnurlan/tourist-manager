"use client";

import { motion } from "framer-motion";
import { CalendarEventPill } from "./calendar-event-pill";
import { buildWeekDays, groupByDate } from "./calendar-utils";
import { cn } from "@/lib/utils/cn";
import { toDateISO, todayISO, weekdayNameShort } from "@/lib/utils/date";
import { az } from "@/lib/i18n/az";
import type { EventWithTour } from "@/lib/types";

export interface WeekViewProps {
  anchorISO: string;
  events: EventWithTour[];
  onSelectEvent: (event: EventWithTour) => void;
  onSelectDay: (dateISO: string) => void;
}

/** Monday-first 7-column week view. Each column is a stacked day agenda,
 *  styled as a small journal card with a Fraunces date and today accent. */
export function WeekView({
  anchorISO,
  events,
  onSelectEvent,
  onSelectDay,
}: WeekViewProps) {
  const days = buildWeekDays(anchorISO);
  const byDate = groupByDate(events);
  const today = todayISO();

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
    >
      {days.map((date) => {
        const iso = toDateISO(date);
        const dayEvents = byDate.get(iso) ?? [];
        const isToday = iso === today;
        const isWeekend = (date.getDay() + 6) % 7 >= 5;

        return (
          <motion.div
            key={iso}
            variants={{
              hidden: { opacity: 0, y: 8 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className={cn(
              "flex min-h-[168px] flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm",
              isToday && "ring-1 ring-accent",
            )}
          >
            <button
              type="button"
              onClick={() => onSelectDay(iso)}
              className={cn(
                "flex items-center justify-between gap-1 border-b border-border px-3 py-2 text-left transition-colors hover:bg-surface-muted/50",
                isToday ? "bg-accent-subtle/50" : "bg-surface-muted/30",
              )}
            >
              <span
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-[0.06em]",
                  isWeekend ? "text-terracotta/80" : "text-muted-foreground",
                )}
              >
                {weekdayNameShort(date)}
              </span>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full font-display text-base tabular-nums",
                  isToday
                    ? "bg-accent font-semibold text-accent-foreground"
                    : "text-foreground",
                )}
              >
                {date.getDate()}
              </span>
            </button>

            <div className="flex flex-1 flex-col gap-1.5 p-2">
              {dayEvents.length === 0 ? (
                <span className="px-1 py-1 text-[11px] text-muted-foreground/60">
                  {az.calendar.no_events}
                </span>
              ) : (
                dayEvents.map((ev) => (
                  <CalendarEventPill
                    key={ev.id}
                    event={ev}
                    onClick={onSelectEvent}
                    variant="compact"
                  />
                ))
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
