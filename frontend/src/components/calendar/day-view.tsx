"use client";

import { CalendarDays } from "lucide-react";
import { EventCard } from "@/components/shared/event-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StaggerList, StaggerItem } from "@/components/shared/page-transition";
import { groupByDate } from "./calendar-utils";
import {
  formatLongDate,
  todayISO,
  weekdayName,
  parseDateISO,
  dateOnly,
} from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import { az } from "@/lib/i18n/az";
import type { EventWithTour } from "@/lib/types";

export interface DayViewProps {
  anchorISO: string;
  events: EventWithTour[];
  onSelectEvent: (event: EventWithTour) => void;
}

/** Single-day detailed agenda using the shared EventCard + a timeline spine. */
export function DayView({ anchorISO, events, onSelectEvent }: DayViewProps) {
  const key = dateOnly(anchorISO);
  const dayEvents = groupByDate(events).get(key) ?? [];
  const isToday = key === todayISO();
  const date = parseDateISO(anchorISO);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Editorial day-stamp header */}
      <div className="mb-5 flex items-end justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-baseline gap-3">
          <span
            className={cn(
              "font-display text-5xl leading-none tabular-nums",
              isToday ? "text-accent" : "text-foreground",
            )}
          >
            {date.getDate()}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {weekdayName(date)}
            </p>
            <h2
              className={cn(
                "font-display text-h3 font-semibold tracking-tight",
                isToday && "text-accent",
              )}
            >
              {formatLongDate(anchorISO)}
            </h2>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
          {dayEvents.length} {az.common.event}
        </span>
      </div>

      {dayEvents.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={az.calendar.no_events}
          subtitle={az.empty.today.subtitle}
        />
      ) : (
        <StaggerList className="relative space-y-3 pl-5">
          {/* timeline spine */}
          <span
            aria-hidden
            className="timeline-spine absolute bottom-2 left-[3px] top-2 w-px"
          />
          {dayEvents.map((ev) => (
            <StaggerItem key={ev.id} className="relative">
              <span
                aria-hidden
                className="absolute -left-[18px] top-5 size-2 rounded-full bg-accent ring-4 ring-background"
              />
              <EventCard
                event={ev}
                tourTitle={ev.tour_title}
                onClick={() => onSelectEvent(ev)}
              />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </div>
  );
}
