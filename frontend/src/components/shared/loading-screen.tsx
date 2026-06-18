"use client";

import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";

export interface LoadingScreenProps {
  /** Cover the whole viewport (first load) vs fill its container. */
  fullscreen?: boolean;
  label?: string;
  className?: string;
}

/** Tasteful brand loading screen (CONTRACT §11.7). */
export function LoadingScreen({
  fullscreen = true,
  label = az.common.loading,
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 bg-background",
        fullscreen ? "fixed inset-0 z-[100]" : "min-h-[60vh] w-full",
        className,
      )}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md"
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <Compass className="size-8" strokeWidth={2} />
        </motion.span>
        {/* rotating dashed "compass rose" ring */}
        <motion.span
          className="absolute -inset-2.5 rounded-full border border-dashed border-accent/40"
          animate={{ rotate: -360 }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />
        <motion.span
          className="absolute -inset-2.5 rounded-full"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <div className="flex flex-col items-center gap-1.5">
        <p className="font-display text-h2 font-semibold italic tracking-tight text-foreground">
          {az.app.name}
        </p>
        <span
          aria-hidden
          className="h-px w-10 bg-gradient-to-r from-transparent via-border to-transparent"
        />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
