import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

/**
 * "Səyahət Jurnalı" badges read like little rubber-stamp / luggage labels:
 * tinted fill, a thin tonal ring, uppercase tracking. Variants map to the
 * app's semantic tones.
 */
export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] leading-none whitespace-nowrap ring-1 ring-inset transition-colors",
  {
    variants: {
      variant: {
        neutral: "bg-surface-muted text-muted-foreground ring-border",
        accent: "bg-accent-subtle text-accent ring-accent/25",
        terracotta: "bg-terracotta-subtle text-terracotta ring-terracotta/25",
        success: "bg-success/12 text-success ring-success/25",
        warning: "bg-warning/12 text-warning ring-warning/25",
        danger: "bg-danger/12 text-danger ring-danger/25",
        info: "bg-info/12 text-info ring-info/25",
        outline: "bg-transparent text-foreground ring-border",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  ),
);
Badge.displayName = "Badge";

export { Badge };
