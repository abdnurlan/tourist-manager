import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { EVENT_META, eventMeta } from "@/lib/event-meta";
import type { EventType } from "@/lib/types";

/** Lucide icon mapping per event type — sourced from the central event-meta. */
export const EVENT_TYPE_ICON: Record<EventType, LucideIcon> = Object.fromEntries(
  (Object.keys(EVENT_META) as EventType[]).map((t) => [t, EVENT_META[t].icon]),
) as Record<EventType, LucideIcon>;

export interface EventTypeIconProps {
  type: EventType;
  className?: string;
  /** Render inside a tinted rounded square chip, colored per event type. */
  chip?: boolean;
  size?: number;
}

/** Event-type glyph. In `chip` mode it carries the type's own color identity. */
export function EventTypeIcon({ type, className, chip, size = 18 }: EventTypeIconProps) {
  const meta = eventMeta(type);
  const Icon = meta.icon;
  if (chip) {
    return (
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: meta.subtle, color: meta.color }}
      >
        <Icon size={size} className={className} />
      </span>
    );
  }
  return (
    <Icon
      size={size}
      className={cn(className)}
      style={{ color: meta.color }}
    />
  );
}
