import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { az } from "@/lib/i18n/az";

/** Azerbaijani 404 (CONTRACT §9.23). */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-accent-subtle text-accent">
        <Compass className="size-8" />
      </span>
      <div className="space-y-1.5">
        <p className="text-display font-bold tracking-tight text-foreground">404</p>
        <h1 className="text-h2 font-semibold text-foreground">
          {az.common.not_found_title}
        </h1>
        <p className="max-w-sm text-body text-muted-foreground">
          {az.common.not_found_subtitle}
        </p>
      </div>
      <Button asChild>
        <Link href="/">{az.common.go_home}</Link>
      </Button>
    </div>
  );
}
