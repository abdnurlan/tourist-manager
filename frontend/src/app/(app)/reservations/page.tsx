"use client";

import { useState } from "react";
import { Ticket, Phone, Mail, Users, CalendarDays, Trash2 } from "lucide-react";

import { PageHeader, PageBody } from "@/components/layout/page-header";
import { PageTransition, StaggerList, StaggerItem } from "@/components/shared/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useBookings, useUpdateBookingStatus, useDeleteBooking } from "@/lib/hooks/use-bookings";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";
import { formatLongDate } from "@/lib/utils/date";
import type { Booking, BookingStatus } from "@/lib/types";

type StatusFilter = "all" | BookingStatus;
const STATUS_CHIPS: StatusFilter[] = ["all", "new", "confirmed", "completed", "cancelled"];
const STATUS_OPTIONS: BookingStatus[] = ["new", "confirmed", "completed", "cancelled"];

const STATUS_STYLE: Record<BookingStatus, string> = {
  new: "bg-info/15 text-info ring-info/30",
  confirmed: "bg-success/15 text-success ring-success/30",
  completed: "bg-accent-subtle text-accent ring-accent/30",
  cancelled: "bg-danger/15 text-danger ring-danger/30",
};

function chipLabel(s: StatusFilter): string {
  return s === "all" ? az.reservation.all : az.reservation.status[s];
}

// Bron tarixləri "15 Oktyabr 2026" formatında (lokal-müstəqil, az.calendar-dan).
const fmtDate = formatLongDate;

export default function ReservationsPage() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [deleting, setDeleting] = useState<Booking | null>(null);

  const { data: bookings, isLoading, isError, refetch } = useBookings(
    status === "all" ? undefined : status,
  );
  const updateStatus = useUpdateBookingStatus();
  const removeBooking = useDeleteBooking();

  function confirmDelete() {
    if (!deleting) return;
    removeBooking.mutate(deleting.id);
    setDeleting(null);
  }

  return (
    <PageTransition>
      <PageHeader title={az.reservation.title} />

      <PageBody className="space-y-5">
        {/* Status filter chips */}
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {STATUS_CHIPS.map((s) => {
            const active = status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={cn(
                  "stamp shrink-0 rounded-full px-3.5 py-1.5 text-xs ring-1 ring-inset transition-colors duration-fast",
                  active
                    ? "bg-accent text-accent-foreground shadow-xs ring-accent"
                    : "bg-surface text-muted-foreground ring-border hover:text-foreground hover:ring-accent/30",
                )}
              >
                {chipLabel(s)}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={Ticket}
            title={az.common.error_title}
            subtitle={az.common.error_subtitle}
            action={
              <Button variant="secondary" onClick={() => refetch()}>
                {az.action.retry}
              </Button>
            }
          />
        ) : !bookings || bookings.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title={az.reservation.empty_title}
            subtitle={az.reservation.empty_subtitle}
          />
        ) : (
          <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {bookings.map((b) => (
              <StaggerItem key={b.id}>
                <article className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-semibold text-foreground">
                        {b.full_name}
                      </h3>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {az.reservation.for_tour}: {b.tour_title}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "stamp shrink-0 rounded-full px-2.5 py-1 text-[11px] ring-1 ring-inset",
                        STATUS_STYLE[b.status],
                      )}
                    >
                      {az.reservation.status[b.status]}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="size-4 shrink-0" />
                      {b.people} {az.reservation.people}
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="size-4 shrink-0" />
                      {b.departure_date
                        ? fmtDate(b.departure_date)
                        : b.date
                          ? fmtDate(b.date)
                          : az.reservation.no_date}
                    </div>
                    {b.phone && (
                      <a href={`tel:${b.phone}`} className="flex items-center gap-2 hover:text-foreground">
                        <Phone className="size-4 shrink-0" />
                        <span dir="ltr">{b.phone}</span>
                      </a>
                    )}
                    {b.email && (
                      <a href={`mailto:${b.email}`} className="flex items-center gap-2 hover:text-foreground">
                        <Mail className="size-4 shrink-0" />
                        <span className="truncate" dir="ltr">{b.email}</span>
                      </a>
                    )}
                  </div>

                  {b.notes && (
                    <p className="rounded-lg bg-surface-muted px-3 py-2 text-sm text-foreground/80">
                      {b.notes}
                    </p>
                  )}

                  <div className="mt-auto flex items-center gap-2 border-t border-border pt-4">
                    <Select
                      value={b.status}
                      onValueChange={(v) =>
                        updateStatus.mutate({ id: b.id, status: v as BookingStatus })
                      }
                    >
                      <SelectTrigger className="h-9 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {az.reservation.status[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={az.action.delete}
                      onClick={() => setDeleting(b)}
                      className="text-danger hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground/70">{fmtDate(b.created_at)}</p>
                </article>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </PageBody>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={confirmDelete}
        description={az.reservation.delete_confirm}
        loading={removeBooking.isPending}
      />
    </PageTransition>
  );
}
