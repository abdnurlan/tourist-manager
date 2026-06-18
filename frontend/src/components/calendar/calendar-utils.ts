/* ─────────────────────────────────────────────────────────────
   Calendar screen-local helpers: range computation + month grid.
   Reuses foundation date utils (parseDateISO/toDateISO) from
   @/lib/utils/date. All dates are plain YYYY-MM-DD (no TZ drift).
   ───────────────────────────────────────────────────────────── */

import { parseDateISO, toDateISO, dateOnly } from "@/lib/utils/date";
import type { EventWithTour } from "@/lib/types";

export type CalendarView = "month" | "week" | "day" | "agenda";

/** Visible-range request window per view + anchor date (inclusive). */
export interface DateRange {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

/** Clone + add days to a Date without mutating the source. */
function addDays(date: Date, days: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

/** Monday-first weekday index for a Date (0=Mon … 6=Sun). */
export function mondayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** First day of the anchor's month. */
export function startOfMonth(anchorISO: string): Date {
  const d = parseDateISO(anchorISO);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Monday that begins the calendar grid for the anchor's month. */
export function startOfMonthGrid(anchorISO: string): Date {
  const first = startOfMonth(anchorISO);
  return addDays(first, -mondayIndex(first));
}

/** Monday that begins the week containing the anchor. */
export function startOfWeek(anchorISO: string): Date {
  const d = parseDateISO(anchorISO);
  return addDays(d, -mondayIndex(d));
}

/**
 * 6-week (42-cell) month grid, Monday-first. Always 42 days so the grid
 * height is stable across months — a hallmark of professional calendars.
 */
export function buildMonthGrid(anchorISO: string): Date[] {
  const start = startOfMonthGrid(anchorISO);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

/** 7 days of the week containing the anchor (Mon→Sun). */
export function buildWeekDays(anchorISO: string): Date[] {
  const start = startOfWeek(anchorISO);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Inclusive fetch range for the current view + anchor. */
export function rangeForView(view: CalendarView, anchorISO: string): DateRange {
  switch (view) {
    case "month": {
      const grid = buildMonthGrid(anchorISO);
      return { from: toDateISO(grid[0]), to: toDateISO(grid[grid.length - 1]) };
    }
    case "week": {
      const days = buildWeekDays(anchorISO);
      return { from: toDateISO(days[0]), to: toDateISO(days[days.length - 1]) };
    }
    case "day":
      return { from: anchorISO, to: anchorISO };
    case "agenda": {
      // Agenda spans from the start of the anchor month forward ~90 days.
      const first = startOfMonth(anchorISO);
      return { from: toDateISO(first), to: toDateISO(addDays(first, 90)) };
    }
  }
}

/** Step the anchor backward/forward by one view-unit. */
export function shiftAnchor(
  view: CalendarView,
  anchorISO: string,
  dir: -1 | 1,
): string {
  const d = parseDateISO(anchorISO);
  switch (view) {
    case "month":
    case "agenda":
      return toDateISO(new Date(d.getFullYear(), d.getMonth() + dir, 1));
    case "week":
      return toDateISO(addDays(d, 7 * dir));
    case "day":
      return toDateISO(addDays(d, dir));
  }
}

/** Human heading for the current view + anchor (built by caller w/ i18n). */
export function isSameDay(a: Date, iso: string): boolean {
  return toDateISO(a) === iso;
}

/**
 * Group events by their calendar date (YYYY-MM-DD) → sorted-by-time arrays.
 *
 * The API serializes `event.date` as a full RFC3339 datetime
 * (e.g. "2026-06-11T00:00:00Z"), while calendar cells are keyed by the plain
 * `YYYY-MM-DD` produced by `toDateISO`. We MUST normalize with `dateOnly` so
 * lookups match — otherwise every cell/column reads empty (the month-grid bug).
 */
export function groupByDate(
  events: EventWithTour[],
): Map<string, EventWithTour[]> {
  const map = new Map<string, EventWithTour[]>();
  for (const ev of events) {
    const key = dateOnly(ev.date);
    const list = map.get(key);
    if (list) list.push(ev);
    else map.set(key, [ev]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (a.time ?? "99:99").localeCompare(b.time ?? "99:99"));
  }
  return map;
}

/** Ascending list of calendar dates (YYYY-MM-DD) that actually have events. */
export function sortedEventDates(events: EventWithTour[]): string[] {
  return Array.from(new Set(events.map((e) => dateOnly(e.date)))).sort();
}

export { addDays };
