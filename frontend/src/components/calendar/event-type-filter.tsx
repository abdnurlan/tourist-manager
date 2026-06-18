"use client";

import { Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EVENT_TYPE_ICON } from "@/components/shared/event-type-icon";
import { az, eventTypeLabel } from "@/lib/i18n/az";
import type { EventType } from "@/lib/types";

const TYPES: EventType[] = [
  "transfer",
  "hotel",
  "restaurant",
  "tour",
  "flight",
  "note",
  "other",
];

export interface EventTypeFilterProps {
  value: EventType | "all";
  onChange: (value: EventType | "all") => void;
}

/** Event-type filter (CONTRACT §6.5 `type=`). "Hamısı" clears the filter. */
export function EventTypeFilter({ value, onChange }: EventTypeFilterProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={value}
        onValueChange={(v) => onChange(v as EventType | "all")}
      >
        <SelectTrigger
          className="h-9 w-[150px] gap-2 rounded-xl"
          aria-label={az.field.type}
        >
          <Filter className="size-4 shrink-0 text-muted-foreground" />
          <SelectValue placeholder={az.action.filter} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{az.common.all}</SelectItem>
          {TYPES.map((type) => {
            const Icon = EVENT_TYPE_ICON[type];
            return (
              <SelectItem key={type} value={type}>
                <span className="flex items-center gap-2">
                  <Icon className="size-3.5 text-accent" />
                  {eventTypeLabel(type)}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {value !== "all" && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={az.action.clear}
          onClick={() => onChange("all")}
          className="rounded-xl"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
