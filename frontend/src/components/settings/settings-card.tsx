"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export interface SettingsCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

/** Section card used across the Settings screen — icon header + content body. */
export function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: SettingsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex items-start gap-3.5 p-5 md:p-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-subtle text-accent">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-h3 font-semibold leading-tight tracking-tight text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="px-5 pb-5 md:px-6 md:pb-6">{children}</div>}
    </Card>
  );
}

/** A labelled key/value row inside a settings card. */
export function SettingsRow({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-t border-border py-3.5 first:border-t-0 first:pt-0",
        className,
      )}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right text-sm font-medium text-foreground">
        {children}
      </span>
    </div>
  );
}
