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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";
import type { Tour, TourStatus, UpdateTourRequest } from "@/lib/types";

const FORM_ID = "tour-edit-form";
const TOUR_STATUSES: TourStatus[] = ["planned", "active", "completed", "cancelled"];

const schema = z
  .object({
    title: z.string().trim().min(1, { message: az.validation.title_required }),
    start_date: z
      .string()
      .min(1, { message: az.validation.start_required })
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: az.validation.invalid_date }),
    end_date: z
      .string()
      .min(1, { message: az.validation.end_required })
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: az.validation.invalid_date }),
    status: z.enum(["planned", "active", "completed", "cancelled"]),
    description: z.string().optional(),
  })
  .refine((v) => v.end_date >= v.start_date, {
    message: az.validation.end_after_start,
    path: ["end_date"],
  });

type Values = z.infer<typeof schema>;

export interface TourEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tour: Tour;
  submitting?: boolean;
  onSubmit: (body: UpdateTourRequest) => void;
}

/** Compact tour edit (title / dates / status / description). */
export function TourEditSheet({
  open,
  onOpenChange,
  tour,
  submitting,
  onSubmit,
}: TourEditSheetProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: tour.title,
      start_date: tour.start_date,
      end_date: tour.end_date,
      status: tour.status,
      description: tour.description ?? "",
    },
  });

  useEffect(() => {
    reset({
      title: tour.title,
      start_date: tour.start_date,
      end_date: tour.end_date,
      status: tour.status,
      description: tour.description ?? "",
    });
  }, [tour, reset]);

  // Auto-fill end date to match a newly picked start when end is empty/earlier
  // (1-day tour = same start/end with a single tap).
  const handleStartChange = (iso: string) => {
    setValue("start_date", iso, { shouldValidate: true, shouldDirty: true });
    const end = getValues("end_date");
    if (!end || end < iso) {
      setValue("end_date", iso, { shouldValidate: true, shouldDirty: true });
    }
  };

  const submit = handleSubmit((v) => {
    onSubmit({
      title: v.title.trim(),
      start_date: v.start_date,
      end_date: v.end_date,
      status: v.status,
      description: v.description?.trim() ? v.description.trim() : null,
    });
  });

  return (
    <BottomSheetForm
      open={open}
      onOpenChange={onOpenChange}
      title={az.screen.tour_detail}
      className="sm:max-w-lg"
      footer={
        <>
          <Button
            variant="secondary"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {az.action.cancel}
          </Button>
          <Button type="submit" form={FORM_ID} loading={submitting}>
            {az.action.save}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} className="space-y-4 py-1">
        <Field label={az.field.title} error={errors.title?.message}>
          <Input autoFocus aria-invalid={!!errors.title} {...register("title")} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={az.field.start_date} error={errors.start_date?.message}>
            <Controller
              control={control}
              name="start_date"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={handleStartChange}
                  aria-invalid={!!errors.start_date}
                />
              )}
            />
          </Field>
          <Field label={az.field.end_date} error={errors.end_date?.message}>
            <Controller
              control={control}
              name="end_date"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  min={watch("start_date") || undefined}
                  aria-invalid={!!errors.end_date}
                />
              )}
            />
          </Field>
        </div>

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
                  {TOUR_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {az.tourStatus[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field label={az.field.description} optional>
          <Textarea rows={3} {...register("description")} />
        </Field>
      </form>
    </BottomSheetForm>
  );
}

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
