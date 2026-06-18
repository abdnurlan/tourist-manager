"use client";

import { CloudSun } from "lucide-react";
import { Card } from "@/components/ui/card";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";
import type { Weather } from "@/lib/types";

export interface WeatherCardProps {
  weather: Weather;
  className?: string;
}

/**
 * Weather placeholder card (CONTRACT §6.2 — `weather.available` is always
 * false for MVP). Shows the note copy when unavailable.
 */
export function WeatherCard({ weather, className }: WeatherCardProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning/12 text-warning ring-1 ring-warning/15">
          <CloudSun className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            {az.dashboard.weather}
          </p>
          {weather.available ? (
            <p className="mt-1 font-display text-body font-semibold text-foreground">
              {weather.temp_c !== null && (
                <span className="tabular-nums">{weather.temp_c}°C</span>
              )}
              {weather.condition ? ` · ${weather.condition}` : ""}
            </p>
          ) : (
            <p className="mt-1 font-display text-body font-semibold text-foreground">
              {weather.location || az.dashboard.weather_location}
            </p>
          )}
        </div>
      </div>
      <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
        {weather.available ? weather.note : az.dashboard.weather_soon}
      </p>
    </Card>
  );
}
