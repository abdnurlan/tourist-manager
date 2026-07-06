import { api } from "./axios";
import type { EventWithTour, ListResponse, CalendarQuery, Tour } from "@/lib/types";

/** GET /calendar/events?from=&to=&type= — protected. Events carry tour_title. */
export async function listCalendarEvents(
  query: CalendarQuery = {},
): Promise<EventWithTour[]> {
  const { data } = await api.get<ListResponse<EventWithTour>>("/calendar/events", {
    params: query,
  });
  return data.data;
}

/** GET /calendar/tours?from=&to= — protected. Tours overlap the visible range. */
export async function listCalendarTours(
  query: Pick<CalendarQuery, "from" | "to"> = {},
): Promise<Tour[]> {
  const { data } = await api.get<ListResponse<Tour>>("/calendar/tours", {
    params: query,
  });
  return data.data;
}
