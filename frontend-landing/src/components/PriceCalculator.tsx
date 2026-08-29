import { Minus, Plus, Info } from "lucide-react";
import { quote, tierRows, type Pricing } from "@/lib/pricing";
import { T, type Lang } from "@/lib/tours-data";
import type { GuideLang } from "@/hooks/use-guide-lang";

type Copy = (typeof T)[Lang];

/** Party-size range offered by the stepper. */
const MIN_PAX = 1;
const MAX_PAX = 30;

interface PaxStepperProps {
  pax: number;
  onChange: (pax: number) => void;
  label: string;
  personLabel: string;
}

/** −/+ control for the number of travellers. */
export function PaxStepper({ pax, onChange, label, personLabel }: PaxStepperProps) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          aria-label={`-1 ${personLabel}`}
          disabled={pax <= MIN_PAX}
          onClick={() => onChange(Math.max(MIN_PAX, pax - 1))}
          className="touch-target flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <output className="min-w-14 text-center font-display text-2xl font-bold tabular-nums">{pax}</output>
        <button
          type="button"
          aria-label={`+1 ${personLabel}`}
          disabled={pax >= MAX_PAX}
          onClick={() => onChange(Math.min(MAX_PAX, pax + 1))}
          className="touch-target flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="text-sm text-muted-foreground">{personLabel}</span>
      </div>
    </div>
  );
}

interface PriceBoxProps {
  pricing: Pricing | null | undefined;
  pax: number;
  /** Rate column — the booked guide, NOT the interface language. */
  guide: GuideLang;
  t: Copy;
  /** Compact mode drops the explanatory notes (used inside the booking dialog). */
  compact?: boolean;
}

/**
 * The computed price for the current party. What the figure *means* changes
 * with the bracket — a group total for small parties, a per-person rate for
 * large ones, a per-jeep rate for off-road tours — so the basis is always
 * spelled out under it.
 */
export function PriceBox({ pricing, pax, guide, t, compact }: PriceBoxProps) {
  const q = quote(pricing, pax, guide);

  if (!q) return null;
  if (q.onRequest) {
    return (
      <div>
        <div className="font-display text-2xl font-bold text-brand-orange">{t.pricing.onRequest}</div>
        <p className="mt-1 text-sm text-muted-foreground">{t.pricing.contactUs}</p>
      </div>
    );
  }

  const basisLabel =
    q.basis === "group" ? t.pricing.groupTotal
    : q.basis === "vehicle"
      // Only worth spelling out the fleet once it is more than one jeep.
      ? q.vehicles > 1 ? `${t.pricing.perVehicle} · ${q.vehicles} ${t.pricing.vehicles}` : t.pricing.perVehicle
    : t.pricing.perPersonBasis;

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t.pricing.total}</div>
      <div className="mt-0.5 font-display text-4xl font-bold tabular-nums text-brand-orange">{q.total} $</div>
      <div className="mt-1 text-sm text-muted-foreground">
        {basisLabel}
        {pax > 1 && <> · <span className="tabular-nums">{q.perPerson} $</span> {t.pricing.perPerson}</>}
      </div>
      {!compact && (
        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          {q.floorApplied && <p>{t.pricing.floorNote}</p>}
          {q.basis === "vehicle" && <p>{t.pricing.vehicleNote}</p>}
          <p className="flex items-start gap-1.5">
            <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{guide === "he" ? t.pricing.guideHe : t.pricing.guideStd} — {t.pricing.guideNote}</span>
          </p>
        </div>
      )}
    </div>
  );
}

/** Formats a bracket as "1–3", "8–10" or "11+". */
function bracketLabel(min: number, max: number | null): string {
  if (max === null) return `${min}+`;
  if (max === min) return String(min);
  return `${min}–${max}`;
}

interface PriceTiersProps {
  pricing: Pricing | null | undefined;
  guide: GuideLang;
  t: Copy;
}

/** The tour's full bracket table for the guide language currently selected. */
export function PriceTiers({ pricing, guide, t }: PriceTiersProps) {
  const rows = tierRows(pricing, guide);
  if (rows.length === 0 || pricing?.model === "on_request") return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r) => (
            <tr key={`${r.min}-${r.max ?? "up"}`} className="border-b border-border last:border-0">
              <th scope="row" className="py-2 text-start font-medium text-foreground">
                {r.basis === "vehicle"
                  ? t.pricing.perVehicle
                  : `${bracketLabel(r.min, r.max)} ${t.pricing.person}`}
              </th>
              <td className="py-2 text-end tabular-nums font-semibold text-foreground">
                {r.rate} $
                <span className="ms-1.5 font-normal text-muted-foreground">
                  {r.basis === "group" ? t.pricing.tableGroup
                    : r.basis === "vehicle" ? ""
                    : t.pricing.tablePerPerson}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
