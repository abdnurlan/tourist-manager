import { api } from "./axios";
import type {
  Guest,
  ListResponse,
  CreateGuestRequest,
  UpdateGuestRequest,
  SuccessResponse,
} from "@/lib/types";

/** GET /tours/:id/guests — protected. */
export async function listTourGuests(tourId: string): Promise<Guest[]> {
  const { data } = await api.get<ListResponse<Guest>>(`/tours/${tourId}/guests`);
  return data.data;
}

/** POST /tours/:id/guests — protected. Returns created Guest. */
export async function createGuest(
  tourId: string,
  body: CreateGuestRequest,
): Promise<Guest> {
  const { data } = await api.post<Guest>(`/tours/${tourId}/guests`, body);
  return data;
}

/** PATCH /guests/:id — protected. Returns updated Guest. */
export async function updateGuest(id: string, body: UpdateGuestRequest): Promise<Guest> {
  const { data } = await api.patch<Guest>(`/guests/${id}`, body);
  return data;
}

/** DELETE /guests/:id — protected. */
export async function deleteGuest(id: string): Promise<SuccessResponse> {
  const { data } = await api.delete<SuccessResponse>(`/guests/${id}`);
  return data;
}
