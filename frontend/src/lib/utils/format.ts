/* ─────────────────────────────────────────────────────────────
   Formatting helpers — price/currency, greeting, misc.
   ───────────────────────────────────────────────────────────── */

import { az } from "@/lib/i18n/az";

/** Format a price + currency, e.g. "40 ₼", "120 $". Returns "" when no price. */
const CURRENCY_SYMBOL: Record<string, string> = {
  AZN: "₼",
  USD: "$",
  EUR: "€",
  GBP: "£",
  TRY: "₺",
  RUB: "₽",
};

export function formatPrice(
  price: number | null | undefined,
  currency: string | null | undefined,
): string {
  if (price === null || price === undefined) return "";
  const formatted = new Intl.NumberFormat("az-AZ", {
    maximumFractionDigits: 2,
  }).format(price);
  if (!currency) return formatted;
  const sym = CURRENCY_SYMBOL[currency];
  return sym ? `${formatted} ${sym}` : `${formatted} ${currency}`;
}

/** Time-of-day aware Azerbaijani greeting. */
export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return az.dashboard.greeting_morning;
  if (h < 18) return az.dashboard.greeting_day;
  return az.dashboard.greeting_evening;
}

/** "3 event" pluralization (Azerbaijani has no plural marker here). */
export function eventCountLabel(n: number): string {
  return `${n} ${az.common.event}`;
}

/** "5 gün" */
export function dayCountLabel(n: number): string {
  return `${n} ${az.common.days}`;
}

/** Initials for an avatar fallback. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}
