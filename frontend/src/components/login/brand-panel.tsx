"use client";

import { motion } from "framer-motion";
import { MapPin, Plane, Ticket } from "lucide-react";

import { BrandMark } from "@/components/login/brand-mark";
import { az } from "@/lib/i18n/az";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Atmospheric brand panel for the immersive editorial login.
 * cream→navy wash + topo contour texture + M4STrip logo brand mark +
 * wordmark + warm tagline + a faint "sample itinerary" motif.
 *
 * Desktop: occupies the left split. Mobile: sits on top as a shorter
 * banner. Layout/sizing is owned by the parent page.
 */
export function BrandPanel() {
  return (
    <div className="relative isolate flex h-full flex-col justify-between overflow-hidden">
      {/* cream → navy subtle gradient wash */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[linear-gradient(155deg,var(--surface),var(--accent-subtle)_58%,var(--accent-subtle))]"
      />
      {/* deep navy bloom anchored bottom-left */}
      <motion.div
        aria-hidden
        className="absolute -bottom-32 -left-24 -z-10 size-[460px] rounded-full bg-accent/15 blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* topo contour texture, scoped to this panel */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[url('/topo.svg')] bg-[length:720px_720px] opacity-[0.07] [mask-image:linear-gradient(160deg,black,transparent_85%)]"
      />

      {/* ── Top: brand lockup ── */}
      <div className="relative flex flex-col gap-6 p-8 sm:p-10 lg:p-12">
        <div className="flex items-center gap-4">
          <BrandMark className="size-14 sm:size-16" />
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
          >
            <p className="stamp text-[0.65rem] text-accent">{az.screen.login}</p>
            <h1 className="font-display text-[1.75rem] font-semibold leading-none tracking-tight text-foreground sm:text-h1">
              {az.app.name}
            </h1>
          </motion.div>
        </div>

        {/* warm editorial tagline — only on the roomy desktop panel */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
          className="hidden max-w-sm font-display text-h2 font-normal italic leading-snug text-muted-foreground lg:block"
        >
          {az.app.tagline}
        </motion.p>
      </div>

      {/* ── Bottom: faint sample-itinerary ticket motif (desktop only) ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EASE, delay: 0.32 }}
        className="relative hidden p-8 sm:p-10 lg:block lg:p-12"
      >
        <div className="ticket max-w-sm rounded-xl border border-border/70 bg-surface/70 p-5 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="stamp text-[0.65rem] text-accent">{az.app.name}</span>
            <Ticket className="size-4 text-muted-foreground" />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent-subtle text-accent">
              <Plane className="size-4" strokeWidth={1.75} />
            </span>
            <div className="flex-1">
              <div className="font-display text-h3 font-semibold leading-none tracking-tight text-foreground">
                BAK
                <span className="px-2 text-muted-foreground">→</span>
                IST
              </div>
            </div>
            <span className="flex size-9 items-center justify-center rounded-lg bg-terracotta-subtle text-terracotta">
              <MapPin className="size-4" strokeWidth={1.75} />
            </span>
          </div>
          {/* faint route line */}
          <div
            aria-hidden
            className="mt-4 h-px w-full bg-[repeating-linear-gradient(90deg,var(--border)_0_6px,transparent_6px_12px)]"
          />
        </div>
      </motion.div>
    </div>
  );
}
