/* ─────────────────────────────────────────────────────────────
   Date / time helpers — Azerbaijani formatting (CONTRACT §2.3, §9.20)
   Dates are plain YYYY-MM-DD; we parse them as local calendar dates
   (no timezone drift). Timestamps are RFC3339, displayed Asia/Baku.
   ───────────────────────────────────────────────────────────── */

import { az } from "@/lib/i18n/az";

/** Normalize any date-ish string to a plain YYYY-MM-DD (the calendar date part).
 *  Accepts both "2026-06-11" and full RFC3339 datetimes ("2026-06-11T00:00:00Z"),
 *  since the API serializes date columns as timestamps. */
export function dateOnly(iso: string): string {
  return (iso ?? "").slice(0, 10);
}

/** Parse a date string into a Date at local midnight (no TZ drift).
 *  Tolerant of full datetimes, not just YYYY-MM-DD. */
export function parseDateISO(iso: string): Date {
  const [y, m, d] = dateOnly(iso).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Format a Date back to YYYY-MM-DD. */
export function toDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Today's calendar date as YYYY-MM-DD (guide local). */
export function todayISO(): string {
  return toDateISO(new Date());
}

/** Azerbaijani month name (0-based or from ISO). */
export function monthName(monthIndex: number): string {
  return az.calendar.months[monthIndex] ?? "";
}

export function monthNameShort(monthIndex: number): string {
  return az.calendar.monthsShort[monthIndex] ?? "";
}

/**
 * Weekday name. JS getDay(): 0=Sunday..6=Saturday.
 * Our dictionary is Monday-first (0=Monday..6=Sunday).
 */
export function weekdayName(date: Date): string {
  const idx = (date.getDay() + 6) % 7;
  return az.calendar.weekdays[idx] ?? "";
}

export function weekdayNameShort(date: Date): string {
  const idx = (date.getDay() + 6) % 7;
  return az.calendar.weekdaysShort[idx] ?? "";
}

/** "18 İyun" */
export function formatDayMonth(iso: string): string {
  const d = parseDateISO(iso);
  return `${d.getDate()} ${monthName(d.getMonth())}`;
}

/** "18 İyun 2026" */
export function formatLongDate(iso: string): string {
  const d = parseDateISO(iso);
  return `${d.getDate()} ${monthName(d.getMonth())} ${d.getFullYear()}`;
}

/** "B.e, 18 İyun" */
export function formatDateWithWeekday(iso: string): string {
  const d = parseDateISO(iso);
  return `${weekdayNameShort(d)}, ${d.getDate()} ${monthName(d.getMonth())}`;
}

/** "18 — 22 İyun" or "28 İyun — 2 İyul" range. */
export function formatDateRange(startISO: string, endISO: string): string {
  const s = parseDateISO(startISO);
  const e = parseDateISO(endISO);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()} — ${e.getDate()} ${monthName(s.getMonth())}`;
  }
  return `${s.getDate()} ${monthName(s.getMonth())} — ${e.getDate()} ${monthName(e.getMonth())}`;
}

/** Display an RFC3339 timestamp in Asia/Baku (UTC+4). Returns "18 İyun, 09:00". */
export function formatTimestamp(rfc: string): string {
  const date = new Date(rfc);
  // Shift into Asia/Baku (UTC+4) via formatToParts to avoid host-TZ drift.
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Baku",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = Number(get("day"));
  const month = Number(get("month")) - 1;
  return `${day} ${monthName(month)}, ${get("hour")}:${get("minute")}`;
}

/** Time-of-day "HH:mm" passthrough/normalization. */
export function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  return time.slice(0, 5);
}

/** Relative-ish "Bu gün" / "Sabah" / formatted date for an ISO date. */
export function relativeDay(iso: string): string {
  const day = dateOnly(iso);
  const today = todayISO();
  const t = parseDateISO(today);
  const tomorrow = toDateISO(new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1));
  if (day === today) return az.calendar.today;
  if (day === tomorrow) return az.calendar.tomorrow;
  return formatDayMonth(day);
}

// ── Azerbaijani ordinal suffixes (vowel harmony, §9.20) ────────
// Pattern repeats per last digit with overrides for tens.
const ORDINAL_SUFFIX: Record<number, string> = {
  1: "ci",
  2: "ci",
  3: "cü",
  4: "cü",
  5: "ci",
  6: "cı",
  7: "ci",
  8: "ci",
  9: "cu",
  10: "cu",
  11: "ci",
  12: "ci",
  13: "cü",
  14: "cü",
  15: "ci",
  16: "cı",
  17: "ci",
  18: "ci",
  19: "cu",
  20: "ci",
  21: "ci",
  22: "ci",
  23: "cü",
  24: "cü",
  25: "ci",
  26: "cı",
  27: "ci",
  28: "ci",
  29: "cu",
  30: "cu",
  31: "ci",
};

export function ordinalSuffix(n: number): string {
  return ORDINAL_SUFFIX[n] ?? "ci";
}

export interface DaySection {
  dayNumber: number;
  dateISO: string;
  label: string;
}

/**
 * Build day sections for a tour timeline (CONTRACT §2.4).
 * Label format: "1-ci gün — 18 İyun".
 */
export function buildDaySections(startISO: string, endISO: string): DaySection[] {
  const start = parseDateISO(startISO);
  const end = parseDateISO(endISO);
  const sections: DaySection[] = [];
  let n = 1;
  const cursor = new Date(start);
  // guard against inverted ranges
  const last = end >= start ? end : start;
  while (cursor <= last) {
    const dateISO = toDateISO(cursor);
    sections.push({
      dayNumber: n,
      dateISO,
      label: daySectionLabel(n, dateISO),
    });
    cursor.setDate(cursor.getDate() + 1);
    n += 1;
    if (n > 366) break; // safety
  }
  return sections;
}

/** "1-ci gün — 18 İyun" */
export function daySectionLabel(n: number, dateISO: string): string {
  return `${n}-${ordinalSuffix(n)} ${az.tour.day_word} — ${formatDayMonth(dateISO)}`;
}

/**
 * Sort comparator for events by time-of-day "HH:mm".
 * Null/empty times sort last. Use with Array.prototype.sort.
 */
export function compareByTime(
  a: { time: string | null },
  b: { time: string | null },
): number {
  const at = a.time ?? "99:99";
  const bt = b.time ?? "99:99";
  return at.localeCompare(bt);
}

/** Sort a list of timed items ascending by time-of-day (stable copy). */
export function sortByTime<T extends { time: string | null }>(items: T[]): T[] {
  return [...items].sort(compareByTime);
}
