"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import { cn } from "@/lib/utils/cn";

export interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Render the body inside a padded glassy card (for list-style sections). */
  bare?: boolean;
}

/**
 * Dashboard section: a serif section header underscored by a hairline rule,
 * then either a bare body (grids of cards) or a glassy card body for lists.
 */
export function SectionCard({
  title,
  icon,
  action,
  children,
  className,
  bare,
}: SectionCardProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="border-b border-border/70 pb-2.5">
        <SectionHeader title={title} icon={icon} action={action} />
      </div>
      {bare ? children : <Card className="glass p-5">{children}</Card>}
    </section>
  );
}
