"use client";

import { motion } from "framer-motion";
import { Map, CalendarClock, SearchX, SearchCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EventCard } from "@/components/shared/event-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StaggerList, StaggerItem } from "@/components/shared/page-transition";
import { EventListSkeleton } from "@/components/shared/skeletons";
import { TourResultCard } from "./tour-result-card";
import { az, t } from "@/lib/i18n/az";
import type { SearchResponse, Tour, EventWithTour } from "@/lib/types";

export interface SearchResultsProps {
  query: string;
  data: SearchResponse | undefined;
  isIdle: boolean;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelectTour: (tour: Tour) => void;
  onSelectEvent: (event: EventWithTour) => void;
}

/** Renders grouped (Turlar / Eventlər) instant-search results with
 *  idle / loading / empty / error states — all Azerbaijani. */
export function SearchResults({
  query,
  data,
  isIdle,
  isLoading,
  isError,
  onRetry,
  onSelectTour,
  onSelectEvent,
}: SearchResultsProps) {
  // 1) Nothing typed yet.
  if (isIdle) {
    return (
      <EmptyState
        icon={SearchCheck}
        title={az.screen.search}
        subtitle={az.empty.search.idle}
      />
    );
  }

  // 2) Error.
  if (isError) {
    return (
      <EmptyState
        icon={SearchX}
        title={az.common.error_title}
        subtitle={az.common.error_subtitle}
        action={
          <button
            type="button"
            onClick={onRetry}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-xs transition-colors duration-fast hover:bg-accent-hover"
          >
            {az.action.retry}
          </button>
        }
      />
    );
  }

  // 3) First load for this query (no previous data to keep on screen).
  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        <GroupSkeletonHeader />
        <EventListSkeleton count={4} />
      </div>
    );
  }

  const tours = data.data.tours ?? [];
  const events = data.data.events ?? [];
  const total = tours.length + events.length;

  // 4) No matches.
  if (total === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={az.empty.search.title}
        subtitle={az.empty.search.subtitle}
      />
    );
  }

  // 5) Grouped results.
  return (
    <div className="space-y-8">
      {tours.length > 0 && (
        <Group
          icon={<Map className="size-4" />}
          label={az.search.tours_group}
          count={tours.length}
        >
          <StaggerList className="space-y-3">
            {tours.map((tour) => (
              <StaggerItem key={tour.id}>
                <TourResultCard tour={tour} onClick={onSelectTour} />
              </StaggerItem>
            ))}
          </StaggerList>
        </Group>
      )}

      {events.length > 0 && (
        <Group
          icon={<CalendarClock className="size-4" />}
          label={az.search.events_group}
          count={events.length}
        >
          <StaggerList className="space-y-3">
            {events.map((event) => (
              <StaggerItem key={event.id}>
                <EventCard
                  event={event}
                  tourTitle={event.tour_title}
                  onClick={() => onSelectEvent(event)}
                />
              </StaggerItem>
            ))}
          </StaggerList>
        </Group>
      )}
    </div>
  );
}

function Group({
  icon,
  label,
  count,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="flex size-7 items-center justify-center rounded-lg bg-accent-subtle text-accent">
          {icon}
        </span>
        <h2 className="font-display text-h3 font-semibold tracking-tight text-foreground">
          {label}
        </h2>
        <span className="h-px flex-1 bg-border" aria-hidden />
        <Badge variant="neutral" className="tabular-nums">
          {t(az.search.results_count, { n: count })}
        </Badge>
      </div>
      {children}
    </motion.section>
  );
}

function GroupSkeletonHeader() {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-4 w-24 animate-pulse rounded-md bg-surface-muted" />
    </div>
  );
}
