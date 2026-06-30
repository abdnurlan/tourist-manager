import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned actions (primary buttons, filters). */
  actions?: ReactNode;
  className?: string;
}

/** Large in-content page header (below the glass Topbar). */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 pb-2 pt-6 md:flex-row md:items-end md:justify-between md:px-8 md:pt-8",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-display text-h1 font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-body text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/** Standard content padding wrapper for page bodies. */
export function PageBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1200px] px-4 py-4 md:px-8 md:py-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
