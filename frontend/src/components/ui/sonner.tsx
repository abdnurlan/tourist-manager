"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

/** App-wide toaster. Mounted once in providers. */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      offset={16}
      gap={10}
      toastOptions={{
        classNames: {
          toast:
            "group rounded-lg border border-border bg-surface text-foreground shadow-lg px-4 py-3.5 text-sm",
          title: "font-display font-semibold",
          description: "text-muted-foreground",
          actionButton: "rounded-lg bg-accent text-accent-foreground text-xs font-medium",
          cancelButton: "rounded-lg bg-surface-muted text-foreground text-xs font-medium",
          success: "[&_[data-icon]]:text-success",
          error: "[&_[data-icon]]:text-danger",
          warning: "[&_[data-icon]]:text-warning",
          info: "[&_[data-icon]]:text-info",
        },
      }}
    />
  );
}

export { toast };
