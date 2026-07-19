/* ─────────────────────────────────────────────────────────────
   Tur Planlayıcı — TypeScript types (CONTRACT §6, §7)
   All keys are snake_case, mirroring the API verbatim.
   ───────────────────────────────────────────────────────────── */

// ── Enum value unions ──────────────────────────────────────────
export type UserRole = "admin";
export type TourStatus = "planned" | "active" | "completed" | "cancelled";
export type EventType =
  | "transfer"
  | "hotel"
  | "restaurant"
  | "tour"
  | "flight"
  | "note"
  | "other";
export type EventStatus = "planned" | "done" | "cancelled";
export type PaymentStatus = "unpaid" | "partial" | "paid";
export type EventSource = "manual" | "telegram" | "ai";
export type TgDirection = "in" | "out";
export type TgKind = "text" | "voice" | "photo" | "document" | "command";

// ── Core resources ─────────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Tour {
  id: string;
  title: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  description: string | null;
  status: TourStatus;
  catalog_tour_id: string | null; // linked catalog template
  capacity: number; // seat limit
  events_count: number;
  guests_count: number; // guest rows on this tour
  booked_seats: number; // Σ booking people (landing "booked")
  price: number; // inherited from linked catalog
  catalog_slug: string; // linked catalog slug
  catalog_title: string; // linked catalog AZ title
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  tour_id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:mm
  location: string | null;
  participants: string | null;
  phone: string | null;
  price: number | null;
  currency: string | null;
  payment_status: PaymentStatus | null;
  reminder_time: string | null; // RFC3339
  attachment: string | null;
  notes: string | null;
  /** Type-specific fields as JSON. API returns a JSON string; parse defensively. */
  details: Record<string, unknown> | string | null;
  /** Tourists participating in this event (many-to-many). */
  guests: Guest[];
  status: EventStatus;
  source: EventSource;
  created_at: string;
  updated_at: string;
}

/** Calendar/search events carry the parent tour title. */
export interface EventWithTour extends Event {
  tour_title: string;
}

export interface Reminder {
  id: string;
  event_id: string | null;
  remind_at: string; // RFC3339
  message: string;
  sent: boolean;
  created_at: string;
}

// ── Dashboard composite (CONTRACT §6.2) ────────────────────────
export type RecentActivityKind =
  | "event_created"
  | "event_updated"
  | "tour_created"
  | "telegram_message"
  | "ai_message";

export interface RecentActivityItem {
  id: string;
  kind: RecentActivityKind;
  source: EventSource;
  title: string;
  ref_id: string;
  created_at: string;
}

export interface TelegramStatus {
  connected: boolean;
  mode: "polling" | "webhook";
  allowed_user_configured: boolean;
  last_message_at: string | null;
}

export interface Weather {
  available: boolean;
  location: string;
  temp_c: number | null;
  condition: string | null;
  note: string;
}

export interface DashboardResponse {
  today_events: Event[];
  upcoming_events: Event[];
  upcoming_tours: Tour[];
  active_tours: Tour[];
  total_active_tours: number;
  events_waiting_today: number;
  today_reminders: Reminder[];
  recent_activity: RecentActivityItem[];
  telegram_status: TelegramStatus;
  weather: Weather;
}

// ── AI / history (CONTRACT §6.7) ───────────────────────────────
export interface AiChatResponse {
  reply: string;
  intent: string;
  source: EventSource;
  /** Present on the voice path: what Whisper heard. */
  transcript?: string;
}

export interface AiHistoryItem {
  id: string;
  telegram_user_id: number;
  direction: TgDirection;
  kind: TgKind;
  content: string | null;
  transcript: string | null;
  intent: string | null;
  created_at: string;
}

// ── Auth (CONTRACT §6.1) ───────────────────────────────────────
export interface LoginResponse {
  token: string;
  user: User;
}

// ── Search (CONTRACT §6.6) ─────────────────────────────────────
export interface SearchResponse {
  data: {
    tours: Tour[];
    events: EventWithTour[];
  };
  query: string;
}

