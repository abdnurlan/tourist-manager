// Public API base for the M4STrip backend. Configurable via VITE_API_URL,
// falls back to the local dev backend.
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8080/api";

export interface CreateBookingBody {
  catalog_tour_id?: string | null;
  tour_slug?: string | null;
  tour_title?: string | null;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  people?: number;
  date?: string | null;
  notes?: string | null;
}

export interface ApiErrorShape {
  error?: { code: string; message: string };
}

/** POST /public/bookings — submit a reservation from the landing site. */
export async function submitBooking(body: CreateBookingBody): Promise<void> {
  const res = await fetch(`${API_BASE}/public/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = "Rezervasiya göndərilə bilmədi.";
    try {
      const data = (await res.json()) as ApiErrorShape;
      if (data.error?.message) message = data.error.message;
    } catch {
      // ignore JSON parse failure, use default message
    }
    throw new Error(message);
  }
}
