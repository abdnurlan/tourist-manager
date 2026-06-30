import {
  Car,
  BedDouble,
  UtensilsCrossed,
  Map,
  Plane,
  StickyNote,
  CircleEllipsis,
  type LucideIcon,
} from "lucide-react";
import { az } from "@/lib/i18n/az";
import type { EventType } from "@/lib/types";

/**
 * Centralized per-event-type visual identity for the "Səyahət Jurnalı"
 * aesthetic. Every surface that renders an event (EventCard, Calendar,
 * EventTypeIcon, timelines) sources its icon + color spine/dot/chip from
 * here so each type stays consistent across the app.
 *
 * `color`  → the ink/spine/dot/icon hex for the type.
 * `subtle` → the tinted chip/background hex for the type.
 * `label`  → the Azerbaijani label (from lib/i18n/az.ts — no English leaks).
 */
export interface EventMeta {
  /** i18n key into az.eventType. */
  labelKey: EventType;
  /** Resolved Azerbaijani label. */
  label: string;
  icon: LucideIcon;
  /** Spine / dot / icon ink color (hex). */
  color: string;
  /** Tinted chip / subtle background (hex). */
  subtle: string;
}

export const EVENT_META: Record<EventType, EventMeta> = {
  transfer: {
    labelKey: "transfer",
    label: az.eventType.transfer,
    icon: Car,
    color: "#01335e", // brand navy
    subtle: "#d7e3f0",
  },
  hotel: {
    labelKey: "hotel",
    label: az.eventType.hotel,
    icon: BedDouble,
    color: "#e9790d", // sun-orange
    subtle: "#fbe6ce",
  },
  restaurant: {
    labelKey: "restaurant",
    label: az.eventType.restaurant,
    icon: UtensilsCrossed,
    color: "#b8791c", // amber
    subtle: "#f3e7cf",
  },
  tour: {
    labelKey: "tour",
    label: az.eventType.tour,
    icon: Map,
    color: "#4f6f8f", // slate-blue
    subtle: "#e1e8ef",
  },
  flight: {
    labelKey: "flight",
    label: az.eventType.flight,
    icon: Plane,
    color: "#2f6f9e", // sky
    subtle: "#d9e6ef",
  },
  note: {
    labelKey: "note",
    label: az.eventType.note,
    icon: StickyNote,
    color: "#6f655a", // ink
    subtle: "#ece4d6",
  },
  other: {
    labelKey: "other",
    label: az.eventType.other,
    icon: CircleEllipsis,
    color: "#8a7f70", // warm-gray
    subtle: "#ece4d6",
  },
};

/** Safe accessor that falls back to `other` for unknown/bad data. */
export function eventMeta(type: EventType): EventMeta {
  return EVENT_META[type] ?? EVENT_META.other;
}
