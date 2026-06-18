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
        compact ? "py-10" : "py-16",
        className,
      )}
    >
      <div className="relative mb-5 flex size-16 items-center justify-center">
        {/* faint compass-rose ring backdrop */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border border-dashed border-border"
        />
        <span
          aria-hidden
          className="absolute inset-2 rounded-full border border-border/70"
        />
        <span className="relative flex size-11 items-center justify-center rounded-full bg-accent-subtle text-accent">
          <Icon className="size-6" strokeWidth={1.75} />
        </span>
      </div>
      <h3 className="font-display text-h3 font-semibold text-foreground">{title}</h3>
      {subtitle && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{subtitle}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
