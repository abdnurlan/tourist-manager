"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/shared/event-card";
import { EmptyState } from "@/components/shared/empty-state";
import { EVENT_TYPE_ICON } from "@/components/shared/event-type-icon";
import { CREATE_TYPES } from "@/components/events/type-fields-config";
import { az } from "@/lib/i18n/az";
import { sortByTime, dateOnly, type DaySection } from "@/lib/utils/date";
import { eventMeta } from "@/lib/event-meta";
import type { Event, EventType } from "@/lib/types";

/** A row of per-type "add" buttons for a given day. */
function TypeButtons({
  dateISO,
  onAdd,
}: {
  dateISO: string;
  onAdd: (dateISO: string, type: EventType) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CREATE_TYPES.map((t) => {
        const Icon = EVENT_TYPE_ICON[t];
        return (
          <Button
            key={t}
            variant="secondary"
            size="sm"
            onClick={() => onAdd(dateISO, t)}
          >
            <Icon className="size-4" style={{ color: eventMeta(t).color }} />
            {az.eventType[t]}
          </Button>
        );
      })}
    </div>
  );
}

export interface DayTimelineProps {
  sections: DaySection[];
  /** Events bucketed by date (YYYY-MM-DD). */
  eventsByDate: Record<string, Event[]>;
  onAddEvent: (dateISO: string, type: EventType) => void;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (event: Event) => void;
}

/**
 * Itinerary as a vertical SPINE (CONTRACT §2.4). One section per tour day,
 * introduced by a serif "day stamp" ("1-ci gün — 18 İyun"). Each day's
 * EventCards hang off the spine, time-sorted, each carrying its event-type
 * color via a tinted connector dot. Staggered reveal per day.
 */
export function DayTimeline({
  sections,
  eventsByDate,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}: DayTimelineProps) {
  if (sections.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title={az.empty.events.title}
        subtitle={az.empty.events.subtitle}
      />
    );
  }

  return (
    <div className="relative space-y-9 pl-1">
      {/* continuous spine */}
      <span
        aria-hidden
        className="timeline-spine absolute left-[14px] top-3 bottom-3 w-0.5 md:left-[18px]"
      />

      {sections.map((section, i) => {
        const events = sortByTime(eventsByDate[dateOnly(section.dateISO)] ?? []);
        const [dayLabel, dateLabel] = splitDayLabel(section.label);
        return (
          <motion.section
            key={section.dateISO}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.34,
              delay: Math.min(i * 0.05, 0.3),
              ease: [0.16, 1, 0.3, 1],
            }}
            className="relative pl-10 md:pl-14"
          >
            {/* day-stamp node on the spine */}
            <span
              aria-hidden
              className="absolute left-0 top-0.5 flex size-7 items-center justify-center rounded-full border border-border bg-surface shadow-xs md:size-9"
            >
              <span className="day-stamp text-sm font-semibold text-accent md:text-base">
                {section.dayNumber}
              </span>
            </span>

            {/* day header — serif day stamp */}
            <div className="mb-3.5 min-w-0">
              <h3 className="day-stamp text-h3 font-semibold leading-tight tracking-tight text-foreground">
                {dayLabel}
              </h3>
              {dateLabel && (
                <p className="day-stamp mt-0.5 text-sm font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  {dateLabel}
                </p>
              )}
            </div>

            {/* events */}
            {events.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-surface/30 p-4">
                <TypeButtons dateISO={section.dateISO} onAdd={onAddEvent} />
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false} mode="popLayout">
                  {events.map((event) => {
                    const meta = eventMeta(event.type);
                    return (
                      <motion.div
                        key={event.id}
                        layout
                        initial={{ opacity: 0, y: 8, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="relative"
                      >
                        {/* connector dot tying the card to the spine, in the event-type color */}
                        <span
                          aria-hidden
                          className="absolute top-6 -left-[27px] size-2.5 rounded-full ring-4 ring-background md:-left-[39px]"
                          style={{ backgroundColor: meta.color }}
                        />
                        <span
                          aria-hidden
                          className="absolute top-[27px] -left-[24px] h-px w-4 bg-border md:-left-[36px]"
                        />
                        <EventCard
                          event={event}
                          onEdit={onEditEvent}
                          onDelete={onDeleteEvent}
                          showSource
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {/* Bu günə daha bir tədbir əlavə et */}
                <div className="pt-1">
                  <TypeButtons dateISO={section.dateISO} onAdd={onAddEvent} />
                </div>
              </div>
            )}
          </motion.section>
        );
      })}
    </div>
  );
}

/** Split "1-ci gün — 18 İyun" into ["1-ci gün", "18 İyun"]. */
function splitDayLabel(label: string): [string, string] {
  const idx = label.indexOf(" — ");
  if (idx === -1) return [label, ""];
  return [label.slice(0, idx), label.slice(idx + 3)];
}
