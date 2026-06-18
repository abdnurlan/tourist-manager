"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { Topbar } from "@/components/layout/topbar";
import { PageBody } from "@/components/layout/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EventListSkeleton } from "@/components/shared/skeletons";
import { toast } from "@/components/ui/sonner";

import { TourDetailHeader } from "@/components/tour-detail/tour-detail-header";
import { DayTimeline } from "@/components/tour-detail/day-timeline";
import { EventFormSheet } from "@/components/tour-detail/event-form-sheet";
import { TourEditSheet } from "@/components/tour-detail/tour-edit-sheet";

import {
  getTour,
  updateTour,
  deleteTour,
  listTourEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "@/lib/api";
import { queryKeys } from "@/lib/query";
import { az } from "@/lib/i18n/az";
import { buildDaySections, dateOnly } from "@/lib/utils/date";
import { ApiClientError } from "@/lib/api/axios";
import type {
  Event,
  Tour,
  CreateEventRequest,
  UpdateTourRequest,
} from "@/lib/types";

function errMessage(e: unknown): string {
  if (e instanceof ApiClientError) {
    return e.code === "NETWORK_ERROR" ? az.toast.network_error : e.message;
  }
  return az.toast.error;
}

export default function TourDetailPage() {
  const params = useParams<{ id: string }>();
  const tourId = params.id;
  const router = useRouter();
  const qc = useQueryClient();

  // ── Sheet / dialog state ──────────────────────────────────────
  const [eventSheetOpen, setEventSheetOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [prefillDate, setPrefillDate] = useState<string | undefined>();
  const [tourEditOpen, setTourEditOpen] = useState(false);
  const [tourDeleteOpen, setTourDeleteOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | undefined>();

  // ── Queries ───────────────────────────────────────────────────
  const tourQuery = useQuery({
    queryKey: queryKeys.tour(tourId),
    queryFn: () => getTour(tourId),
  });

  const eventsQuery = useQuery({
    queryKey: queryKeys.tourEvents(tourId),
    queryFn: () => listTourEvents(tourId),
    enabled: Boolean(tourId),
  });

  const tour = tourQuery.data;
  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);

  const sections = useMemo(
    () => (tour ? buildDaySections(tour.start_date, tour.end_date) : []),
    [tour],
  );

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    for (const ev of events) {
      (map[dateOnly(ev.date)] ??= []).push(ev);
    }
    return map;
  }, [events]);

  // ── Event mutations (optimistic) ──────────────────────────────
  const eventsKey = queryKeys.tourEvents(tourId);

  const createMutation = useMutation({
    mutationFn: (body: CreateEventRequest) => createEvent(tourId, body),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: eventsKey });
      const prev = qc.getQueryData<Event[]>(eventsKey) ?? [];
      const optimistic: Event = {
        id: `temp-${Date.now()}`,
        tour_id: tourId,
        title: body.title,
        type: body.type,
        date: body.date,
        time: body.time ?? null,
        location: body.location ?? null,
        participants: body.participants ?? null,
        phone: body.phone ?? null,
        price: body.price ?? null,
        currency: body.currency ?? null,
        payment_status: body.payment_status ?? null,
        reminder_time: body.reminder_time ?? null,
        attachment: body.attachment ?? null,
        notes: body.notes ?? null,
        status: body.status ?? "planned",
        source: "manual",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      qc.setQueryData<Event[]>(eventsKey, [...prev, optimistic]);
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(eventsKey, ctx.prev);
      toast.error(errMessage(e));
    },
    onSuccess: () => {
      toast.success(az.toast.event_created);
      setEventSheetOpen(false);
      setEditingEvent(undefined);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: eventsKey });
      qc.invalidateQueries({ queryKey: queryKeys.tour(tourId) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; body: CreateEventRequest }) =>
      updateEvent(vars.id, vars.body),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: eventsKey });
      const prev = qc.getQueryData<Event[]>(eventsKey) ?? [];
      qc.setQueryData<Event[]>(
        eventsKey,
        prev.map((ev) =>
          ev.id === vars.id
            ? { ...ev, ...vars.body, updated_at: new Date().toISOString() }
            : ev,
        ),
      );
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(eventsKey, ctx.prev);
      toast.error(errMessage(e));
    },
    onSuccess: () => {
      toast.success(az.toast.event_updated);
      setEventSheetOpen(false);
      setEditingEvent(undefined);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: eventsKey });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: eventsKey });
      const prev = qc.getQueryData<Event[]>(eventsKey) ?? [];
      qc.setQueryData<Event[]>(
        eventsKey,
        prev.filter((ev) => ev.id !== id),
      );
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(eventsKey, ctx.prev);
      toast.error(errMessage(e));
    },
    onSuccess: () => {
      toast.success(az.toast.event_deleted);
      setEventToDelete(undefined);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: eventsKey });
      qc.invalidateQueries({ queryKey: queryKeys.tour(tourId) });
    },
  });

  // ── Tour mutations ────────────────────────────────────────────
  const tourUpdateMutation = useMutation({
    mutationFn: (body: UpdateTourRequest) => updateTour(tourId, body),
    onSuccess: (updated: Tour) => {
      qc.setQueryData(queryKeys.tour(tourId), updated);
      qc.invalidateQueries({ queryKey: queryKeys.tours() });
      toast.success(az.toast.tour_updated);
      setTourEditOpen(false);
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  const tourDeleteMutation = useMutation({
    mutationFn: () => deleteTour(tourId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tours() });
      toast.success(az.toast.tour_deleted);
      router.push("/tours");
    },
    onError: (e) => toast.error(errMessage(e)),
  });

  // ── Handlers ──────────────────────────────────────────────────
  const openCreate = (dateISO?: string) => {
    setEditingEvent(undefined);
    setPrefillDate(dateISO ?? tour?.start_date);
    setEventSheetOpen(true);
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    setPrefillDate(undefined);
    setEventSheetOpen(true);
  };

  const handleEventSubmit = (body: CreateEventRequest) => {
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, body });
    } else {
      createMutation.mutate(body);
    }
  };

  const eventSubmitting = createMutation.isPending || updateMutation.isPending;

  // ── Loading state ─────────────────────────────────────────────
  if (tourQuery.isLoading) {
    return (
      <>
        <Topbar title={az.screen.tour_detail} showBack />
        <PageBody className="space-y-6">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <EventListSkeleton count={4} />
        </PageBody>
      </>
    );
  }

  // ── Error / not found ─────────────────────────────────────────
  if (tourQuery.isError || !tour) {
    const notFound =
      tourQuery.error instanceof ApiClientError &&
      (tourQuery.error.status === 404 ||
        tourQuery.error.code === "TOUR_NOT_FOUND");
    return (
      <>
        <Topbar title={az.screen.tour_detail} showBack />
        <PageBody>
          <EmptyState
            title={notFound ? az.common.not_found_title : az.common.error_title}
            subtitle={
              notFound ? az.common.not_found_subtitle : az.common.error_subtitle
            }
          />
        </PageBody>
      </>
    );
  }

  return (
    <>
      <Topbar title={tour.title} showBack />

      <PageTransition>
        <PageBody className="space-y-6">
          <TourDetailHeader
            tour={tour}
            dayCount={sections.length}
            eventCount={events.length}
            onEdit={() => setTourEditOpen(true)}
            onDelete={() => setTourDeleteOpen(true)}
          />

          {eventsQuery.isLoading ? (
            <EventListSkeleton count={4} />
          ) : (
            <>
              {events.length === 0 && sections.length > 0 && (
                <EmptyState
                  title={az.empty.events.title}
                  subtitle={az.empty.events.subtitle}
                  compact
                />
              )}
              <DayTimeline
                sections={sections}
                eventsByDate={eventsByDate}
                onAddEvent={openCreate}
                onEditEvent={openEdit}
                onDeleteEvent={(ev) => setEventToDelete(ev)}
              />
            </>
          )}
        </PageBody>
      </PageTransition>

      {/* Mobile FAB → add event (prefilled with first day) */}
      <motion.button
        type="button"
        aria-label={az.action.add_event}
        onClick={() => openCreate()}
        whileTap={{ scale: 0.92 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="fixed right-5 z-40 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg active:bg-accent-hover md:hidden"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 76px)" }}
      >
        <Plus className="size-6" strokeWidth={2.5} />
      </motion.button>

      {/* Event create/edit */}
      <EventFormSheet
        open={eventSheetOpen}
        onOpenChange={(o) => {
          setEventSheetOpen(o);
          if (!o) setEditingEvent(undefined);
        }}
        event={editingEvent}
        defaultDate={prefillDate}
        submitting={eventSubmitting}
        onSubmit={handleEventSubmit}
      />

      {/* Tour edit */}
      <TourEditSheet
        open={tourEditOpen}
        onOpenChange={setTourEditOpen}
        tour={tour}
        submitting={tourUpdateMutation.isPending}
        onSubmit={(body) => tourUpdateMutation.mutate(body)}
      />

      {/* Delete event confirm */}
      <ConfirmDialog
        open={Boolean(eventToDelete)}
        onOpenChange={(o) => !o && setEventToDelete(undefined)}
        title={az.action.delete}
        loading={deleteEventMutation.isPending}
        onConfirm={() => eventToDelete && deleteEventMutation.mutate(eventToDelete.id)}
      />

      {/* Delete tour confirm */}
      <ConfirmDialog
        open={tourDeleteOpen}
        onOpenChange={setTourDeleteOpen}
        title={az.action.delete}
        loading={tourDeleteMutation.isPending}
        onConfirm={() => tourDeleteMutation.mutate()}
      />
    </>
  );
}
