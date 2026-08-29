"use client";

import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { az } from "@/lib/i18n/az";
import { quotePrice } from "@/lib/utils/pricing";
import type { Pricing, PriceBasis, PriceModel, PriceTier } from "@/lib/types";

const MODELS: PriceModel[] = ["group_tiers", "flat_per_person", "per_vehicle", "on_request"];
const MODEL_LABEL: Record<PriceModel, string> = {
  group_tiers: az.catalog.pricing.model_group_tiers,
  flat_per_person: az.catalog.pricing.model_flat_per_person,
  per_vehicle: az.catalog.pricing.model_per_vehicle,
  on_request: az.catalog.pricing.model_on_request,
};
const BASIS_LABEL: Record<PriceBasis, string> = {
  group: az.catalog.pricing.basis_group,
  per_person: az.catalog.pricing.basis_per_person,
  vehicle: az.catalog.pricing.basis_vehicle,
};

/** The 2026 sheet's shape for a group tour — the usual starting point. */
export function defaultGroupTiers(): PriceTier[] {
  return [
    { min: 1, max: 3, basis: "group", rates: { he: 0, std: 0 } },
    { min: 4, max: 4, basis: "group", rates: { he: 0, std: 0 } },
    { min: 5, max: 7, basis: "group", rates: { he: 0, std: 0 } },
    { min: 8, max: 10, basis: "per_person", rates: { he: 0, std: 0 } },
    { min: 11, max: null, basis: "per_person", rates: { he: 0, std: 0 } },
  ];
}

export function defaultPricing(model: PriceModel): Pricing {
  switch (model) {
    case "group_tiers":
      return { model, currency: "USD", tiers: defaultGroupTiers() };
    case "flat_per_person":
      return { model, currency: "USD", tiers: [{ min: 1, max: null, basis: "per_person", rates: { he: 0, std: 0 } }] };
    case "per_vehicle":
      return {
        model, currency: "USD", vehicle_capacity: 4,
        tiers: [{ min: 1, max: null, basis: "vehicle", rates: { std: 0 } }],
        discounts: [{ when_pax_in_vehicle: 2, amount: 20 }],
      };
    case "on_request":
      return { model, currency: "USD" };
  }
}

interface Props {
  value: Pricing;
  onChange: (p: Pricing) => void;
  /** Party size used for the live preview row. */
  previewPax: number;
  onPreviewPaxChange: (pax: number) => void;
}

/**
 * Matrix editor for a catalog tour's price sheet. The live preview underneath
 * runs the same calculation the landing site and the backend run, so a mistyped
 * bracket is visible before saving.
 */
