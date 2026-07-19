import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { FlagIcon } from "@/components/FlagIcon";
import { LANGS, type Lang } from "@/lib/tours-data";

interface LanguageSwitcherProps {
  lang: Lang;
  onChange: (lang: Lang) => void;
  /** Text direction for menu alignment. */
  dir?: "ltr" | "rtl";
}

/** Flag-based language dropdown used in the nav (home + tour detail). */
export function LanguageSwitcher({ lang, onChange, dir = "ltr" }: LanguageSwitcherProps) {
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <DropdownMenu dir={dir}>
      <DropdownMenuTrigger
        className="glass group flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm text-foreground/80 transition-all duration-300 hover:-translate-y-0.5 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={current.native}
        title={current.native}
      >
        <FlagIcon lang={current.code} />
        <span className="font-medium">{current.label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-foreground/50 transition-transform duration-300 group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={dir === "rtl" ? "start" : "end"}
        sideOffset={8}
        className="min-w-48 rounded-2xl border-border bg-popover/95 p-1.5 shadow-(--shadow-card) backdrop-blur-xl"
      >
        {LANGS.map((l) => {
          const active = l.code === lang;
          return (
            <DropdownMenuItem
              key={l.code}
              onSelect={() => onChange(l.code)}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-accent/10 text-accent focus:bg-accent/15 focus:text-accent"
                  : "text-foreground/80"
              }`}
            >
              <FlagIcon lang={l.code} />
              <span className="flex-1 font-medium">{l.native}</span>
              {active && <Check className="h-4 w-4" aria-hidden="true" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
