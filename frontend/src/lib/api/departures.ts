import { api } from "./axios";
import type { Departure, DeparturePayload, ListResponse, SuccessResponse } from "@/lib/types";

/** GET /catalog-tours/:id/departures — admin, all departures for a tour. */
export async function listDepartures(tourId: string): Promise<Departure[]> {
  const { data } = await api.get<ListResponse<Departure>>(`/catalog-tours/${tourId}/departures`);
  return data.data;
}

/** POST /catalog-tours/:id/departures — admin, returns created (201, bare). */
export async function createDeparture(tourId: string, body: DeparturePayload): Promise<Departure> {
  const { data } = await api.post<Departure>(`/catalog-tours/${tourId}/departures`, body);
  return data;
}

/** PATCH /departures/:id — admin, partial update. */
export async function updateDeparture(
  id: string,
  body: Partial<DeparturePayload>,
): Promise<Departure> {
  const { data } = await api.patch<Departure>(`/departures/${id}`, body);
  return data;
}

/** DELETE /departures/:id — admin. */
export async function deleteDeparture(id: string): Promise<SuccessResponse> {
  const { data } = await api.delete<SuccessResponse>(`/departures/${id}`);
  return data;
}
