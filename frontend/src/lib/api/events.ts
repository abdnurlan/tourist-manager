import { api } from "./axios";
import type {
  Event,
  ListResponse,
  CreateEventRequest,
  UpdateEventRequest,
  SuccessResponse,
} from "@/lib/types";

/** GET /tours/:id/events — protected. List ordered by date then time. */
export async function listTourEvents(tourId: string): Promise<Event[]> {
  const { data } = await api.get<ListResponse<Event>>(`/tours/${tourId}/events`);
  return data.data;
}

/** POST /tours/:id/events — protected. Source set server-side; returns created Event. */
export async function createEvent(
  tourId: string,
  body: CreateEventRequest,
): Promise<Event> {
  const { data } = await api.post<Event>(`/tours/${tourId}/events`, body);
  return data;
}

/** GET /events/:id — protected. Bare Event. */
export async function getEvent(id: string): Promise<Event> {
  const { data } = await api.get<Event>(`/events/${id}`);
  return data;
}

/** PATCH /events/:id — protected. Partial update; returns updated Event. */
export async function updateEvent(id: string, body: UpdateEventRequest): Promise<Event> {
  const { data } = await api.patch<Event>(`/events/${id}`, body);
  return data;
}

/** DELETE /events/:id — protected. */
export async function deleteEvent(id: string): Promise<SuccessResponse> {
  const { data } = await api.delete<SuccessResponse>(`/events/${id}`);
  return data;
}
