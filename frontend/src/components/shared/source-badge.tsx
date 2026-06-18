import { Hand, Send, Sparkles } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { sourceLabel } from "@/lib/i18n/az";
import type { EventSource } from "@/lib/types";

type Variant = NonNullable<BadgeProps["variant"]>;

const SOURCE_META: Record<EventSource, { variant: Variant; icon: typeof Hand }> = {
  manual: { variant: "neutral", icon: Hand },
  telegram: { variant: "info", icon: Send },
  ai: { variant: "accent", icon: Sparkles },
};

export interface SourceBadgeProps {
  source: EventSource;
  className?: string;
  withIcon?: boolean;
}

/** Origin pill (manual/telegram/ai). */
export function SourceBadge({ source, className, withIcon = true }: SourceBadgeProps) {
  // Guard against unknown source values (e.g. legacy/bad data) crashing the render.
  const meta = SOURCE_META[source] ?? SOURCE_META.manual;
  const Icon = meta.icon;
  return (
    <Badge variant={meta.variant} className={className}>
      {withIcon && <Icon className="size-3" />}
      {sourceLabel(source)}
    </Badge>
  );
}
