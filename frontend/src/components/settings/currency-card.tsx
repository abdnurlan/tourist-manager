"use client";

import { useCallback, useEffect, useState } from "react";
import { Coins } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsCard } from "./settings-card";
import { toast } from "@/components/ui/sonner";
import { az } from "@/lib/i18n/az";

const CURRENCY_KEY = "tp_default_currency";
const DEFAULT_CURRENCY = "AZN";

/** Selectable default currencies (local-only preference). */
const CURRENCIES: { value: string; symbol: string; label: string }[] = [
  { value: "AZN", symbol: "₼", label: "Azərbaycan manatı" },
  { value: "USD", symbol: "$", label: "ABŞ dolları" },
  { value: "EUR", symbol: "€", label: "Avro" },
  { value: "TRY", symbol: "₺", label: "Türk lirəsi" },
  { value: "GBP", symbol: "£", label: "Funt sterlinq" },
  { value: "RUB", symbol: "₽", label: "Rus rublu" },
];

export function getDefaultCurrency(): string {
  if (typeof window === "undefined") return DEFAULT_CURRENCY;
  return window.localStorage.getItem(CURRENCY_KEY) ?? DEFAULT_CURRENCY;
}

/** Defolt valyuta seçimi — yalnız bu cihazda saxlanılır (local-only). */
export function CurrencyCard() {
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);

  useEffect(() => {
    setCurrency(getDefaultCurrency());
  }, []);

  const handleChange = useCallback((value: string) => {
    setCurrency(value);
    window.localStorage.setItem(CURRENCY_KEY, value);
    toast.success(az.toast.saved);
  }, []);

  return (
    <SettingsCard
      icon={Coins}
      title={az.settings.currency}
      description={az.settings.currency_hint}
    >
      <Select value={currency} onValueChange={handleChange}>
        <SelectTrigger className="w-full" aria-label={az.settings.currency}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              <span className="inline-flex items-center gap-2">
                <span className="tabular-nums text-muted-foreground">
                  {c.symbol}
                </span>
                <span>
                  {c.label} ({c.value})
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingsCard>
  );
}
