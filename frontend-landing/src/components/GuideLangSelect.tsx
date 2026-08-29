import { Check, Languages } from "lucide-react";
import type { GuideLang } from "@/hooks/use-guide-lang";
import { T, type Lang } from "@/lib/tours-data";

interface Props {
  value: GuideLang;
  onChange: (g: GuideLang) => void;
  lang: Lang;
  /** Compact drops the explanatory line (tight spaces like the filter bar). */
  compact?: boolean;
}

/**
 * Guide-language picker. It is part of the package, not a site setting — the
 * rate a traveller pays follows this choice and nothing else.
 */
export function GuideLangSelect({ value, onChange, lang, compact }: Props) {
  const t = T[lang];
  const options: { key: GuideLang; label: string }[] = [
    { key: "std", label: t.pricing.guideStd },
    { key: "he", label: t.pricing.guideHe },
  ];

  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <Languages aria-hidden="true" className="h-3.5 w-3.5" />
        {t.pricing.guideLabel}
      </div>
      <div role="radiogroup" aria-label={t.pricing.guideLabel} className="mt-2 grid gap-2">
        {options.map((o) => {
          const active = o.key === value;
          return (
            <button
              key={o.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.key)}
              className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-start text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? "border-brand-orange bg-brand-orange/10 font-semibold text-foreground"
                  : "border-border text-muted-foreground hover:border-brand-orange/60 hover:text-foreground"
              }`}
            >
              <span>{o.label}</span>
              {active && <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-brand-orange" />}
            </button>
          );
        })}
      </div>
      {!compact && <p className="mt-2 text-xs text-muted-foreground">{t.pricing.guideHint}</p>}
    </div>
  );
}
