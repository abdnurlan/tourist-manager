"use client";

import { BottomSheetForm } from "@/components/shared/bottom-sheet-form";
import { GuestForm, GuestFormFooter } from "./guest-form";
import { az } from "@/lib/i18n/az";
import type { CreateGuestRequest, Guest } from "@/lib/types";

const FORM_ID = "guest-form";

export interface GuestFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest?: Guest;
  submitting?: boolean;
  onSubmit: (body: CreateGuestRequest) => void;
}

export function GuestFormSheet({
  open,
  onOpenChange,
  guest,
  submitting,
  onSubmit,
}: GuestFormSheetProps) {
  return (
    <BottomSheetForm
      open={open}
      onOpenChange={onOpenChange}
      title={guest ? az.guest.edit : az.guest.add}
      className="sm:max-w-md"
      footer={
        <GuestFormFooter
          formId={FORM_ID}
          submitting={submitting}
          onCancel={() => onOpenChange(false)}
        />
      }
    >
      <GuestForm formId={FORM_ID} guest={guest} onSubmit={onSubmit} />
    </BottomSheetForm>
  );
}
