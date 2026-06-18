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
  events_count: number;
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
}

export type UpdateTourRequest = Partial<
  Pick<Tour, "title" | "start_date" | "end_date" | "description" | "status">
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
>;

export interface AiChatRequest {
  message: string;
}

// ── Query filters ──────────────────────────────────────────────
export interface ToursQuery {
  status?: TourStatus;
  q?: string;
}

export interface CalendarQuery {
  from?: string;
  to?: string;
  type?: EventType;
}