export function PricingEditor({ value, onChange, previewPax, onPreviewPaxChange }: Props) {
  const p = az.catalog.pricing;
  const tiers = value.tiers ?? [];
  const perVehicle = value.model === "per_vehicle";
  const showHebrewColumn = value.model !== "per_vehicle";

  const preview = useMemo(
    () => ({
      he: quotePrice(value, previewPax, "he"),
      std: quotePrice(value, previewPax, "std"),
    }),
    [value, previewPax],
  );

  function setTier(i: number, patch: Partial<PriceTier>) {
    const next = tiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t));
    onChange({ ...value, tiers: next });
  }

  function setRate(i: number, key: "he" | "std", raw: string) {
    const n = raw === "" ? 0 : Number(raw);
    if (Number.isNaN(n)) return;
    const tier = tiers[i];
    setTier(i, { rates: { ...tier.rates, [key]: n } });
  }

  function addTier() {
    const last = tiers[tiers.length - 1];
    const min = last ? (last.max ?? last.min) + 1 : 1;
    onChange({
      ...value,
      tiers: [...tiers, { min, max: null, basis: last?.basis ?? "per_person", rates: { he: 0, std: 0 } }],
    });
  }

  function removeTier(i: number) {
    onChange({ ...value, tiers: tiers.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <div className="space-y-1.5">
        <Label>{p.model}</Label>
        <Select
          value={value.model}
          onValueChange={(m) => onChange(defaultPricing(m as PriceModel))}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {MODELS.map((m) => (
              <SelectItem key={m} value={m}>{MODEL_LABEL[m]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value.model !== "on_request" && (
        <>
          {perVehicle && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{p.capacity}</Label>
                <Input
                  inputMode="numeric"
                  value={String(value.vehicle_capacity ?? 4)}
                  onChange={(e) => onChange({ ...value, vehicle_capacity: Number(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{p.discount.replace("{n}", String(value.discounts?.[0]?.when_pax_in_vehicle ?? 2))}</Label>
                <Input
                  inputMode="numeric"
                  value={String(value.discounts?.[0]?.amount ?? 0)}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      discounts: [{ when_pax_in_vehicle: value.discounts?.[0]?.when_pax_in_vehicle ?? 2, amount: Number(e.target.value) || 0 }],
                    })
                  }
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_1.4fr_1fr_1fr_auto] items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>{p.min}</span>
              <span>{p.max}</span>
              <span>{p.basis}</span>
              <span>{showHebrewColumn ? p.he : "$"}</span>
              <span>{showHebrewColumn ? p.std : ""}</span>
              <span className="sr-only">{p.remove_tier}</span>
            </div>

            {tiers.map((t, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1.4fr_1fr_1fr_auto] items-center gap-2">
                <Input
                  inputMode="numeric"
                  aria-label={p.min}
                  value={String(t.min)}
                  onChange={(e) => setTier(i, { min: Number(e.target.value) || 1 })}
                />
                <Input
                  inputMode="numeric"
                  aria-label={p.max}
                  placeholder={p.max_open}
                  value={t.max === null ? "" : String(t.max)}
                  onChange={(e) => setTier(i, { max: e.target.value === "" ? null : Number(e.target.value) })}
                />
                <Select value={t.basis} onValueChange={(b) => setTier(i, { basis: b as PriceBasis })}>
                  <SelectTrigger aria-label={p.basis}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(BASIS_LABEL) as PriceBasis[]).map((b) => (
                      <SelectItem key={b} value={b}>{BASIS_LABEL[b]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showHebrewColumn ? (
                  <>
                    <Input
                      inputMode="numeric"
                      aria-label={p.he}
                      value={String(t.rates.he ?? 0)}
                      onChange={(e) => setRate(i, "he", e.target.value)}
                    />
                    <Input
                      inputMode="numeric"
                      aria-label={p.std}
                      value={String(t.rates.std ?? 0)}
                      onChange={(e) => setRate(i, "std", e.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <Input
                      inputMode="numeric"
                      aria-label="$"
                      value={String(t.rates.std ?? 0)}
                      onChange={(e) => setRate(i, "std", e.target.value)}
                    />
                    <span />
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={p.remove_tier}
                  onClick={() => removeTier(i)}
                  disabled={tiers.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addTier}>
              <Plus className="h-4 w-4" /> {p.add_tier}
            </Button>
          </div>

          {/* Live preview — the same engine the site and the backend use. */}
          <div className="rounded-lg bg-secondary/60 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium text-foreground">{p.preview}</div>
                <p className="text-xs text-muted-foreground">{p.preview_hint}</p>
              </div>
              <Input
                inputMode="numeric"
                aria-label={p.preview}
                className="w-20"
                value={String(previewPax)}
                onChange={(e) => onPreviewPaxChange(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
            <div className="mt-2 flex gap-6 text-sm">
              {showHebrewColumn && (
                <span>
                  <span className="text-muted-foreground">{p.he}: </span>
                  <span className="font-semibold tabular-nums">{preview.he ? `${preview.he.total} $` : "—"}</span>
                </span>
              )}
              <span>
                <span className="text-muted-foreground">{showHebrewColumn ? p.std : "$"}: </span>
                <span className="font-semibold tabular-nums">{preview.std ? `${preview.std.total} $` : "—"}</span>
              </span>
              {preview.std?.vehicles ? (
                <span className="text-muted-foreground">{preview.std.vehicles} × {az.catalog.pricing.basis_vehicle}</span>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
