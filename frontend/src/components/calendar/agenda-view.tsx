"use client";

import { EventCard } from "@/components/shared/event-card";
import { StaggerList, StaggerItem } from "@/components/shared/page-transition";
import { groupByDate, sortedEventDates } from "./calendar-utils";
import { cn } from "@/lib/utils/cn";
import {
  formatDayMonth,
  relativeDay,
  todayISO,
  weekdayNameShort,
  parseDateISO,
} from "@/lib/utils/date";
import type { EventWithTour } from "@/lib/types";

export interface AgendaViewProps {
  events: EventWithTour[];
  onSelectEvent: (event: EventWithTour) => void;
}

/** Chronological timeline/agenda grouped by day (mobile default).
 *  Each day is introduced by a serif "day stamp"; events hang off a spine. */
export function AgendaView({ events, onSelectEvent }: AgendaViewProps) {
  const byDate = groupByDate(events);
  const dates = sortedEventDates(events);
  const today = todayISO();

  return (
    <StaggerList className="space-y-7">
      {dates.map((iso) => {
        const dayEvents = byDate.get(iso) ?? [];
        const isToday = iso === today;
        const date = parseDateISO(iso);

        return (
          <StaggerItem key={iso}>
            <section>
              {/* Sticky day-stamp header */}
              <div className="sticky top-16 z-10 -mx-1 mb-3 flex items-center gap-3 bg-background/85 px-1 py-1 backdrop-blur">
                <span
                  className={cn(
                    "flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border text-center",
                    isToday
                      ? "border-accent bg-accent text-accent-foreground shadow-xs"
                      : "border-border bg-surface text-foreground",
                  )}
                >
                  <span className="font-display text-lg font-semibold leading-none tabular-nums">
                    {date.getDate()}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium uppercase tracking-[0.06em] leading-tight",
                      isToday
                        ? "text-accent-foreground/80"
                        : "text-muted-foreground",
                    )}
                  >
                    {weekdayNameShort(date)}
                  </span>
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "font-display text-h3 font-semibold leading-tight tracking-tight",
                      isToday && "text-accent",
                    )}
                  >
                    {relativeDay(iso)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDayMonth(iso)}
                  </p>
                </div>
                <span className="ml-auto rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                  {dayEvents.length}
                </span>
              </div>

              <div className="space-y-3 border-l-2 border-dashed border-border/70 pl-4">
                {dayEvents.map((ev) => (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    tourTitle={ev.tour_title}
                    onClick={() => onSelectEvent(ev)}
                  />
                ))}
              </div>
            </section>
          </StaggerItem>
        );
      })}
    </StaggerList>
  );
}
