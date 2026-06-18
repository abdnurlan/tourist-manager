"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TourForm } from "@/components/tours/tour-form";
import { toast } from "@/components/ui/sonner";
import { createTour } from "@/lib/api/tours";
import { az } from "@/lib/i18n/az";
import type { CreateTourRequest, Tour } from "@/lib/types";

/**
 * Dedicated "Yeni tur" route (/tours/new).
 *
 * This static segment takes precedence over the dynamic `/tours/[id]` route,
 * so navigating here no longer mis-resolves to a tour lookup with id="new".
 * It reuses the shared TourForm (Sheet on mobile / Dialog on desktop); on
 * success it routes to the freshly-created tour's detail so the guide can
 * immediately start adding daily events.
 */
export default function NewTourPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (body: CreateTourRequest) => createTour(body),
    onSuccess: (tour: Tour) => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      toast.success(az.toast.tour_created);
      router.replace(tour?.id ? `/tours/${tour.id}` : "/tours");
    },
    onError: () => {
      toast.error(az.toast.error);
    },
  });

  return (
    <TourForm
      open
      onOpenChange={(open) => {
        // Closing (cancel / backdrop / Esc) returns to the tours list.
        if (!open && !createMutation.isPending) router.push("/tours");
      }}
      onSubmit={(values) => createMutation.mutate(values)}
      submitting={createMutation.isPending}
    />
  );
}
