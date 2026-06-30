"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker, DateTimePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EVENT_TYPE_ICON } from "@/components/shared/event-type-icon";
import { eventMeta } from "@/lib/event-meta";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";
import type {
  Event,
  EventType,
  EventStatus,
  PaymentStatus,
  CreateEventRequest,
} from "@/lib/types";

const EVENT_TYPES: EventType[] = [
  "transfer",
  "hotel",
  "restaurant",
  "tour",
  "flight",
  "note",
  "other",
];
const EVENT_STATUSES: EventStatus[] = ["planned", "done", "cancelled"];
const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "partial", "paid"];
const CURRENCIES = ["AZN", "USD", "EUR", "GBP", "TRY", "RUB"];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/* ─── Schema ────────────────────────────────────────────────────── */
const schema = z.object({
  title: z.string().trim().min(1, { message: az.validation.title_required }),
  type: z.enum(["transfer", "hotel", "restaurant", "tour", "flight", "note", "other"]),
  date: z
    .string()
    .min(1, { message: az.validation.date_required })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: az.validation.invalid_date }),
  time: z
    .string()
    .optional()
    .refine((v) => !v || TIME_RE.test(v), { message: az.validation.invalid_time }),
  location: z.string().optional(),
  participants: z.string().optional(),
  phone: z.string().optional(),
  price: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v.replace(",", "."))), {
      message: az.validation.invalid_price,
    }),
  currency: z.string().optional(),
  payment_status: z.string().optional(),
  status: z.enum(["planned", "done", "cancelled"]),
  reminder_time: z.string().optional(), // datetime-local value
  attachment: z.string().optional(),
  notes: z.string().optional(),
});

export type EventFormValues = z.infer<typeof schema>;

export interface EventFormProps {
  /** Provide for edit; omit for create. */
  event?: Event;
  /** Default date (YYYY-MM-DD) prefilled on create — usually the tapped day. */
  defaultDate?: string;
  formId: string;
  submitting?: boolean;
  onSubmit: (body: CreateEventRequest) => void;
}

/* datetime-local <-> RFC3339 helpers (display Asia/Baku, store UTC) */
const BAKU_OFFSET_MIN = 4 * 60;

