import { cn } from "@/lib/utils/cn";

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: number;
}

/** Minimal accent spinner. */
export function Spinner({ size = 20, className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Yüklənir"
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-accent/25 border-t-accent",
        className,
      )}
      style={{ width: size, height: size }}
      {...props}
    />
  );
}
