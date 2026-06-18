"use client";

import { useState } from "react";
import {
  Clock,
  MapPin,
  Users,
  Phone,
  StickyNote,
  Map as MapIcon,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trash2,
  ExternalLink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { EventTypeIcon } from "@/components/shared/event-type-icon";
import { StatusBadge } from "@/components/shared/status-badge";
import { PaymentBadge } from "@/components/shared/payment-badge";
import { SourceBadge } from "@/components/shared/source-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/sonner";
import {
  useDeleteCalendarEvent,
  useUpdateCalendarEventStatus,
} from "@/lib/hooks/use-calendar-events";
import { useIsDesktop } from "@/lib/hooks/use-media-query";
import { formatTime, formatLongDate } from "@/lib/utils/date";
import { formatPrice } from "@/lib/utils/format";
import { az, eventTypeLabel } from "@/lib/i18n/az";
import type { EventWithTour } from "@/lib/types";

export interface EventDetailProps {
  event: EventWithTour | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

/** Shared inner body for both Dialog (desktop) and Sheet (mobile). */
function EventDetailBody({
  event,
  onClose,
}: {
  event: EventWithTour;
  onClose: () => void;
}) {
  const router = useRouter();
  const deleteMutation = useDeleteCalendarEvent();
  const statusMutation = useUpdateCalendarEventStatus();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const time = formatTime(event.time);
  const price = formatPrice(event.price, event.currency);

  const handleStatus = (status: EventWithTour["status"]) => {
    if (status === event.status) return;
    statusMutation.mutate(
      { id: event.id, status },
      { onSuccess: () => toast.success(az.toast.event_updated) },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(event.id, {
      onSuccess: () => {
        toast.success(az.toast.event_deleted);
        setConfirmOpen(false);
        onClose();
      },
      onError: () => toast.error(az.toast.error),
    });
  };

  return (
    <div className="space-y-5">
      {/* meta rows */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <DetailRow
          icon={Clock}
          label={az.field.date}
          value={`${formatLongDate(event.date)}${time ? `, ${time}` : ""}`}
        />
        <DetailRow
          icon={MapIcon}
          label={az.screen.tour_detail}
          value={event.tour_title}
        />
        {event.location && (
          <DetailRow icon={MapPin} label={az.field.location} value={event.location} />
        )}
        {event.participants && (
          <DetailRow
            icon={Users}
            label={az.field.participants}
            value={event.participants}
          />
        )}
        {event.phone && (
          <DetailRow icon={Phone} label={az.field.phone} value={event.phone} />
        )}
        {price && (
          <DetailRow icon={StickyNote} label={az.field.price} value={price} />
        )}
      </div>

      {/* badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge eventStatus={event.status} />
        <PaymentBadge status={event.payment_status} />
        <SourceBadge source={event.source} />
      </div>

      {event.notes && (
        <div className="rounded-xl bg-surface-muted/60 p-3.5">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {az.field.notes}
          </p>
          <p className="whitespace-pre-wrap text-sm text-foreground">{event.notes}</p>
        </div>
      )}

      {/* status quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={event.status === "done" ? "primary" : "secondary"}
          size="sm"
          className="rounded-xl"
          loading={statusMutation.isPending}
          onClick={() => handleStatus("done")}
        >
          <CheckCircle2 className="size-4" />
          {az.eventStatus.done}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-xl"
          onClick={() => handleStatus("planned")}
        >
          <RotateCcw className="size-4" />
          {az.eventStatus.planned}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-xl"
          onClick={() => handleStatus("cancelled")}
        >
          <XCircle className="size-4" />
          {az.eventStatus.cancelled}
        </Button>
      </div>

      {/* footer actions */}
      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Button
          variant="secondary"
          className="flex-1 rounded-xl"
          onClick={() => router.push(`/tours/${event.tour_id}`)}
        >
          <ExternalLink className="size-4" />
          {az.screen.tour_detail}
        </Button>
        <Button
          variant="destructive-ghost"
          size="icon"
          aria-label={az.action.delete}
          className="rounded-xl"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={az.action.delete}
        description={az.toast.delete_confirm}
        confirmLabel={az.action.delete}
        cancelLabel={az.action.cancel}
        destructive
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

/** Responsive event detail: Dialog on desktop, bottom Sheet on mobile. */
export function EventDetail({ event, open, onOpenChange }: EventDetailProps) {
  const isDesktop = useIsDesktop();
  if (!event) return null;

  const header = (
    <div className="flex items-start gap-3">
      <EventTypeIcon type={event.type} chip />
      <div className="min-w-0">
        <span className="text-h3 font-semibold leading-tight tracking-tight">
          {event.title}
        </span>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {eventTypeLabel(event.type)}
        </p>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="sr-only">{event.title}</DialogTitle>
            <DialogDescription className="sr-only">
              {eventTypeLabel(event.type)}
            </DialogDescription>
            {header}
          </DialogHeader>
          <EventDetailBody event={event} onClose={() => onOpenChange(false)} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle className="sr-only">{event.title}</SheetTitle>
          <SheetDescription className="sr-only">
            {eventTypeLabel(event.type)}
          </SheetDescription>
          {header}
        </SheetHeader>
        <EventDetailBody event={event} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  );
}
