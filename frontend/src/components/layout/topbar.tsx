"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";

export interface TopbarProps {
  title?: string;
  /** Show a back chevron (mobile detail screens). */
  showBack?: boolean;
  onBack?: () => void;
  /** Right-aligned actions. */
  actions?: ReactNode;
  /** Left-aligned brand/extra content (e.g. mobile logo). */
  leading?: ReactNode;
  className?: string;
}

/** Glass sticky top bar (CONTRACT §11.9). Spans the content column. */
export function Topbar({ title, showBack, onBack, actions, leading, className }: TopbarProps) {
  const router = useRouter();
  return (
    <header
      className={cn(
        "glass sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border px-4 md:px-8",
        className,
      )}
    >
      {showBack && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={az.action.back}
          onClick={onBack ?? (() => router.back())}
          className="-ml-1"
        >
          <ChevronLeft className="size-5" />
        </Button>
      )}
      {leading}
      {title && (
        <h1 className="truncate font-display text-h3 font-semibold tracking-tight text-foreground">
          {title}
        </h1>
      )}
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </header>
  );
}
