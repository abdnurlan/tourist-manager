import type { CategoryKey, Lang, Tour, TourLocale } from "@/lib/tours-data";

// Public API base for the M4STrip backend. Configurable via VITE_API_URL,
// falls back to the local dev backend.
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8080/api";

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
  };
}

/** GET /public/catalog-tours → published tours in the landing's Tour shape. */
export async function fetchCatalogTours(): Promise<Tour[]> {
  const res = await fetch(`${API_BASE}/public/catalog-tours`);
  if (!res.ok) throw new Error("Turlar yüklənə bilmədi.");
  const json = (await res.json()) as { data: ApiCatalogTour[] };
  return (json.data ?? []).map(adapt);
}

/** GET /public/catalog-tours/:slug → single tour, or null if not found. */
export async function fetchCatalogTour(slug: string): Promise<Tour | null> {
  const res = await fetch(`${API_BASE}/public/catalog-tours/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Tur yüklənə bilmədi.");
  const json = (await res.json()) as ApiCatalogTour;
  return adapt(json);
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
