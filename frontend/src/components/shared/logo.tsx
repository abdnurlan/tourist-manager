import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface LogoProps {
  className?: string;
  /** Intrinsic size hint passed to next/image. Display size is set via `className`. */
  size?: number;
  /** Eagerly load (use for above-the-fold brand marks like login / loading). */
  priority?: boolean;
  alt?: string;
}

/**
 * The M4STrip brand emblem (transparent PNG in /public).
 * Size it with `className` (e.g. `size-9`, `size-16`, `size-full`).
 */
export function Logo({ className, size = 128, priority, alt = "M4STrip" }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={cn("object-contain", className)}
    />
  );
}
