"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { BottomSheetForm } from "@/components/shared/bottom-sheet-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { az, tourStatusLabel } from "@/lib/i18n/az";
import { useCatalogTours } from "@/lib/hooks/use-catalog-tours";
import type { Tour, TourStatus, CreateTourRequest } from "@/lib/types";

const NONE = "__none__"; // "kataloqsuz" sentinel for the Select (empty value not allowed)

function catalogTitle(m: Record<string, string>): string {
  return m.az || m.en || Object.values(m)[0] || "—";
}

const TOUR_STATUSES: TourStatus[] = [
  "planned",
  "active",
  "completed",
  "cancelled",
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const tourSchema = z
  .object({
    title: z.string().trim().min(1, { message: az.validation.title_required }),
    start_date: z
      .string()
      .min(1, { message: az.validation.start_required })
      .regex(ISO_DATE, { message: az.validation.invalid_date }),
    end_date: z
      .string()
      .min(1, { message: az.validation.end_required })
      .regex(ISO_DATE, { message: az.validation.invalid_date }),
    description: z.string().trim().optional(),
    status: z.enum(["planned", "active", "completed", "cancelled"]),
    catalog_tour_id: z.string(), // NONE sentinel or a catalog id
    capacity: z.coerce.number().int().min(1, { message: az.validation.capacity_min }),
  })
  .refine((v) => v.end_date >= v.start_date, {
    path: ["end_date"],
    message: az.validation.end_after_start,
  });

export type TourFormValues = z.infer<typeof tourSchema>;

export interface TourFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided the form runs in edit mode; otherwise it creates. */
  tour?: Tour | null;
  /** Receives a normalized payload ready for create/update mutations. */
  onSubmit: (values: CreateTourRequest) => void;
  /** True while the mutation is in flight (disables actions, shows spinner). */
  submitting?: boolean;
}

function defaultsFor(tour?: Tour | null): TourFormValues {
  return {
    title: tour?.title ?? "",
    start_date: tour?.start_date ?? "",
    end_date: tour?.end_date ?? "",
    description: tour?.description ?? "",
    status: tour?.status ?? "planned",
    catalog_tour_id: tour?.catalog_tour_id ?? NONE,
    capacity: tour?.capacity ?? 12,
  };
}

/**
 * Reusable create/edit Tour form.
 * Rendered inside the shared BottomSheetForm (Sheet on mobile / Dialog on desktop).
 * Validation (incl. end_date >= start_date) via zod + react-hook-form.
 */
export function TourForm({
  open,
  onOpenChange,
  tour,
  onSubmit,
  submitting,
}: TourFormProps) {
  const isEdit = Boolean(tour);
  const { data: catalogTours = [] } = useCatalogTours();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<TourFormValues>({
    resolver: zodResolver(tourSchema),
    defaultValues: defaultsFor(tour),
  });

  const startDate = watch("start_date");
  const selectedCatalogId = watch("catalog_tour_id");
  const selectedCatalog = catalogTours.find((c) => c.id === selectedCatalogId);

  // Picking a start date auto-fills the end date to the same day when end is
  // empty or now earlier — so a 1-day tour just needs one tap (start = end),
  // while multi-day tours can still extend the end afterwards.
  const handleStartChange = (iso: string) => {
    setValue("start_date", iso, { shouldValidate: true, shouldDirty: true });
    const end = getValues("end_date");
    if (!end || end < iso) {
      setValue("end_date", iso, { shouldValidate: true, shouldDirty: true });
    }
  };

  // Re-seed the form whenever it (re)opens or the target tour changes.
  useEffect(() => {
    if (open) reset(defaultsFor(tour));
  }, [open, tour, reset]);

  const submit = handleSubmit((values) => {
    const description = values.description?.trim();
    onSubmit({
      title: values.title.trim(),
      start_date: values.start_date,
      end_date: values.end_date,
      description: description ? description : null,
      status: values.status,
      catalog_tour_id: values.catalog_tour_id === NONE ? null : values.catalog_tour_id,
      capacity: values.capacity,
    });
  });

  return (
    <BottomSheetForm
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? az.action.edit : az.screen.tour_new}
      description={az.app.tagline}
      className="sm:max-w-lg"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
            className="max-md:w-full"
          >
            {az.action.cancel}
          </Button>
          <Button
            type="submit"
            form="tour-form"
            loading={submitting}
            className="max-md:w-full"
          >
            {isEdit ? az.action.save : az.action.create}
          </Button>
        </>
      }
    >
      <form id="tour-form" onSubmit={submit} className="space-y-4 pt-1">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="tour-title">{az.field.title}</Label>
          <Input
            id="tour-title"
            autoFocus
            placeholder={az.field.title}
            aria-invalid={Boolean(errors.title)}
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-danger">{errors.title.message}</p>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tour-start">{az.field.start_date}</Label>
            <Controller
              control={control}
              name="start_date"
              render={({ field }) => (
                <DatePicker
                  id="tour-start"
                  value={field.value}
                  onChange={handleStartChange}
                  aria-invalid={Boolean(errors.start_date)}
                />
              )}
            />
            {errors.start_date && (
              <p className="text-xs text-danger">{errors.start_date.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tour-end">{az.field.end_date}</Label>
            <Controller
              control={control}
              name="end_date"
              render={({ field }) => (
                <DatePicker
                  id="tour-end"
                  value={field.value}
                  onChange={field.onChange}
                  min={startDate || undefined}
                  aria-invalid={Boolean(errors.end_date)}
                />
              )}
            />
            {errors.end_date && (
              <p className="text-xs text-danger">{errors.end_date.message}</p>
            )}
          </div>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          Eyni günü seçsəniz — 1 günlük tur olur.
        </p>

        {/* Status */}
        <div className="space-y-1.5">
          <Label>{az.field.status}</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOUR_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {tourStatusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Catalog tour link + capacity */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{az.field.catalog_tour}</Label>
            <Controller
              control={control}
              name="catalog_tour_id"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{az.field.catalog_none}</SelectItem>
                    {catalogTours.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {catalogTitle(c.title)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {selectedCatalog && (
              <p className="text-xs text-muted-foreground">
                {az.field.inherited_price}: <span className="font-medium text-accent">{selectedCatalog.price} ₼</span>
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tour-capacity">{az.field.capacity}</Label>
            <Input
              id="tour-capacity"
              type="number"
              min={1}
              aria-invalid={Boolean(errors.capacity)}
              {...register("capacity")}
            />
            {errors.capacity && (
              <p className="text-xs text-danger">{errors.capacity.message}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="tour-desc" optional>
            {az.field.description}
          </Label>
          <Textarea
            id="tour-desc"
            placeholder={az.field.description}
            {...register("description")}
          />
        </div>
      </form>
    </BottomSheetForm>
  );
}
