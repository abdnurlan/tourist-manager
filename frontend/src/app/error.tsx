"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { az } from "@/lib/i18n/az";

/** Global error boundary (CONTRACT §9.23). */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-danger/12 text-danger">
        <AlertTriangle className="size-8" />
      </span>
      <div className="space-y-1.5">
        <h1 className="text-h2 font-semibold text-foreground">
          {az.common.error_title}
        </h1>
        <p className="max-w-sm text-body text-muted-foreground">
          {az.common.error_subtitle}
        </p>
      </div>
      <Button onClick={reset}>{az.action.retry}</Button>
    </div>
  );
}
