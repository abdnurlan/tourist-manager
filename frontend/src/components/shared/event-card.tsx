"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, Users, Phone, Pencil, Trash2, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { EventTypeIcon } from "./event-type-icon";
import { StatusBadge } from "./status-badge";
import { PaymentBadge } from "./payment-badge";
import { SourceBadge } from "./source-badge";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/date";
import { formatPrice } from "@/lib/utils/format";
import { eventTypeLabel, az } from "@/lib/i18n/az";
import { eventMeta } from "@/lib/event-meta";
import type { Event } from "@/lib/types";

export interface EventCardProps {
  event: Event;
  /** Parent tour title (calendar / search contexts). */
  tourTitle?: string;
  onClick?: (event: Event) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  showSource?: boolean;
  showPayment?: boolean;
  className?: string;
}

/** Boarding-pass style event row: a left color spine keyed to the event type,
 *  type chip, title, Fraunces time, location/participants, status + payment +
 *  source stamps, quick edit/delete. Props unchanged. */
export function EventCard({
  event,
  tourTitle,
  onClick,
  onEdit,
  onDelete,
  showSource = true,
  showPayment = true,
  className,
}: EventCardProps) {
  const time = formatTime(event.time);
  const price = formatPrice(event.price, event.currency);
  const hasMenu = Boolean(onEdit || onDelete);
  const meta = eventMeta(event.type);

  return (
    <motion.div whileTap={{ scale: 0.985 }}>
      <Card
        interactive={Boolean(onClick)}
        onClick={onClick ? () => onClick(event) : undefined}
        className={cn(
          "group relative flex items-start gap-3.5 overflow-hidden p-4 pl-5",
          onClick && "cursor-pointer",
          className,
        )}
      >
        {/* left color spine, keyed to event type */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ backgroundColor: meta.color }}
        />

        <EventTypeIcon type={event.type} chip />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-body font-semibold leading-tight text-foreground">
                {event.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {eventTypeLabel(event.type)}
                {tourTitle ? ` · ${tourTitle}` : ""}
              </p>
            </div>

            {hasMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-surface-muted focus-visible:opacity-100 group-hover:opacity-100 max-md:opacity-100"
                  aria-label={az.action.edit}
                >
                  <MoreVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  {onEdit && (
                    <DropdownMenuItem onSelect={() => onEdit(event)}>
                      <Pencil />
                      {az.action.edit}
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem destructive onSelect={() => onDelete(event)}>
                      <Trash2 />
                      {az.action.delete}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-sm text-muted-foreground">
            {time && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                <span className="font-display font-medium tabular-nums text-foreground">
                  {time}
                </span>
              </span>
            )}
            {event.location && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
            {event.participants && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Users className="size-3.5 shrink-0" />
                <span className="truncate">{event.participants}</span>
              </span>
            )}
            {event.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5" />
                {event.phone}
              </span>
            )}
          </div>

          {/* badges row */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <StatusBadge eventStatus={event.status} />
            {showPayment && <PaymentBadge status={event.payment_status} />}
            {price && (
              <span className="font-display text-sm font-semibold tabular-nums text-foreground">
                {price}
              </span>
            )}
            {showSource && event.source !== "manual" && (
              <SourceBadge source={event.source} className="ml-auto" />
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
