"use client";

import { BottomSheetForm } from "@/components/shared/bottom-sheet-form";
import { EventForm, EventFormFooter } from "@/components/events/event-form";
import { az } from "@/lib/i18n/az";
import { formatDayMonth } from "@/lib/utils/date";
import type { CreateEventRequest, Event } from "@/lib/types";

const FORM_ID = "event-form";

export interface EventFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit target; omit for create. */
  event?: Event;
  /** Prefilled date (the tapped day) on create. */
  defaultDate?: string;
  submitting?: boolean;
  onSubmit: (body: CreateEventRequest) => void;
}

/** Responsive sheet/dialog wrapping the full EventForm (CONTRACT §11.8). */
export function EventFormSheet({
  open,
  onOpenChange,
  event,
  defaultDate,
  submitting,
  onSubmit,
}: EventFormSheetProps) {
  const isEdit = Boolean(event);
  const dayDate = event?.date ?? defaultDate;

  return (
    <BottomSheetForm
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? az.screen.event_edit : az.screen.event_new}
      description={dayDate ? formatDayMonth(dayDate) : undefined}
      className="sm:max-w-lg"
      footer={
        <EventFormFooter
          formId={FORM_ID}
          submitting={submitting}
          onCancel={() => onOpenChange(false)}
        />
      }
    >
      <EventForm
        formId={FORM_ID}
        event={event}
        defaultDate={defaultDate}
        submitting={submitting}
        onSubmit={onSubmit}
      />
    </BottomSheetForm>
  );
}
