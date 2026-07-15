import { api } from "./axios";
import type { Booking, BookingStatus, ListResponse, SuccessResponse } from "@/lib/types";

/** GET /bookings?status= — admin, newest first. */
export async function listBookings(params: { status?: string } = {}): Promise<Booking[]> {
  const { data } = await api.get<ListResponse<Booking>>("/bookings", { params });
  return data.data;
}

/** PATCH /bookings/:id — admin, change status. */
export async function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
  const { data } = await api.patch<Booking>(`/bookings/${id}`, { status });
  return data;
}

/** DELETE /bookings/:id — admin. */
export async function deleteBooking(id: string): Promise<SuccessResponse> {
  const { data } = await api.delete<SuccessResponse>(`/bookings/${id}`);
  return data;
}
