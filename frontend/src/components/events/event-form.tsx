"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
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
import { useTourGuests } from "@/lib/hooks/use-guests";
import { TYPE_FIELDS } from "./type-fields-config";
import type {
  Event,
  EventType,
  EventStatus,
  PaymentStatus,
  CreateEventRequest,
} from "@/lib/types";

/** Safely parse a details value that may already be an object or a JSON string. */
function parseDetails(d: Event["details"] | undefined): Record<string, string> {
  if (!d) return {};
  let obj: Record<string, unknown>;
  if (typeof d === "string") {
    try {
      obj = JSON.parse(d);
    } catch {
      return {};
    }
  } else {
    obj = d as Record<string, unknown>;
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) out[k] = v == null ? "" : String(v);
  return out;
}

// Formada göstərilən tip seçimləri. "tour", "flight", "note" qəsdən
// çıxarılıb (istifadəçi istəyi) — schema/backend enum hələ də onları qəbul
// edir, ona görə köhnə bu tipli tədbirlər redaktədə problemsiz açılır.
const EVENT_TYPES: EventType[] = ["transfer", "hotel", "restaurant", "other"];
const EVENT_STATUSES: EventStatus[] = ["planned", "done", "cancelled"];
const PAYMENT_STATUSES: PaymentStatus[] = ["unpaid", "partial", "paid"];
const CURRENCIES = ["AZN", "USD", "EUR", "GBP", "TRY", "RUB"];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/* ─── Xatırlatma: nisbi seçimlər (mütləq datetime əvəzinə) ───────────
   Bələdçi üçün "1 saat əvvəl" "1 gün əvvəl"i başa düşmək asandır.
   Dəyər = tədbir vaxtından neçə dəqiqə əvvəl (0 = tam vaxtında). */
const REMINDER_OPTIONS: { value: string; labelKey: keyof typeof az.event.form }[] = [
  { value: "", labelKey: "reminder_none" },
  { value: "0", labelKey: "reminder_at_time" },
  { value: "10", labelKey: "reminder_10m" },
  { value: "60", labelKey: "reminder_1h" },
  { value: "180", labelKey: "reminder_3h" },
  { value: "1440", labelKey: "reminder_1d" },
];

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
  reminder_offset: z.string().optional(), // "" | "0" | "10" | "60" | "180" | "1440" (dəqiqə əvvəl)
  attachment: z.string().optional(),
  notes: z.string().optional(),
});

export type EventFormValues = z.infer<typeof schema>;

export interface EventFormProps {
  /** Provide for edit; omit for create. */
  event?: Event;
  /** Default date (YYYY-MM-DD) prefilled on create — usually the tapped day. */
  defaultDate?: string;
  /** Default type on create — set by the per-type "add" button. */
  defaultType?: EventType;
  /** Parent tour id — needed to load the guest list for the picker. */
  tourId: string;
  formId: string;
  submitting?: boolean;
  onSubmit: (body: CreateEventRequest) => void;
}

/* ─── Xatırlatma çevrilməsi (nisbi <-> mütləq) ───────────────────────
   Tədbirin öz tarix+vaxtı bazadır. Xatırlatma = bazadan N dəqiqə əvvəl.
   Bakı vaxtı (UTC+4) sabit ofset kimi götürülür (backend UTC saxlayır). */
const BAKU_OFFSET_MIN = 4 * 60;

/** Tədbirin date (YYYY-MM-DD) + time (HH:mm) → UTC instant (ms). */
function eventBaseUtcMs(date: string, time?: string): number | null {
  if (!date) return null;
  const hm = time && TIME_RE.test(time) ? time : "00:00";
  const asIfUtc = new Date(`${date}T${hm}:00Z`).getTime();
  if (Number.isNaN(asIfUtc)) return null;
  // Bakı divar-saatını UTC instant-a çevir.
  return asIfUtc - BAKU_OFFSET_MIN * 60_000;
}

/** Nisbi ofset (dəqiqə) + tədbir bazası → mütləq RFC3339 (UTC) və ya null. */
function offsetToRfc(offset: string, date: string, time?: string): string | null {
  if (offset === "") return null;
  const base = eventBaseUtcMs(date, time);
  if (base == null) return null;
  const minutes = Number(offset);
  if (Number.isNaN(minutes)) return null;
  return new Date(base - minutes * 60_000).toISOString();
}

/** Mövcud mütləq reminder_time + tədbir bazası → ən yaxın nisbi ofset seçimi.
    Redaktə zamanı köhnə dəyəri dropdown-a uyğunlaşdırmaq üçün. */
