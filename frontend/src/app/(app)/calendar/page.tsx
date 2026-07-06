"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarX2 } from "lucide-react";
import { PageHeader, PageBody } from "@/components/layout/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { EventListSkeleton } from "@/components/shared/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ViewSwitcher,
  EventTypeFilter,
  MonthView,
  WeekView,
  DayView,
  AgendaView,
  EventDetail,
  rangeForView,
  shiftAnchor,
  buildWeekDays,
  type CalendarView,
} from "@/components/calendar";
import {
  useCalendarEvents,
  useCalendarTours,
} from "@/lib/hooks/use-calendar-events";
import { useIsDesktop } from "@/lib/hooks/use-media-query";
import {
  monthName,
  toDateISO,
  todayISO,
  formatLongDate,
  formatDateRange,
  parseDateISO,
} from "@/lib/utils/date";
import { az } from "@/lib/i18n/az";
import type { CalendarQuery, EventType, EventWithTour, Tour } from "@/lib/types";

/** Period heading for the toolbar, per view + anchor. */
function periodHeading(view: CalendarView, anchorISO: string): string {
  const d = parseDateISO(anchorISO);
  switch (view) {
    case "month":
    case "agenda":
      return `${monthName(d.getMonth())} ${d.getFullYear()}`;
    case "week": {
      const days = buildWeekDays(anchorISO);
      return formatDateRange(toDateISO(days[0]), toDateISO(days[6]));
    }
    case "day":
      return formatLongDate(anchorISO);
  }
}

export default function CalendarPage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  // Mobile defaults to the agenda/timeline view; desktop to the month grid.
  const [view, setView] = useState<CalendarView>("month");
  const [viewTouched, setViewTouched] = useState(false);
  const [anchor, setAnchor] = useState<string>(() => todayISO());
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
  const [selected, setSelected] = useState<EventWithTour | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Apply responsive default once, until the user picks a view themselves.
  useEffect(() => {
    if (!viewTouched) setView(isDesktop ? "month" : "agenda");
  }, [isDesktop, viewTouched]);

  const handleViewChange = (v: CalendarView) => {
    setViewTouched(true);
    setView(v);
  };

  const range = useMemo(() => rangeForView(view, anchor), [view, anchor]);
  const query: CalendarQuery = useMemo(
    () => ({
      from: range.from,
      to: range.to,
      ...(typeFilter !== "all" ? { type: typeFilter } : {}),
    }),
    [range, typeFilter],
  );

  const { data: events = [], isLoading, isError } = useCalendarEvents(query);
  const {
    data: tours = [],
    isLoading: toursLoading,
    isError: toursError,
  } = useCalendarTours({ from: range.from, to: range.to });

  const loading = isLoading || toursLoading;
  const error = isError || toursError;
  const hasItems = events.length > 0 || tours.length > 0;

  const openEvent = (event: EventWithTour) => {
    setSelected(event);
    setDetailOpen(true);
  };

  const openTour = (tour: Tour) => {
    router.push(`/tours/${tour.id}`);
  };

  const drillToDay = (dateISO: string) => {
    setAnchor(dateISO);
    handleViewChange("day");
  };

  const goToday = () => setAnchor(todayISO());
  const heading = periodHeading(view, anchor);

  return (
    <PageTransition>
      <PageHeader
        title={az.screen.calendar}
        actions={
          <div className="hidden md:block">
            <ViewSwitcher value={view} onChange={handleViewChange} />
          </div>
        }
      />

      <PageBody className="space-y-4">
        {/* Toolbar: nav + heading + filter (+ mobile view switcher) */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded-xl border border-border bg-surface p-0.5 shadow-xs">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={az.calendar.prev}
                className="rounded-lg"
                onClick={() => setAnchor(shiftAnchor(view, anchor, -1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={az.calendar.next}
                className="rounded-lg"
                onClick={() => setAnchor(shiftAnchor(view, anchor, 1))}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <h2 className="ml-1.5 min-w-0 truncate font-display text-h3 font-semibold tracking-tight text-foreground">
              {heading}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl text-accent"
              onClick={goToday}
            >
              {az.calendar.today}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2 md:justify-end">
            <EventTypeFilter value={typeFilter} onChange={setTypeFilter} />
            <div className="md:hidden">
              <ViewSwitcher value={view} onChange={handleViewChange} />
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <CalendarSkeleton view={view} />
        ) : error ? (
          <EmptyState
            icon={CalendarX2}
            title={az.common.error_title}
            subtitle={az.common.error_subtitle}
            action={
              <Button variant="secondary" onClick={() => setAnchor(todayISO())}>
                {az.action.retry}
              </Button>
            }
          />
        ) : view === "agenda" && !hasItems ? (
          // Grid views (month/week/day) render their own empty days, so they
          // must ALWAYS draw the structure — only the agenda list collapses to
          // a full empty state when the window has no events.
          <EmptyState
            icon={CalendarX2}
            title={az.empty.calendar.title}
            subtitle={az.empty.calendar.subtitle}
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${view}-${anchor}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {view === "month" && (
                <MonthView
                  anchorISO={anchor}
                  events={events}
                  tours={tours}
                  onSelectEvent={openEvent}
                  onSelectTour={openTour}
                  onSelectDay={drillToDay}
                />
              )}
              {view === "week" && (
                <WeekView
                  anchorISO={anchor}
                  events={events}
                  tours={tours}
                  onSelectEvent={openEvent}
                  onSelectTour={openTour}
                  onSelectDay={drillToDay}
                />
              )}
              {view === "day" && (
                <DayView
                  anchorISO={anchor}
                  events={events}
                  tours={tours}
                  onSelectEvent={openEvent}
                  onSelectTour={openTour}
                />
              )}
              {view === "agenda" && (
                <AgendaView
                  events={events}
                  tours={tours}
                  onSelectEvent={openEvent}
                  onSelectTour={openTour}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </PageBody>

      <EventDetail event={selected} open={detailOpen} onOpenChange={setDetailOpen} />
    </PageTransition>
  );
}

/** View-shaped loading skeletons. */
function CalendarSkeleton({ view }: { view: CalendarView }) {
  if (view === "month") {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
        <div className="grid grid-cols-7 gap-px border-b border-border bg-surface-muted/50 p-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="mx-auto h-3 w-6" />
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-6">
          {Array.from({ length: 42 }).map((_, i) => (
            <div
              key={i}
              className="min-h-[112px] border-b border-r border-border/60 p-1.5"
            >
              <Skeleton className="ml-auto size-7 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (view === "week") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[168px] space-y-2 rounded-lg border border-border bg-surface p-3 shadow-sm"
          >
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-6 w-full rounded-md" />
            <Skeleton className="h-6 w-2/3 rounded-md" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl">
      <EventListSkeleton count={5} />
    </div>
  );
}
