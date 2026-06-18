"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useIsDesktop } from "@/lib/hooks/use-media-query";

export interface BottomSheetFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Footer actions (buttons). Rendered below the body. */
  footer?: ReactNode;
  /** Max width on desktop dialog. */
  className?: string;
}

/**
 * Responsive create/edit container:
 *   - mobile → bottom Sheet (spring, drag-handle)
 *   - desktop → centered Dialog
 * Screen agents wrap their react-hook-form body in here.
 */
export function BottomSheetForm({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: BottomSheetFormProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={className}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          {children}
          {footer && <div className="flex justify-end gap-2 pt-2">{footer}</div>}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={className}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        {children}
        {footer && <div className="flex flex-col gap-2 pt-4">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
