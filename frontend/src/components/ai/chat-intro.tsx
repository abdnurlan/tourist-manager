"use client";

import { motion } from "framer-motion";
import { Compass, Send, Sparkles } from "lucide-react";
import { az } from "@/lib/i18n/az";
import { SuggestionChips } from "./suggestion-chips";

interface ChatIntroProps {
  onSelectSuggestion: (text: string) => void;
  disabled?: boolean;
}

/** Welcome hero shown when the live thread is empty — a journal title page. */
export function ChatIntro({ onSelectSuggestion, disabled }: ChatIntroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 py-10 text-center"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-hover text-accent-foreground shadow-md"
      >
        <Compass className="size-7" strokeWidth={1.75} />
        <span className="absolute inset-0 -z-10 rounded-2xl bg-accent/30 blur-xl" />
      </motion.div>

      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span className="h-px w-6 bg-border" />
          {az.ai.title}
          <span className="h-px w-6 bg-border" />
        </span>
        <h2 className="font-display text-h2 font-semibold tracking-tight text-foreground">
          {az.ai.intro_greeting}
        </h2>
        <p className="text-body leading-relaxed text-muted-foreground">
          {az.ai.intro_body}
        </p>
      </div>

      {/* Channel tags styled as little ticket stubs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground shadow-xs">
          <Send className="size-3.5 text-accent" strokeWidth={2} />
          {az.source.telegram}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-foreground shadow-xs">
          <Sparkles className="size-3.5 text-terracotta" strokeWidth={2} />
          ChatGPT
        </span>
      </div>

      <SuggestionChips
        onSelect={onSelectSuggestion}
        disabled={disabled}
        className="mt-2 items-center"
      />
    </motion.div>
  );
}
