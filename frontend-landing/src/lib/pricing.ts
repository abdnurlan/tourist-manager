/* ─────────────────────────────────────────────────────────────
   Pricing — mirrors backend/internal/pricing so the party-size
   stepper can answer instantly, without a round trip.

   The backend stays the authority: every stored booking total is
   recomputed there from the same matrix. Keep the two in step —
   the Go package carries the reference tests.
   ───────────────────────────────────────────────────────────── */

export type PriceBasis = "group" | "per_person" | "vehicle";
export type PriceModel = "group_tiers" | "flat_per_person" | "per_vehicle" | "on_request";

export type PriceTier = {
  min: number;
  max: number | null;
  basis: PriceBasis;
  /** Rate columns: "he" = Hebrew-speaking guide, "std" = English/Russian. */
  rates: Record<string, number>;
};

export type Pricing = {
  model: PriceModel;
  currency?: string;
  vehicle_capacity?: number;
  tiers?: PriceTier[];
  discounts?: { when_pax_in_vehicle: number; amount: number }[];
};

export type Quote = {
  total: number;
  perPerson: number;
  currency: string;
  basis: PriceBasis;
  pax: number;
  vehicles: number;
  onRequest: boolean;
  /** The party-size floor raised the total (never cheaper with more people). */
  floorApplied: boolean;
};

export const DEFAULT_CURRENCY = "USD";

/** Only Hebrew has its own rate column; every other language pays standard. */
export function rateKey(lang: string | undefined): "he" | "std" {
  return lang === "he" ? "he" : "std";
}

function tierRate(tier: PriceTier, key: string): number | null {
  const v = tier.rates?.[key];
  if (typeof v === "number") return v;
  const std = tier.rates?.std;
  return typeof std === "number" ? std : null;
}

function rawTotal(tier: PriceTier, pax: number, key: string): number | null {
  const rate = tierRate(tier, key);
  if (rate === null) return null;
  return tier.basis === "group" ? rate : rate * pax;
}

function contains(tier: PriceTier, pax: number): boolean {
  return pax >= tier.min && (tier.max === null || tier.max === undefined || pax <= tier.max);
}

/** Price a party of `pax` travellers with a guide speaking `guideLang`. */
export function quote(pricing: Pricing | null | undefined, pax: number, guideLang?: string): Quote | null {
  if (!pricing?.model) return null;
  const currency = pricing.currency || DEFAULT_CURRENCY;
  const key = rateKey(guideLang);
  const base: Quote = {
    total: 0, perPerson: 0, currency, basis: "group",
    pax, vehicles: 0, onRequest: false, floorApplied: false,
  };

  if (pricing.model === "on_request") return { ...base, onRequest: true };
  if (pax < 1) return null;

  if (pricing.model === "per_vehicle") {
    const capacity = pricing.vehicle_capacity ?? 0;
    const tier = pricing.tiers?.[0];
    if (capacity < 1 || !tier) return null;
    const rate = tierRate(tier, key);
    if (rate === null) return null;

    const vehicles = Math.ceil(pax / capacity);
    let total = 0;
    let remaining = pax;
    for (let v = 0; v < vehicles; v++) {
      const seats = Math.min(remaining, capacity);
      remaining -= seats;
      // A discount is per vehicle, decided by that vehicle's own headcount.
      const off = (pricing.discounts ?? [])
        .filter((d) => d.when_pax_in_vehicle === seats)
        .reduce((sum, d) => sum + d.amount, 0);
      total += Math.max(0, rate - off);
    }
    return { ...base, total, basis: "vehicle", vehicles, perPerson: round2(total / pax) };
  }

  const tiers = pricing.tiers ?? [];
  const tier = tiers.find((t) => contains(t, pax));
  if (!tier) return null;
  let total = rawTotal(tier, pax, key);
  if (total === null) return null;

  // Party-size floor: a bigger group never pays less than a smaller one.
  // Checking each lower tier at its own largest size is enough, since within a
  // tier the total only grows. This reproduces the published minimums instead
  // of storing them.
  let floorApplied = false;
  for (const lower of tiers) {
    if (lower.max === null || lower.max === undefined || lower.max >= pax) continue;
    const lowerTotal = rawTotal(lower, lower.max, key);
    if (lowerTotal !== null && lowerTotal > total) {
      total = lowerTotal;
      floorApplied = true;
    }
  }

  return { ...base, total, basis: tier.basis, perPerson: round2(total / pax), floorApplied };
}

/** Cheapest total any party can pay — the "starting from" figure. */
export function fromPrice(pricing: Pricing | null | undefined): number | null {
  if (!pricing || pricing.model === "on_request") return null;
  let best: number | null = null;
  for (let pax = 1; pax <= 12; pax++) {
    const q = quote(pricing, pax, "std");
    if (!q || q.onRequest) continue;
    if (best === null || q.total < best) best = q.total;
  }
  return best;
}

/** Every bracket of a tour, for the price table on the detail page. */
export function tierRows(pricing: Pricing | null | undefined, guideLang?: string) {
  const key = rateKey(guideLang);
  return (pricing?.tiers ?? []).map((t) => ({
    min: t.min,
    max: t.max ?? null,
    basis: t.basis,
    rate: tierRate(t, key),
  }));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
