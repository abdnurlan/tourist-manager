/* ─────────────────────────────────────────────────────────────
   Pricing preview — mirrors backend/internal/pricing (the Go
   package carries the reference tests and stays the authority).

   Used only by the catalog form's live preview, so an admin sees
   what a bracket will actually charge before saving.
   ───────────────────────────────────────────────────────────── */

import type { Pricing, PriceBasis, PriceTier } from "@/lib/types";

export interface PriceQuote {
  total: number;
  perPerson: number;
  basis: PriceBasis;
  vehicles: number;
  onRequest: boolean;
  floorApplied: boolean;
}

function rateOf(tier: PriceTier, key: string): number | null {
  const v = tier.rates?.[key];
  if (typeof v === "number") return v;
  const std = tier.rates?.std;
  return typeof std === "number" ? std : null;
}

function rawTotal(tier: PriceTier, pax: number, key: string): number | null {
  const rate = rateOf(tier, key);
  if (rate === null) return null;
  return tier.basis === "group" ? rate : rate * pax;
}

/** Price a party of `pax` for the given rate column ("he" | "std"). */
export function quotePrice(
  pricing: Pricing | null | undefined,
  pax: number,
  key: "he" | "std",
): PriceQuote | null {
  if (!pricing?.model || pax < 1) return null;
  const base: PriceQuote = {
    total: 0, perPerson: 0, basis: "group",
    vehicles: 0, onRequest: false, floorApplied: false,
  };
  if (pricing.model === "on_request") return { ...base, onRequest: true };

  if (pricing.model === "per_vehicle") {
    const capacity = pricing.vehicle_capacity ?? 0;
    const tier = pricing.tiers?.[0];
    if (capacity < 1 || !tier) return null;
    const rate = rateOf(tier, key);
    if (rate === null) return null;

    const vehicles = Math.ceil(pax / capacity);
    let total = 0;
    let remaining = pax;
    for (let v = 0; v < vehicles; v++) {
      const seats = Math.min(remaining, capacity);
      remaining -= seats;
      const off = (pricing.discounts ?? [])
        .filter((d) => d.when_pax_in_vehicle === seats)
        .reduce((sum, d) => sum + d.amount, 0);
      total += Math.max(0, rate - off);
    }
    return { ...base, total, basis: "vehicle", vehicles, perPerson: round2(total / pax) };
  }

  const tiers = pricing.tiers ?? [];
  const tier = tiers.find((t) => pax >= t.min && (t.max === null || pax <= t.max));
  if (!tier) return null;
  let total = rawTotal(tier, pax, key);
  if (total === null) return null;

  // A bigger party never pays less than a smaller one.
  let floorApplied = false;
  for (const lower of tiers) {
    if (lower.max === null || lower.max >= pax) continue;
    const lowerTotal = rawTotal(lower, lower.max, key);
    if (lowerTotal !== null && lowerTotal > total) {
      total = lowerTotal;
      floorApplied = true;
    }
  }
  return { ...base, total, basis: tier.basis, perPerson: round2(total / pax), floorApplied };
}

/** Cheapest total any party can pay — the catalog list's "from" figure. */
export function fromPrice(pricing: Pricing | null | undefined): number | null {
  if (!pricing || pricing.model === "on_request") return null;
  let best: number | null = null;
  for (let pax = 1; pax <= 12; pax++) {
    const q = quotePrice(pricing, pax, "std");
    if (!q || q.onRequest) continue;
    if (best === null || q.total < best) best = q.total;
  }
  return best;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
