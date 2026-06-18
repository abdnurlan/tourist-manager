"use client";

import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { az } from "@/lib/i18n/az";

/** Animated "thinking…" placeholder shown while the reply is in flight. */
export function ThinkingBubble() {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="flex w-full items-end gap-2.5"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-hover text-accent-foreground shadow-xs ring-1 ring-accent/30">
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="flex"
        >
          <Compass className="size-4" strokeWidth={2} />
        </motion.span>
      </div>
      <div className="flex flex-col gap-1 items-start">
        <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-surface px-4 py-3 shadow-sm">
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-1.5 rounded-full bg-accent"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: "easeInOut",
                }}
              />
            ))}
          </span>
          <span className="text-sm text-muted-foreground">{az.ai.thinking}</span>
        </div>
      </div>
    </motion.div>
  );
}
