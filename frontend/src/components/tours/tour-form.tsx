"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { BottomSheetForm } from "@/components/shared/bottom-sheet-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Tour, TourStatus, CreateTourRequest } from "@/lib/types";

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

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TourFormValues>({
    resolver: zodResolver(tourSchema),
    defaultValues: defaultsFor(tour),
  });

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
            <Input
              id="tour-start"
              type="date"
              aria-invalid={Boolean(errors.start_date)}
              {...register("start_date")}
            />
            {errors.start_date && (
              <p className="text-xs text-danger">{errors.start_date.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tour-end">{az.field.end_date}</Label>
            <Input
              id="tour-end"
              type="date"
              aria-invalid={Boolean(errors.end_date)}
              {...register("end_date")}
            />
            {errors.end_date && (
              <p className="text-xs text-danger">{errors.end_date.message}</p>
            )}
          </div>
        </div>

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