function rfcToOffset(rfc: string | null, date: string, time?: string): string {
  if (!rfc) return "";
  const reminder = new Date(rfc).getTime();
  const base = eventBaseUtcMs(date, time);
  if (Number.isNaN(reminder) || base == null) return "";
  const diffMin = Math.round((base - reminder) / 60_000);
  // Ən yaxın mövcud seçimə yuvarlaqlaşdır (0/10/60/180/1440).
  const known = [0, 10, 60, 180, 1440];
  let best = known[0];
  for (const k of known) {
    if (Math.abs(k - diffMin) < Math.abs(best - diffMin)) best = k;
  }
  return String(best);
}

/**
 * Full Event create/edit form (CONTRACT §6.4, §4.4).
 * Wrapped by the tour-detail screen inside a BottomSheetForm (sheet/dialog).
 * Submits a normalized CreateEventRequest (also valid for PATCH).
 */
export function EventForm({
  event,
  defaultDate,
  defaultType,
  tourId,
  formId,
  submitting,
  onSubmit,
}: EventFormProps) {
  const { data: tourGuests = [] } = useTourGuests(tourId);

  const defaults = useMemo<EventFormValues>(
    () => ({
      title: event?.title ?? "",
      type: event?.type ?? defaultType ?? "other",
      date: event?.date ?? defaultDate ?? "",
      time: event?.time ?? "",
      location: event?.location ?? "",
      participants: event?.participants ?? "",
      phone: event?.phone ?? "",
      price: event?.price != null ? String(event.price) : "",
      currency: event?.currency ?? "AZN",
      payment_status: event?.payment_status ?? "",
      status: event?.status ?? "planned",
      reminder_offset: rfcToOffset(
        event?.reminder_time ?? null,
        event?.date ?? defaultDate ?? "",
        event?.time ?? undefined,
      ),
      attachment: event?.attachment ?? "",
      notes: event?.notes ?? "",
    }),
    [event, defaultDate, defaultType],
  );

  // Tipə xas sahələr (details) və qonaq seçimi form-dan kənar state-də saxlanır.
  const initialDetails = useMemo(() => parseDetails(event?.details), [event]);
  const initialGuestIds = useMemo(
    () => event?.guests?.map((g) => g.id) ?? [],
    [event],
  );
  const [details, setDetails] = useState<Record<string, string>>(initialDetails);
  const [guestIds, setGuestIds] = useState<string[]>(initialGuestIds);

  // Redaktədə gizli sahələrdə data varsa, detal bloku avtomatik açıq gəlsin —
  // yoxsa istifadəçi mövcud məlumatı görməz.
  const hasHiddenData = useMemo(
    () =>
      Boolean(
        defaults.location ||
          defaults.participants ||
          defaults.phone ||
          defaults.price ||
          defaults.payment_status ||
          defaults.reminder_offset ||
          defaults.attachment ||
          defaults.notes ||
          initialGuestIds.length > 0,
      ),
    [defaults, initialGuestIds],
  );

  const [expanded, setExpanded] = useState(hasHiddenData);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  // Keep form in sync when switching between create/edit targets.
  useEffect(() => {
    reset(defaults);
    setDetails(initialDetails);
    setGuestIds(initialGuestIds);
    setExpanded(hasHiddenData);
  }, [defaults, hasHiddenData, initialDetails, initialGuestIds, reset]);

  // Xatırlatma tədbir tarixindən hesablandığı üçün tarix seçilməyibsə söndürülür.
  const reminderDisabled = !watch("date");

  // Seçilmiş tipə uyğun sahələr (haradan/haraya, check-in, ...).
  const watchedType = watch("type");
  const typeFields = TYPE_FIELDS[watchedType] ?? [];

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
      reminder_time: offsetToRfc(values.reminder_offset ?? "", values.date, values.time),
      attachment: trimmed(values.attachment),
      notes: trimmed(values.notes),
      details: Object.fromEntries(
        Object.entries(details)
          .map(([k, v]) => [k, v.trim()] as const)
          .filter(([, v]) => v !== ""),
      ),
      guest_ids: guestIds,
      status: values.status,
    };
    onSubmit(body);
  });

  return (
    <form
      id={formId}
      onSubmit={submit}
      className="space-y-4 px-0.5 py-1"
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

      {/* ── Tipə xas sahələr (transfer/otel/restoran) ── */}
      {typeFields.length > 0 && (
        <div className="space-y-4">
          {typeFields.map((f) => (
            <Field key={f.key} label={f.label} optional>
              <Input
                type={
                  f.kind === "number"
                    ? "number"
                    : f.kind === "date"
                      ? "date"
                      : f.kind === "time"
                        ? "time"
                        : f.kind === "tel"
                          ? "tel"
                          : "text"
                }
                inputMode={
                  f.kind === "number" ? "decimal" : f.kind === "tel" ? "tel" : undefined
                }
                placeholder={f.placeholder ?? f.label}
                value={details[f.key] ?? ""}
                onChange={(e) =>
                  setDetails((d) => ({ ...d, [f.key]: e.target.value }))
                }
              />
            </Field>
          ))}
        </div>
      )}

      {/* ── "Daha çox detal" açarı ──────────────────────────────────
          Default-da yalnız yuxarıdakı əsas sahələr görünür (başlıq, tip,
          status, tarix, vaxt) — bələdçi 5 saniyəyə tədbir əlavə edə bilir.
          Qalan detallar lazım olanda açılır ki, forma müştərini itirməsin. */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {expanded ? az.event.form.less_details : az.event.form.more_details}
        <ChevronDown
          className={cn(
            "size-4 transition-transform duration-200",
            expanded && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="event-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-6 pt-1">
              {/* ── Qrup: Qonaqlar (bu tədbirdə iştirak edənlər) ── */}
              <FieldGroup title={az.event.details.guests_label}>
                {tourGuests.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {az.event.details.no_guests}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tourGuests.map((g) => {
                      const on = guestIds.includes(g.id);
                      return (
                        <button
                          type="button"
                          key={g.id}
                          onClick={() =>
                            setGuestIds((ids) =>
                              on ? ids.filter((x) => x !== g.id) : [...ids, g.id],
                            )
                          }
                          className={cn(
                            "rounded-full border px-3 py-1 text-sm transition-colors",
                            on
                              ? "border-accent bg-accent text-accent-foreground"
                              : "border-border bg-surface text-foreground hover:border-accent",
                          )}
                        >
                          {g.full_name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </FieldGroup>

              {/* ── Qrup: Yer və əlaqə ── */}
              <FieldGroup title={az.event.form.group_place}>
                <Field label={az.field.location} optional>
                  <Input placeholder={az.field.location} {...register("location")} />
                </Field>
                <Field label={az.field.participants} optional>
                  <Input
                    placeholder={az.event.form.participants_placeholder}
                    {...register("participants")}
                  />
                </Field>
                <Field label={az.field.phone} optional>
                  <Input
                    type="tel"
                    inputMode="tel"
                    placeholder="+994 50 123 45 67"
                    {...register("phone")}
                  />
                </Field>
              </FieldGroup>

              {/* ── Qrup: Ödəniş ── */}
              <FieldGroup title={az.event.form.group_payment}>
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
                          <SelectItem value="__none">
                            {az.event.form.none_payment}
                          </SelectItem>
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
              </FieldGroup>

              {/* ── Qrup: Xatırlatma (nisbi) ── */}
              <FieldGroup title={az.event.form.group_reminder}>
                <Field
                  label={az.field.reminder_time}
                  optional
                  hint={reminderDisabled ? az.event.form.reminder_needs_time : undefined}
                >
                  <Controller
                    control={control}
                    name="reminder_offset"
                    render={({ field }) => (
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                        disabled={reminderDisabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={az.event.form.reminder_none} />
                        </SelectTrigger>
                        <SelectContent>
                          {REMINDER_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value || "none"} value={opt.value}>
                              {az.event.form[opt.labelKey]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </FieldGroup>

              {/* ── Qrup: Əlavə və qeydlər ── */}
              <FieldGroup title={az.event.form.group_extra}>
                <Field label={az.field.attachment} optional>
                  <Input
                    type="url"
                    inputMode="url"
                    placeholder={az.event.form.attachment_placeholder}
                    {...register("attachment")}
                  />
                </Field>
                <Field label={az.field.notes} optional>
                  <Textarea placeholder={az.field.notes} rows={3} {...register("notes")} />
                </Field>
              </FieldGroup>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

/* ─── Qrup başlığı + sahələr sarğısı ─────────────────────────────── */
function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

/* ─── Small field wrapper ───────────────────────────────────────── */
function Field({
  label,
  optional,
  error,
  hint,
  children,
  className,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label optional={optional}>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      {!error && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
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
