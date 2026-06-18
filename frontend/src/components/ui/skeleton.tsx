import * as React from "react";
import { cn } from "@/lib/utils/cn";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "skeleton-shimmer rounded-md bg-surface-muted",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
