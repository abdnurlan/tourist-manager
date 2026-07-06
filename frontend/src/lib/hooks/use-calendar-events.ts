"use client";

/* ─────────────────────────────────────────────────────────────
   Calendar data hooks (TanStack Query) wrapping the foundation
   calendar + events API. Provides the visible-range query plus
   an optimistic delete mutation for the detail dialog.
   ───────────────────────────────────────────────────────────── */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listCalendarEvents, listCalendarTours } from "@/lib/api/calendar";
import { deleteEvent, updateEvent } from "@/lib/api/events";
import { queryKeys } from "@/lib/query";
import type {
  CalendarQuery,
  EventStatus,
  EventWithTour,
  UpdateEventRequest,
} from "@/lib/types";

/** Fetch calendar events for a date range + optional type filter. */
export function useCalendarEvents(query: CalendarQuery) {
  return useQuery({
    queryKey: queryKeys.calendar(query),
    queryFn: () => listCalendarEvents(query),
    placeholderData: (prev) => prev, // keep previous data while panning views
  });
}

/** Fetch tours that overlap the visible calendar range. */
export function useCalendarTours(query: Pick<CalendarQuery, "from" | "to">) {
  return useQuery({
    queryKey: queryKeys.calendarTours(query),
    queryFn: () => listCalendarTours(query),
    placeholderData: (prev) => prev,
  });
}

/** Optimistic delete: removes the event from every cached calendar range. */
export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["calendar"] });
      const snapshots = qc.getQueriesData<EventWithTour[]>({
        queryKey: ["calendar"],
      });
      for (const [key, data] of snapshots) {
        if (data) qc.setQueryData(key, data.filter((e) => e.id !== id));
      }
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["calendar"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

/** Optimistic status toggle (planned/done/cancelled) from the detail dialog. */
export function useUpdateCalendarEventStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EventStatus }) => {
      const body: UpdateEventRequest = { status };
      return updateEvent(id, body);
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["calendar"] });
      const snapshots = qc.getQueriesData<EventWithTour[]>({
        queryKey: ["calendar"],
      });
      for (const [key, data] of snapshots) {
        if (data) {
          qc.setQueryData(
            key,
            data.map((e) => (e.id === id ? { ...e, status } : e)),
          );
        }
      }
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["calendar"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