// ── Guests (turistlər — tura bağlı) ────────────────────────────
export interface Guest {
  id: string;
  tour_id: string;
  full_name: string;
  phone: string | null;
  passport: string | null;
  nationality: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGuestRequest {
  full_name: string;
  phone?: string | null;
  passport?: string | null;
  nationality?: string | null;
  notes?: string | null;
}

export type UpdateGuestRequest = Partial<CreateGuestRequest>;

// ── Catalog tours (public marketing catalog) ──────────────────
export type CatalogCategory = "mountain" | "history" | "nature" | "wellness" | "coast" | "offroad";
export type LangMap = Record<string, string>;
export interface CatalogDayPlan { title: string; description: string }

export interface CatalogTour {
  id: string;
  slug: string;
  category: CatalogCategory;
  price: number;
  rating: number;
  duration: number;
  group_size: string;
  image_url: string;
  published: boolean;
  sort_order: number;
  title: LangMap;
  region: LangMap;
  overview: LangMap;
  highlights: Record<string, string[]>;
  itinerary: Record<string, CatalogDayPlan[]>;
  included: Record<string, string[]>;
  excluded: Record<string, string[]>;
  created_at: string;
  updated_at: string;
}

export interface CatalogTourPayload {
  slug: string;
  category: CatalogCategory;
  price: number;
  rating?: number;
  duration?: number;
  group_size?: string;
  image_url?: string;
  published?: boolean;
  sort_order?: number;
  title: LangMap;
  region?: LangMap;
  overview?: LangMap;
  highlights?: Record<string, string[]>;
  itinerary?: Record<string, CatalogDayPlan[]>;
  included?: Record<string, string[]>;
  excluded?: Record<string, string[]>;
}

// ── Bookings (public reservations) ─────────────────────────────
export type BookingStatus = "new" | "confirmed" | "cancelled" | "completed";

export interface Booking {
  id: string;
  catalog_tour_id: string | null;
  tour_slug: string | null;
  tour_title: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  people: number;
  date: string | null;
  tour_id: string | null; // linked internal tour (bookable departure)
  notes: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
}

// ── Generic envelopes ──────────────────────────────────────────
export interface ListResponse<T> {
  data: T[];
}

export interface SuccessResponse {
  success: true;
}

export interface ApiError {
  code: string;
  message: string;
  fields?: { field: string; message: string }[];
}

// ── Request payloads ───────────────────────────────────────────
export interface LoginRequest {
  username: string;
  password: string;
}

export interface CreateTourRequest {
  title: string;
  start_date: string;
  end_date: string;
  description?: string | null;
  status?: TourStatus;
  catalog_tour_id?: string | null;
  capacity?: number;
}

export type UpdateTourRequest = Partial<
  Pick<
    Tour,
    "title" | "start_date" | "end_date" | "description" | "status" | "catalog_tour_id" | "capacity"
  >
>;

export interface CreateEventRequest {
  title: string;
  type: EventType;
  date: string;
  time?: string | null;
  location?: string | null;
  participants?: string | null;
  phone?: string | null;
  price?: number | null;
  currency?: string | null;
  payment_status?: PaymentStatus | null;
  reminder_time?: string | null;
  attachment?: string | null;
  notes?: string | null;
  details?: Record<string, unknown> | null;
  guest_ids?: string[];
  status?: EventStatus;
}

export type UpdateEventRequest = Partial<
  Pick<
    Event,
    | "title"
    | "type"
    | "date"
    | "time"
    | "location"
    | "participants"
    | "phone"
    | "price"
    | "currency"
    | "payment_status"
    | "reminder_time"
    | "attachment"
    | "notes"
    | "status"
  >
> & {
  details?: Record<string, unknown> | null;
  guest_ids?: string[];
};

export interface AiChatRequest {
  message: string;
}

// ── Query filters ──────────────────────────────────────────────
export interface ToursQuery {
  status?: TourStatus;
  q?: string;
  catalog?: string; // filter to tours linked to this catalog tour id
}

export interface CalendarQuery {
  from?: string;
  to?: string;
  type?: EventType;
}
