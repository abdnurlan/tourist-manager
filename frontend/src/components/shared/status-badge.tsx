import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  eventStatusLabel,
  tourStatusLabel,
} from "@/lib/i18n/az";
import type { EventStatus, TourStatus } from "@/lib/types";

type StatusVariant = NonNullable<BadgeProps["variant"]>;

const EVENT_STATUS_VARIANT: Record<EventStatus, StatusVariant> = {
  planned: "accent",
  done: "success",
  cancelled: "danger",
};

const TOUR_STATUS_VARIANT: Record<TourStatus, StatusVariant> = {
  planned: "accent",
  active: "info",
  completed: "success",
  cancelled: "danger",
};

export interface StatusBadgeProps {
  /** Provide one of the two. */
  eventStatus?: EventStatus;
  tourStatus?: TourStatus;
  className?: string;
}

/** Status pill for events (planned/done/cancelled) or tours (+active/completed). */
export function StatusBadge({ eventStatus, tourStatus, className }: StatusBadgeProps) {
  if (tourStatus) {
    return (
      <Badge variant={TOUR_STATUS_VARIANT[tourStatus]} className={className}>
        {tourStatusLabel(tourStatus)}
      </Badge>
    );
  }
  if (eventStatus) {
    return (
      <Badge variant={EVENT_STATUS_VARIANT[eventStatus]} className={className}>
        {eventStatusLabel(eventStatus)}
      </Badge>
    );
  }
  return null;
}
