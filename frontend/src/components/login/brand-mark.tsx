"use client";

import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface BrandMarkProps {
  className?: string;
}

/**
 * Animated brand mark for the login screen — a deep-teal "field tile"
 * carrying the product compass mark, with a slow rotating needle and a
 * soft breathing halo. Part of the "Səyahət Jurnalı" identity.
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <motion.div
      initial={{ scale: 0.86, opacity: 0, y: 6 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-md ring-1 ring-inset ring-white/15",
        className,
      )}
    >
      {/* slow rotating compass */}
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        <Compass className="size-8" strokeWidth={1.75} />
      </motion.span>

      {/* breathing halo */}
      <motion.span
        aria-hidden
        className="absolute -inset-2 rounded-3xl border border-accent/30"
        animate={{ opacity: [0.35, 0.85, 0.35], scale: [1, 1.05, 1] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* soft glow */}
      <span
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-full bg-accent/20 blur-2xl"
      />
    </motion.div>
  );
}
