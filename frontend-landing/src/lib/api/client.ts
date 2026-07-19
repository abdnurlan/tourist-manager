import type { CategoryKey, Lang, Tour, TourDate, TourDay, TourLocale } from "@/lib/tours-data";

// Public API base for the M4STrip backend.
//   • Browser (client): VITE_API_URL — a host-reachable origin (localhost:8080).
//   • SSR (server, e.g. route loaders): the browser origin is not reachable from
//     inside the container, so use SSR_API_URL (the Docker service name), falling
//     back to VITE_API_URL for non-containerised runs.
const rawBase = import.meta.env.SSR
  ? (typeof process !== "undefined" ? process.env.SSR_API_URL : undefined) ??
    (import.meta.env.VITE_API_URL as string | undefined)
  : (import.meta.env.VITE_API_URL as string | undefined);
const API_BASE = (rawBase ?? "http://localhost:8080/api").replace(/\/$/, "");

const LANGS: Lang[] = ["az", "en", "ru", "ar", "he"];

// Backend CatalogTour: per-field language maps.
interface ApiCatalogTour {
  id: string;
  slug: string;
  category: string;
  price: number;
  rating: number;
  duration: number;
  group_size: string;
  image_url: string;
  published: boolean;
  title: Record<string, string>;
  region: Record<string, string>;
  overview: Record<string, string>;
  highlights: Record<string, string[]>;
  itinerary: Record<string, { title: string; description: string }[]>;
  included: Record<string, string[]>;
  excluded: Record<string, string[]>;
}

// Backend internal Tour linked to a catalog tour (a bookable dated departure).
interface ApiTourDay {
  date: string;
  active: boolean;
  events: { title: string; type: string; time: string | null; location: string | null }[];
}

interface ApiLinkedTour {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  capacity: number;
  booked_seats: number;
  price: number;
  status: string;
  days?: ApiTourDay[];
}

function adaptDate(t: ApiLinkedTour): TourDate {
  const days: TourDay[] = (t.days ?? []).map((d) => ({
    date: (d.date ?? "").slice(0, 10),
    active: d.active,
    events: (d.events ?? []).map((e) => ({
      title: e.title,
      type: e.type,
      time: e.time,
      location: e.location,
    })),
  }));
  return {
    id: t.id,
    title: t.title,
    startDate: (t.start_date ?? "").slice(0, 10),
    endDate: (t.end_date ?? "").slice(0, 10),
    capacity: t.capacity,
    bookedSeats: t.booked_seats,
    price: t.price,
    status: t.status,
    days,
  };
}

// Pick a language value, falling back to az → en → any.
function pick<T>(m: Record<string, T> | null | undefined, lang: Lang): T | undefined {
  if (!m) return undefined;
  return m[lang] ?? m.az ?? m.en ?? Object.values(m)[0];
}

/** Adapt a backend CatalogTour into the landing's Tour shape (per-locale i18n). */
function adapt(api: ApiCatalogTour): Tour {
  const i18n = {} as Record<Lang, TourLocale>;
  for (const lang of LANGS) {
    i18n[lang] = {
      title: pick(api.title, lang) ?? api.slug,
      region: pick(api.region, lang) ?? "",
      overview: pick(api.overview, lang) ?? "",
      highlights: pick(api.highlights, lang) ?? [],
      itinerary: pick(api.itinerary, lang) ?? [],
      included: pick(api.included, lang) ?? [],
      excluded: pick(api.excluded, lang) ?? [],
    };
  }
  return {
    id: api.slug,
    category: api.category as CategoryKey,
    duration: api.duration,
    groupSize: api.group_size,
    price: api.price,
    rating: api.rating,
    image: api.image_url,
    i18n,
    dates: [],
  };
}

/** GET /public/catalog-tours → published tours in the landing's Tour shape. */
export async function fetchCatalogTours(): Promise<Tour[]> {
  const res = await fetch(`${API_BASE}/public/catalog-tours`);
  if (!res.ok) throw new Error("Turlar yüklənə bilmədi.");
  const json = (await res.json()) as { data: ApiCatalogTour[] };
  return (json.data ?? []).map(adapt);
}

/** GET /public/catalog-tours/:slug → single tour + linked dated tours, or null. */
export async function fetchCatalogTour(slug: string): Promise<Tour | null> {
  const res = await fetch(`${API_BASE}/public/catalog-tours/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Tur yüklənə bilmədi.");
  const json = (await res.json()) as { tour: ApiCatalogTour; tours: ApiLinkedTour[] };
  const tour = adapt(json.tour);
  tour.dates = (json.tours ?? []).map(adaptDate);
  return tour;
}

export interface CreateBookingBody {
  catalog_tour_id?: string | null;
  tour_slug?: string | null;
  tour_title?: string | null;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  people?: number;
  date?: string | null;
  tour_id?: string | null;
  notes?: string | null;
}

// Backend errors are a flat { code, message, fields? } (Azerbaijani message).
export interface ApiErrorShape {
  code?: string;
  message?: string;
  fields?: { field: string; message: string }[];
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
      // Prefer a field-level message (e.g. "yer qalmayıb"), then the top message.
      message = data.fields?.[0]?.message ?? data.message ?? message;
    } catch {
      // ignore JSON parse failure, use default message
    }
    throw new Error(message);
  }
}
