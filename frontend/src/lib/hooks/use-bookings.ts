"use client";

/* ─────────────────────────────────────────────────────────────
   Booking (rezervasiya) data hooks — saytdan gələn müraciətlər.
   ───────────────────────────────────────────────────────────── */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listBookings, updateBookingStatus, deleteBooking } from "@/lib/api/bookings";
import { queryKeys } from "@/lib/query";
import { toast } from "@/components/ui/sonner";
import { az } from "@/lib/i18n/az";
import type { BookingStatus } from "@/lib/types";

export function useBookings(status?: string) {
  return useQuery({
    queryKey: queryKeys.bookings(status ?? null),
    queryFn: () => listBookings(status ? { status } : {}),
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; status: BookingStatus }) =>
      updateBookingStatus(vars.id, vars.status),
    onSuccess: () => {
      toast.success(az.reservation.status_updated);
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBooking(id),
    onSuccess: () => {
      toast.success(az.reservation.deleted);
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
