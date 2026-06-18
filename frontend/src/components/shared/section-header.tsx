import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned controls (e.g. "Hamısına bax", filter button). */
  action?: ReactNode;
  /** Optional small leading icon node. */
  icon?: ReactNode;
  className?: string;
  /** "h2" (section, default) or "h1" (page title). */
  as?: "h1" | "h2";
}

/** Consistent section / page header with optional action on the right. */
export function SectionHeader({
  title,
  subtitle,
  action,
  icon,
  className,
  as = "h2",
}: SectionHeaderProps) {
  const Heading = as;
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
        <div className="min-w-0">
          <Heading
            className={cn(
              "truncate font-display font-semibold tracking-tight text-foreground",
              as === "h1" ? "text-h1" : "text-h2",
            )}
          >
            {title}
          </Heading>
          {subtitle && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