function rfcToLocalInput(rfc: string | null): string {
  if (!rfc) return "";
  const d = new Date(rfc);
  if (Number.isNaN(d.getTime())) return "";
  // shift UTC instant into Baku wall-clock
  const shifted = new Date(d.getTime() + BAKU_OFFSET_MIN * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function localInputToRfc(value: string): string | null {
  if (!value) return null;
  // value is Baku wall-clock; convert back to UTC instant
  const asUtc = new Date(`${value}:00Z`).getTime();
  const utc = new Date(asUtc - BAKU_OFFSET_MIN * 60_000);
  return utc.toISOString();
}

/**
 * Full Event create/edit form (CONTRACT §6.4, §4.4).
 * Wrapped by the tour-detail screen inside a BottomSheetForm (sheet/dialog).
 * Submits a normalized CreateEventRequest (also valid for PATCH).
 */
export function EventForm({
  event,
  defaultDate,
  formId,
  submitting,
  onSubmit,
}: EventFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: event?.title ?? "",
      type: event?.type ?? "other",
      date: event?.date ?? defaultDate ?? "",
      time: event?.time ?? "",
      location: event?.location ?? "",
      participants: event?.participants ?? "",
      phone: event?.phone ?? "",
      price: event?.price != null ? String(event.price) : "",
      currency: event?.currency ?? "AZN",
      payment_status: event?.payment_status ?? "",
      status: event?.status ?? "planned",
      reminder_time: rfcToLocalInput(event?.reminder_time ?? null),
      attachment: event?.attachment ?? "",
      notes: event?.notes ?? "",
    },
  });

  // Keep form in sync when switching between create/edit targets.
  useEffect(() => {
    reset({
      title: event?.title ?? "",
      type: event?.type ?? "other",
      date: event?.date ?? defaultDate ?? "",
      time: event?.time ?? "",
      location: event?.location ?? "",
      participants: event?.participants ?? "",
      phone: event?.phone ?? "",
      price: event?.price != null ? String(event.price) : "",
      currency: event?.currency ?? "AZN",
      payment_status: event?.payment_status ?? "",
      status: event?.status ?? "planned",
      reminder_time: rfcToLocalInput(event?.reminder_time ?? null),
      attachment: event?.attachment ?? "",
      notes: event?.notes ?? "",
    });
  }, [event, defaultDate, reset]);

  const submit = handleSubmit((values) => {
    const trimmed = (s?: string) => {
      const v = s?.trim();
      return v ? v : null;
    };
    const priceStr = values.price?.trim().replace(",", ".");
    const body: CreateEventRequest = {
      title: values.title.trim(),
      type: values.type,
      date: values.date,
      time: trimmed(values.time),
      location: trimmed(values.location),
      participants: trimmed(values.participants),
      phone: trimmed(values.phone),
      price: priceStr ? Number(priceStr) : null,
      currency: priceStr ? values.currency || null : null,
      payment_status: (values.payment_status || null) as PaymentStatus | null,
      reminder_time: localInputToRfc(values.reminder_time ?? ""),
      attachment: trimmed(values.attachment),
      notes: trimmed(values.notes),
      status: values.status,
    };
    onSubmit(body);
  });

  return (
    <form
      id={formId}
      onSubmit={submit}
      className="max-h-[min(70vh,640px)] space-y-4 overflow-y-auto px-0.5 py-1 md:max-h-[64vh]"
    >
      {/* Title */}
      <Field label={az.field.title} error={errors.title?.message}>
        <Input
          autoFocus
          placeholder={az.field.title}
          aria-invalid={!!errors.title}
          {...register("title")}
        />
      </Field>

      {/* Type + Status */}
      <div className="grid grid-cols-2 gap-3">
        <Field label={az.field.type}>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((tpe) => {
                    const Icon = EVENT_TYPE_ICON[tpe];
                    return (
                      <SelectItem key={tpe} value={tpe}>
                        <span className="flex items-center gap-2">
                          <Icon
                            className="size-4"
                            style={{ color: eventMeta(tpe).color }}
                          />
                          {az.eventType[tpe]}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field label={az.field.status}>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {az.eventStatus[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <Field label={az.field.date} error={errors.date?.message}>
          <Controller
            control={control}
            name="date"
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                aria-invalid={!!errors.date}
              />
            )}
          />
        </Field>
        <Field label={az.field.time} optional error={errors.time?.message}>
          <Input type="time" aria-invalid={!!errors.time} {...register("time")} />
        </Field>
      </div>

      {/* Location */}
      <Field label={az.field.location} optional>
        <Input placeholder={az.field.location} {...register("location")} />
      </Field>

      {/* Participants */}
      <Field label={az.field.participants} optional>
        <Input
          placeholder={az.event.form.participants_placeholder}
          {...register("participants")}
        />
      </Field>

      {/* Phone */}
      <Field label={az.field.phone} optional>
        <Input
          type="tel"
          inputMode="tel"
          placeholder="+994 50 123 45 67"
          {...register("phone")}
        />
      </Field>

      {/* Price + Currency */}
      <div className="grid grid-cols-[1fr_8rem] gap-3">
        <Field label={az.field.price} optional error={errors.price?.message}>
          <Input
            inputMode="decimal"
            placeholder="0"
            aria-invalid={!!errors.price}
            {...register("price")}
          />
        </Field>
        <Field label={az.field.currency} optional>
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      {/* Payment status */}
      <Field label={az.field.payment_status} optional>
        <Controller
          control={control}
          name="payment_status"
          render={({ field }) => (
            <Select
              value={field.value || "__none"}
              onValueChange={(v) => field.onChange(v === "__none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">{az.event.form.none_payment}</SelectItem>
                {PAYMENT_STATUSES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {az.payment[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      {/* Reminder time */}
      <Field label={az.field.reminder_time} optional>
        <Controller
          control={control}
          name="reminder_time"
          render={({ field }) => (
            <DateTimePicker
              value={field.value}
              onChange={field.onChange}
              placeholder={az.event.form.reminder_hint}
            />
          )}
        />
      </Field>

      {/* Attachment */}
      <Field label={az.field.attachment} optional>
        <Input
          type="url"
          inputMode="url"
          placeholder={az.event.form.attachment_placeholder}
          {...register("attachment")}
        />
      </Field>

      {/* Notes */}
      <Field label={az.field.notes} optional>
        <Textarea placeholder={az.field.notes} rows={3} {...register("notes")} />
      </Field>
    </form>
  );
}

/* ─── Small field wrapper ───────────────────────────────────────── */
function Field({
  label,
  optional,
  error,
  children,
  className,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label optional={optional}>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

/** Convenience footer buttons for the form (used by the screen). */
export function EventFormFooter({
  formId,
  submitting,
  onCancel,
}: {
  formId: string;
  submitting?: boolean;
  onCancel: () => void;
}) {
  return (
    <>
      <Button variant="secondary" type="button" onClick={onCancel} disabled={submitting}>
        {az.action.cancel}
      </Button>
      <Button type="submit" form={formId} loading={submitting}>
        {az.action.save}
      </Button>
    </>
  );
}
