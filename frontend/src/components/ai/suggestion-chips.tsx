"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";

export const AI_SUGGESTIONS: string[] = [
  az.ai.suggestion_1,
  az.ai.suggestion_2,
  az.ai.suggestion_3,
  az.ai.suggestion_4,
  az.ai.suggestion_5,
];

interface SuggestionChipsProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

/** Tappable example commands styled as little ticket tags. */
export function SuggestionChips({
  onSelect,
  disabled,
  className,
}: SuggestionChipsProps) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        <Sparkles className="size-3.5 text-terracotta" strokeWidth={2} />
        {az.ai.suggestions_title}
      </div>
      <div className="flex flex-wrap gap-2">
        {AI_SUGGESTIONS.map((text, i) => (
          <motion.button
            key={text}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(text)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.25,
              delay: 0.04 * i,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              "group inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-2.5 pr-3.5 text-sm text-foreground shadow-xs",
              "transition-colors hover:border-accent/40 hover:bg-accent-subtle hover:text-accent",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {/* tiny ticket punch */}
            <span className="size-1.5 shrink-0 rounded-full border border-border bg-background transition-colors group-hover:border-accent/50" />
            {text}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
