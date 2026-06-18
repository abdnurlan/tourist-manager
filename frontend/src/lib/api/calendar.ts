import { api } from "./axios";
import type { EventWithTour, ListResponse, CalendarQuery } from "@/lib/types";

/** GET /calendar/events?from=&to=&type= — protected. Events carry tour_title. */
export async function listCalendarEvents(
  query: CalendarQuery = {},
): Promise<EventWithTour[]> {
  const { data } = await api.get<ListResponse<EventWithTour>>("/calendar/events", {
    params: query,
  });
  return data.data;
}
