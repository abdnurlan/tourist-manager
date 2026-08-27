import wordmarkDarkWebp from "@/assets/brand/logo-wordmark-dark.webp";
import wordmarkDarkPng from "@/assets/brand/logo-wordmark-dark.png";
import wordmarkLightWebp from "@/assets/brand/logo-wordmark-light.webp";
import wordmarkLightPng from "@/assets/brand/logo-wordmark-light.png";

/** Intrinsic aspect ratio of the exported wordmark (1200 × 365). */
const RATIO = 1200 / 365;
/** Brand guide's recommended minimum web width (140px) — the default size here.
 *  Callers may go smaller when the layout demands it; see the `height` prop. */
const MIN_WIDTH = 140;
const DEFAULT_HEIGHT = Math.ceil(MIN_WIDTH / RATIO);

interface LogoProps {
  /**
   * `dark` = midnight-black wordmark for light backgrounds,
   * `light` = white wordmark for the dark green / photographic backgrounds.
   * Per the brand guide, only these two lockups may be used — the mark is
   * never recoloured, rotated or given effects.
   */
  variant?: "dark" | "light";
  /**
   * Rendered height in px. Defaults to the brand guide's 140px minimum web
   * width; smaller values are allowed but fall below that recommendation.
   */
  height?: number;
  className?: string;
  alt?: string;
}

/**
 * The official M4st Trip wordmark. Clear space (¼ of the logo height on every
 * side) is the caller's job — wrap it in a container with padding, never crowd it.
 */
export function Logo({ variant = "dark", height = DEFAULT_HEIGHT, className = "", alt = "m4st trip" }: LogoProps) {
  const webp = variant === "dark" ? wordmarkDarkWebp : wordmarkLightWebp;
  const png = variant === "dark" ? wordmarkDarkPng : wordmarkLightPng;
  const width = Math.round(height * RATIO);

  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      <img
        src={png}
        alt={alt}
        width={width}
        height={height}
        style={{ height, width: "auto" }}
        className={`block max-w-full object-contain ${className}`}
        // The wordmark is the brand's own mark; never lazy-load it in the nav.
        decoding="async"
      />
    </picture>
  );
}
