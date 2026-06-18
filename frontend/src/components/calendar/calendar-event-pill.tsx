"use client";

import { motion } from "framer-motion";
import { EVENT_TYPE_ICON } from "@/components/shared/event-type-icon";
import { typeStyle } from "./event-type-style";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/date";
import { eventTypeLabel } from "@/lib/i18n/az";
import type { EventWithTour } from "@/lib/types";

export interface CalendarEventPillProps {
  event: EventWithTour;
  onClick: (event: EventWithTour) => void;
  /** Compact = inside a month cell; full = week/day column block. */
  variant?: "compact" | "full";
  className?: string;
}

/** Clickable, type-colored event pill used inside calendar cells.
 *  Color identity (spine/dot/chip) comes from lib/event-meta via typeStyle. */
export function CalendarEventPill({
  event,
  onClick,
  variant = "compact",
  className,
}: CalendarEventPillProps) {
  const style = typeStyle(event.type);
  const Icon = EVENT_TYPE_ICON[event.type];
  const time = formatTime(event.time);
  const cancelled = event.status === "cancelled";

  if (variant === "compact") {
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={(e) => {
          e.stopPropagation();
          onClick(event);
        }}
        title={`${event.title}${time ? ` · ${time}` : ""}`}
        style={{
          backgroundColor: style.subtle,
          color: style.color,
          boxShadow: `inset 2px 0 0 0 ${style.color}`,
        }}
        className={cn(
          "flex w-full items-center gap-1 rounded-md py-0.5 pl-2 pr-1.5 text-left text-[11px] font-medium leading-tight transition-[filter,transform]",
          cancelled && "line-through opacity-60",
          "hover:brightness-[0.97]",
          className,
        )}
      >
        {time ? (
          <span className="shrink-0 font-display tabular-nums opacity-90">
            {time}
          </span>
        ) : (
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={style.dotStyle}
            aria-hidden
          />
        )}
        <span className="truncate">{event.title}</span>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(event)}
      style={{
        backgroundColor: style.subtle,
        color: style.color,
        boxShadow: `inset 3px 0 0 0 ${style.color}`,
      }}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition-[filter] hover:brightness-[0.98]",
        cancelled && "opacity-60",
        className,
      )}
    >
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface/70">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-sm font-semibold leading-tight",
            cancelled && "line-through",
          )}
        >
          {event.title}
        </span>
        <span className="mt-0.5 block truncate text-xs opacity-80">
          {time ? (
            <span className="font-display tabular-nums">{time}</span>
          ) : null}
          {time ? " · " : ""}
          {eventTypeLabel(event.type)}
        </span>
      </span>
    </motion.button>
  );
}
