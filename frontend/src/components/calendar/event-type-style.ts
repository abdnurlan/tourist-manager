/* ─────────────────────────────────────────────────────────────
   Per-event-type color accents for calendar pills / dots / spines.

   Sourced from the centralized event-meta (lib/event-meta.ts) so the
   calendar, EventCard, EventTypeIcon and timelines all share ONE color
   identity per type. Because the palette uses arbitrary hex (not Tailwind
   tokens), consumers apply these via inline `style` — exactly the pattern
   the foundation EventCard/EventTypeIcon already use.
   ───────────────────────────────────────────────────────────── */

import type { CSSProperties } from "react";
import { eventMeta } from "@/lib/event-meta";
import type { EventType } from "@/lib/types";

export interface TypeStyle {
  /** Ink/spine/dot color for the type (hex). */
  color: string;
  /** Tinted chip/background color for the type (hex). */
  subtle: string;
  /** Inline style for a solid type-colored dot. */
  dotStyle: CSSProperties;
  /** Inline style for a subtle tinted pill (tinted bg + ink text). */
  pillStyle: CSSProperties;
  /** Inline style for a left color spine. */
  spineStyle: CSSProperties;
}

export function typeStyle(type: EventType): TypeStyle {
  const meta = eventMeta(type);
  return {
    color: meta.color,
    subtle: meta.subtle,
    dotStyle: { backgroundColor: meta.color },
    pillStyle: { backgroundColor: meta.subtle, color: meta.color },
    spineStyle: { backgroundColor: meta.color },
  };
}
