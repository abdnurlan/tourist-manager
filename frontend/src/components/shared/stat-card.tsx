"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

export interface StatCardProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  /** Accent color tone of the icon chip. */
  tone?: "accent" | "terracotta" | "success" | "warning" | "info";
  hint?: string;
  loading?: boolean;
  className?: string;
}

const TONE: Record<NonNullable<StatCardProps["tone"]>, string> = {
  accent: "bg-accent-subtle text-accent",
  terracotta: "bg-terracotta-subtle text-terracotta",
  success: "bg-success/12 text-success",
  warning: "bg-warning/12 text-warning",
  info: "bg-info/12 text-info",
};

/** Dashboard metric card with a big Fraunces lining numeral. */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "accent",
  hint,
  loading,
  className,
}: StatCardProps) {
  return (
    <Card interactive className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-9 w-14" />
          ) : (
            <motion.p
              key={String(value)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="mt-1 font-display text-[2rem] font-semibold leading-none tracking-tight text-foreground tabular-nums"
            >
              {value}
            </motion.p>
          )}
          {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-md",
              TONE[tone],
            )}
          >
            <Icon className="size-5" />
          </span>
        )}
      </div>
    </Card>
  );
}
