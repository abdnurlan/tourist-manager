"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Map as MapIcon, Plus, Search, X } from "lucide-react";

import { PageHeader, PageBody } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PageTransition,
  StaggerList,
  StaggerItem,
} from "@/components/shared/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { TourCardSkeleton } from "@/components/shared/skeletons";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/sonner";

import { TourCard } from "@/components/tours/tour-card";
import { TourForm } from "@/components/tours/tour-form";

import {
  listTours,
  createTour,
  updateTour,
  deleteTour,
} from "@/lib/api/tours";
import { queryKeys } from "@/lib/query";
import { az, tourStatusLabel } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";
import type {
  Tour,
  TourStatus,
  ToursQuery,
  CreateTourRequest,
} from "@/lib/types";

type StatusFilter = "all" | TourStatus;

const STATUS_CHIPS: StatusFilter[] = [
  "all",
  "planned",
  "active",
  "completed",
  "cancelled",
];

function chipLabel(s: StatusFilter): string {
  return s === "all" ? az.common.all : tourStatusLabel(s);
}

/** A temp optimistic tour gets a sentinel id so we can dim it & reconcile. */
const OPTIMISTIC_PREFIX = "optimistic-";

export default function ToursPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tour | null>(null);
  const [deleting, setDeleting] = useState<Tour | null>(null);

  // Server-side filter by status only; search is applied client-side for
  // instant feedback (no debounce flicker), per CONTRACT q-on-title/description.
  const filters: ToursQuery = useMemo(
    () => (status === "all" ? {} : { status }),
    [status],
  );
  const toursKey = queryKeys.tours(filters);

  const { data: tours, isLoading, isError, refetch } = useQuery({
    queryKey: toursKey,
    queryFn: () => listTours(filters),
  });

  const visibleTours = useMemo(() => {
    if (!tours) return [];
    const q = search.trim().toLowerCase();
    if (!q) return tours;
    return tours.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q),
    );
  }, [tours, search]);

  // ── Optimistic create ────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (body: CreateTourRequest) => createTour(body),
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: toursKey });
      const previous = queryClient.getQueryData<Tour[]>(toursKey);
      const now = new Date().toISOString();
      const optimistic: Tour = {
        id: `${OPTIMISTIC_PREFIX}${now}`,
        title: body.title,
        start_date: body.start_date,
        end_date: body.end_date,
        description: body.description ?? null,
        status: body.status ?? "planned",
        events_count: 0,
        created_at: now,
        updated_at: now,
      };
      queryClient.setQueryData<Tour[]>(toursKey, (old) => [
        optimistic,
        ...(old ?? []),
      ]);
      return { previous };
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(toursKey, ctx.previous);
      toast.error(az.toast.error);
    },
    onSuccess: () => {
      toast.success(az.toast.tour_created);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });

  // ── Optimistic update ────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: CreateTourRequest }) =>
      updateTour(id, body),
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: toursKey });
      const previous = queryClient.getQueryData<Tour[]>(toursKey);
      queryClient.setQueryData<Tour[]>(toursKey, (old) =>
        (old ?? []).map((t) =>
          t.id === id
            ? {
                ...t,
                ...body,
                description: body.description ?? null,
                updated_at: new Date().toISOString(),
              }
            : t,
        ),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(toursKey, ctx.previous);
      toast.error(az.toast.error);
    },
    onSuccess: () => {
      toast.success(az.toast.tour_updated);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });

  // ── Optimistic delete ────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTour(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: toursKey });
      const previous = queryClient.getQueryData<Tour[]>(toursKey);
      queryClient.setQueryData<Tour[]>(toursKey, (old) =>
        (old ?? []).filter((t) => t.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(toursKey, ctx.previous);
      toast.error(az.toast.error);
    },
    onSuccess: () => {
      toast.success(az.toast.tour_deleted);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
    },
  });

  // ── Handlers ──────────────────────────────────────────────────
  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(tour: Tour) {
    setEditing(tour);
    setFormOpen(true);
  }

  function handleSubmit(values: CreateTourRequest) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, body: values });
    } else {
      createMutation.mutate(values);
    }
    setFormOpen(false);
  }

  function confirmDelete() {
    if (!deleting) return;
    deleteMutation.mutate(deleting.id);
    setDeleting(null);
  }

  const submitting = editing
    ? updateMutation.isPending
    : createMutation.isPending;

  // ── Render ────────────────────────────────────────────────────
  return (
    <PageTransition>
      <PageHeader
        title={az.screen.tours}
        actions={
          <Button onClick={openCreate} className="max-md:hidden">
            <Plus />
            {az.action.add_tour}
          </Button>
        }
      />

      <PageBody className="space-y-5">
        {/* Search box */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={az.action.search}
            className="h-11 rounded-xl pl-11 pr-10"
            aria-label={az.action.search}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label={az.action.clear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-surface-muted"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Status filter chips — rubber-stamp / luggage-label pills */}
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

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <TourCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={MapIcon}
            title={az.common.error_title}
            subtitle={az.common.error_subtitle}
            action={
              <Button variant="secondary" onClick={() => refetch()}>
                {az.action.retry}
              </Button>
            }
          />
        ) : visibleTours.length === 0 ? (
          search.trim() || status !== "all" ? (
            <EmptyState
              icon={Search}
              title={az.empty.search.title}
              subtitle={az.empty.search.subtitle}
            />
          ) : (
            <EmptyState
              icon={MapIcon}
              title={az.empty.tours.title}
              subtitle={az.empty.tours.subtitle}
              action={
                <Button onClick={openCreate}>
                  <Plus />
                  {az.action.add_tour}
                </Button>
              }
            />
          )
        ) : (
          <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visibleTours.map((tour) => {
                const pending = tour.id.startsWith(OPTIMISTIC_PREFIX);
                return (
                  <StaggerItem key={tour.id}>
                    <motion.div
                      layout
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                    >
                      <TourCard
                        tour={tour}
                        pending={pending}
                        onClick={
                          pending
                            ? undefined
                            : (t) => router.push(`/tours/${t.id}`)
                        }
                        onEdit={openEdit}
                        onDelete={setDeleting}
                      />
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </AnimatePresence>
          </StaggerList>
        )}
      </PageBody>

      {/* Create / Edit form (Sheet on mobile, Dialog on desktop) */}
      <TourForm
        open={formOpen}
        onOpenChange={setFormOpen}
        tour={editing}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteMutation.isPending}
      />
    </PageTransition>
  );
}
