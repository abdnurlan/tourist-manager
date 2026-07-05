import { az } from "@/lib/i18n/az";
import type { EventType } from "@/lib/types";

export type DetailFieldKind = "text" | "date" | "time" | "number" | "tel";

export interface DetailFieldSpec {
  key: string;
  label: string;
  kind: DetailFieldKind;
  placeholder?: string;
}

/** Type-specific detail fields shown in the event form, keyed by event type. */
export const TYPE_FIELDS: Partial<Record<EventType, DetailFieldSpec[]>> = {
  transfer: [
    { key: "from", label: az.event.details.from, kind: "text" },
    { key: "to", label: az.event.details.to, kind: "text" },
    { key: "driver", label: az.event.details.driver, kind: "text" },
    {
      key: "driver_phone",
      label: az.event.details.driver_phone,
      kind: "tel",
      placeholder: "+994 50 123 45 67",
    },
  ],
  hotel: [
    { key: "hotel_name", label: az.event.details.hotel_name, kind: "text" },
    { key: "address", label: az.event.details.address, kind: "text" },
    { key: "check_in", label: az.event.details.check_in, kind: "date" },
    { key: "check_out", label: az.event.details.check_out, kind: "date" },
    { key: "room", label: az.event.details.room, kind: "text" },
  ],
  restaurant: [
    { key: "venue", label: az.event.details.venue, kind: "text" },
    { key: "address", label: az.event.details.address, kind: "text" },
    { key: "reservation_time", label: az.event.details.reservation_time, kind: "time" },
    { key: "party_size", label: az.event.details.party_size, kind: "number" },
  ],
  other: [],
};

/** The four types offered as create buttons, in display order. */
export const CREATE_TYPES: EventType[] = ["transfer", "hotel", "restaurant", "other"];
