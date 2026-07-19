"use client";

/* ─────────────────────────────────────────────────────────────
   Catalog tour (kataloq turu) data hooks — public marketing tours.
   ───────────────────────────────────────────────────────────── */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listCatalogTours,
  getCatalogTour,
  createCatalogTour,
  updateCatalogTour,
  deleteCatalogTour,
} from "@/lib/api/catalog-tours";
import { queryKeys } from "@/lib/query";
import { toast } from "@/components/ui/sonner";
import { az } from "@/lib/i18n/az";
import type { CatalogTourPayload } from "@/lib/types";

export function useCatalogTours(category?: string) {
  return useQuery({
    queryKey: queryKeys.catalogTours(category ?? null),
    queryFn: () => listCatalogTours(category ? { category } : {}),
  });
}

export function useCatalogTour(id: string) {
  return useQuery({
    queryKey: queryKeys.catalogTour(id),
    queryFn: () => getCatalogTour(id),
    enabled: Boolean(id),
  });
}

export function useCreateCatalogTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CatalogTourPayload) => createCatalogTour(body),
    onSuccess: () => {
      toast.success(az.catalog.created);
      qc.invalidateQueries({ queryKey: ["catalog-tours"] });
    },
  });
}

export function useUpdateCatalogTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: Partial<CatalogTourPayload> }) =>
      updateCatalogTour(vars.id, vars.body),
    onSuccess: () => {
      toast.success(az.catalog.updated);
      qc.invalidateQueries({ queryKey: ["catalog-tours"] });
    },
  });
}

export function useDeleteCatalogTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCatalogTour(id),
    onSuccess: () => {
      toast.success(az.catalog.deleted);
      qc.invalidateQueries({ queryKey: ["catalog-tours"] });
    },
  });
}
