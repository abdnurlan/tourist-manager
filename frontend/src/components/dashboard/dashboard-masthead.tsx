"use client";

import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { az } from "@/lib/i18n/az";
import { greeting } from "@/lib/utils/format";
import { formatDateWithWeekday, todayISO } from "@/lib/utils/date";

export interface DashboardMastheadProps {
  username?: string;
}

/**
 * Editorial "Səyahət Jurnalı" masthead: an uppercase dateline kicker, a large
 * Fraunces greeting, and the day's date as a serif lining-numeral dateline.
 * Replaces the plain PageHeader on the dashboard (desktop). Text stays AZ.
 */
export function DashboardMasthead({ username }: DashboardMastheadProps) {
  const today = todayISO();
  const dateline = formatDateWithWeekday(today);
  const hello = username ? `${greeting()}, ${username}` : greeting();

  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="max-md:hidden"
    >
      <div className="flex items-end justify-between gap-6 border-b border-border pb-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <Compass className="size-3.5 text-accent" strokeWidth={2} />
            {az.screen.dashboard}
          </p>
          <h1 className="mt-2 font-display text-display font-semibold tracking-tight text-foreground">
            {hello}
          </h1>
        </div>
        <p className="shrink-0 pb-1 font-display text-body tabular-nums text-muted-foreground">
          {dateline}
        </p>
      </div>
    </motion.header>
  );
}
