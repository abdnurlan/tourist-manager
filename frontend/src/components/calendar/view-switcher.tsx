"use client";

import { CalendarRange, CalendarDays, Calendar, List } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { az } from "@/lib/i18n/az";
import type { CalendarView } from "./calendar-utils";

const VIEWS: { value: CalendarView; label: string; icon: LucideIcon }[] = [
  { value: "month", label: az.calendar.month, icon: Calendar },
  { value: "week", label: az.calendar.week, icon: CalendarRange },
  { value: "day", label: az.calendar.day, icon: CalendarDays },
  { value: "agenda", label: az.calendar.agenda, icon: List },
];

export interface ViewSwitcherProps {
  value: CalendarView;
  onChange: (view: CalendarView) => void;
}

/** Tabs-based calendar view switcher (Ay / Həftə / Gün / Cədvəl). */
export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as CalendarView)}>
      <TabsList className="h-9">
        {VIEWS.map((view) => {
          const Icon = view.icon;
          return (
            <TabsTrigger key={view.value} value={view.value} className="gap-1.5">
              <Icon className="size-4" />
              <span className="max-sm:sr-only">{view.label}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
