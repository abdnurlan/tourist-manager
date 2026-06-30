"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Compass } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

/** Centered, friendly empty state (CONTRACT §11.8). Strings come from §9.8. */
export function EmptyState({
  icon: Icon = Compass,
  title,
  subtitle,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6" : "py-16",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center",
          compact ? "mb-2.5 size-11" : "mb-5 size-16",
        )}
      >
        {/* faint compass-rose ring backdrop — full size only */}
        {!compact && (
          <>
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border border-dashed border-border"
            />
            <span
              aria-hidden
              className="absolute inset-2 rounded-full border border-border/70"
            />
          </>
        )}
        <span
          className={cn(
            "relative flex items-center justify-center rounded-full bg-accent-subtle text-accent",
            compact ? "size-11" : "size-11",
          )}
        >
          <Icon className={compact ? "size-5" : "size-6"} strokeWidth={1.75} />
        </span>
      </div>
      <h3
        className={cn(
          "font-display font-semibold text-foreground",
          compact ? "text-sm" : "text-h3",
        )}
      >
        {title}
      </h3>
      {subtitle && (
        <p
          className={cn(
            "mt-1.5 max-w-sm text-muted-foreground",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {subtitle}
        </p>
      )}
      {action && <div className={compact ? "mt-3" : "mt-5"}>{action}</div>}
    </motion.div>
  );
}
