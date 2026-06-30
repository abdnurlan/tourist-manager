"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils/cn";

export interface BrandMarkProps {
  className?: string;
}

/**
 * Animated brand mark for the login screen — the M4STrip emblem with a soft
 * breathing halo behind it. Part of the product identity.
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <motion.div
      initial={{ scale: 0.86, opacity: 0, y: 6 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative flex size-16 items-center justify-center",
        className,
      )}
    >
      <Logo size={160} priority className="size-full drop-shadow-sm" />

      {/* breathing halo */}
      <motion.span
        aria-hidden
        className="absolute -inset-2 rounded-full border border-accent/25"
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.05, 1] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* soft glow */}
      <span
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-full bg-accent/15 blur-2xl"
      />
    </motion.div>
  );
}
