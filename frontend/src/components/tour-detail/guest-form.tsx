"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";
import type { Guest, CreateGuestRequest } from "@/lib/types";

const schema = z.object({
  full_name: z.string().trim().min(1, { message: az.guest.name_required }),
  phone: z.string().optional(),
  passport: z.string().optional(),
  nationality: z.string().optional(),
  notes: z.string().optional(),
});

type GuestFormValues = z.infer<typeof schema>;

export interface GuestFormProps {
  guest?: Guest;
  formId: string;
  onSubmit: (body: CreateGuestRequest) => void;
}

export function GuestForm({ guest, formId, onSubmit }: GuestFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuestFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: guest?.full_name ?? "",
      phone: guest?.phone ?? "",
      passport: guest?.passport ?? "",
      nationality: guest?.nationality ?? "",
      notes: guest?.notes ?? "",
    },
  });

  useEffect(() => {
    reset({
      full_name: guest?.full_name ?? "",
      phone: guest?.phone ?? "",
      passport: guest?.passport ?? "",
      nationality: guest?.nationality ?? "",
      notes: guest?.notes ?? "",
    });
  }, [guest, reset]);

  const submit = handleSubmit((v) => {
    const t = (s?: string) => {
      const x = s?.trim();
      return x ? x : null;
    };
    onSubmit({
      full_name: v.full_name.trim(),
      phone: t(v.phone),
      passport: t(v.passport),
      nationality: t(v.nationality),
      notes: t(v.notes),
    });
  });

  return (
    <form id={formId} onSubmit={submit} className="space-y-4 px-0.5 py-1">
      <GField label={az.field.full_name} error={errors.full_name?.message}>
        <Input autoFocus placeholder={az.field.full_name} {...register("full_name")} />
      </GField>
      <GField label={az.field.phone} optional>
        <Input type="tel" inputMode="tel" placeholder="+994 50 123 45 67" {...register("phone")} />
      </GField>
      <div className="grid grid-cols-2 gap-3">
        <GField label={az.field.passport} optional>
          <Input placeholder="AA1234567" {...register("passport")} />
        </GField>
        <GField label={az.field.nationality} optional>
          <Input placeholder="Azərbaycan" {...register("nationality")} />
        </GField>
      </div>
      <GField label={az.field.notes} optional>
        <Textarea rows={2} placeholder={az.field.notes} {...register("notes")} />
      </GField>
    </form>
  );
}

function GField({
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

/** Footer buttons for the guest form. */
export function GuestFormFooter({
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
