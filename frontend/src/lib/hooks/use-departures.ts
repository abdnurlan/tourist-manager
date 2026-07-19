"use client";

/* ─────────────────────────────────────────────────────────────
   Tour departure (tarixli çıxış) data hooks — dated departures
   belonging to a catalog tour.
   ───────────────────────────────────────────────────────────── */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listDepartures,
  createDeparture,
  updateDeparture,
  deleteDeparture,
} from "@/lib/api/departures";
import { toast } from "@/components/ui/sonner";
import { az } from "@/lib/i18n/az";
import type { DeparturePayload } from "@/lib/types";

const key = (tourId: string) => ["departures", tourId] as const;

export function useDepartures(tourId: string | null) {
  return useQuery({
    queryKey: key(tourId ?? ""),
    queryFn: () => listDepartures(tourId as string),
    enabled: Boolean(tourId),
  });
}

export function useCreateDeparture(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: DeparturePayload) => createDeparture(tourId, body),
    onSuccess: () => {
      toast.success(az.catalog.departures.added);
      qc.invalidateQueries({ queryKey: key(tourId) });
    },
  });
}

export function useUpdateDeparture(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: Partial<DeparturePayload> }) =>
      updateDeparture(vars.id, vars.body),
    onSuccess: () => {
      toast.success(az.catalog.departures.updated);
      qc.invalidateQueries({ queryKey: key(tourId) });
    },
  });
}

export function useDeleteDeparture(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDeparture(id),
    onSuccess: () => {
      toast.success(az.catalog.departures.deleted);
      qc.invalidateQueries({ queryKey: key(tourId) });
    },
  });
}
