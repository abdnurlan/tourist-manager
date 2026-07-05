"use client";

/* ─────────────────────────────────────────────────────────────
   Guest (turist) data hooks — tura bağlı qonaqların CRUD-u.
   ───────────────────────────────────────────────────────────── */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listTourGuests,
  createGuest,
  updateGuest,
  deleteGuest,
} from "@/lib/api/guests";
import { queryKeys } from "@/lib/query";
import { toast } from "@/components/ui/sonner";
import { az } from "@/lib/i18n/az";
import type { CreateGuestRequest, UpdateGuestRequest } from "@/lib/types";

export function useTourGuests(tourId: string) {
  return useQuery({
    queryKey: queryKeys.tourGuests(tourId),
    queryFn: () => listTourGuests(tourId),
    enabled: Boolean(tourId),
  });
}

export function useCreateGuest(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateGuestRequest) => createGuest(tourId, body),
    onSuccess: () => {
      toast.success(az.guest.created);
      qc.invalidateQueries({ queryKey: queryKeys.tourGuests(tourId) });
    },
  });
}

export function useUpdateGuest(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: UpdateGuestRequest }) =>
      updateGuest(vars.id, vars.body),
    onSuccess: () => {
      toast.success(az.guest.updated);
      qc.invalidateQueries({ queryKey: queryKeys.tourGuests(tourId) });
    },
  });
}

export function useDeleteGuest(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGuest(id),
    onSuccess: () => {
      toast.success(az.guest.deleted);
      qc.invalidateQueries({ queryKey: queryKeys.tourGuests(tourId) });
    },
  });
}
