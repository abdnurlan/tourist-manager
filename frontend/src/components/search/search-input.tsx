"use client";

import { useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { az } from "@/lib/i18n/az";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Show a small inline spinner while a debounced request is in flight. */
  busy?: boolean;
  autoFocus?: boolean;
  className?: string;
}

/** Glassy instant-search field with leading icon, busy spinner, and clear button. */
export function SearchInput({
  value,
  onChange,
  busy,
  autoFocus = true,
  className,
}: SearchInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
        strokeWidth={2}
      />
      <Input
        ref={ref}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            onChange("");
          }
        }}
        placeholder={az.search.placeholder}
        aria-label={az.action.search}
        className="h-12 rounded-xl pl-12 pr-12 text-body [&::-webkit-search-cancel-button]:appearance-none"
      />

      {busy ? (
        <Loader2
          className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
          aria-hidden
        />
      ) : value ? (
        <button
          type="button"
          onClick={() => {
            onChange("");
            ref.current?.focus();
          }}
          aria-label={az.action.clear}
          className="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors duration-fast hover:bg-surface-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
