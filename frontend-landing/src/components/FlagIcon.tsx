import type { ReactNode } from "react";
import type { Lang } from "@/lib/tours-data";
import { cn } from "@/lib/utils";

interface FlagIconProps {
  lang: Lang;
  className?: string;
}

const flagArtwork: Record<Lang, ReactNode> = {
  az: (
    <>
      <path fill="#00b5e2" d="M0 0h24v6H0z" />
      <path fill="#ef3340" d="M0 6h24v6H0z" />
      <path fill="#509e2f" d="M0 12h24v6H0z" />
      <circle cx="11" cy="9" r="2.65" fill="#fff" />
      <circle cx="11.8" cy="9" r="2.15" fill="#ef3340" />
      <path
        fill="#fff"
        d="m14.9 7.55.36.95.92-.49-.5.91.94.42-1.02.17.22 1-.7-.75-.68.77.2-1.01-1.02-.14.93-.45-.52-.89.93.47z"
      />
    </>
  ),
  en: (
    <>
      <path fill="#012169" d="M0 0h24v18H0z" />
      <path stroke="#fff" strokeWidth="4" d="m0 0 24 18M24 0 0 18" />
      <path stroke="#c8102e" strokeWidth="1.8" d="m0 0 24 18M24 0 0 18" />
      <path fill="#fff" d="M9 0h6v18H9zM0 6h24v6H0z" />
      <path fill="#c8102e" d="M10.25 0h3.5v18h-3.5zM0 7.25h24v3.5H0z" />
    </>
  ),
  ru: (
    <>
      <path fill="#fff" d="M0 0h24v6H0z" />
      <path fill="#0039a6" d="M0 6h24v6H0z" />
      <path fill="#d52b1e" d="M0 12h24v6H0z" />
    </>
  ),
  ar: (
    <>
      <path fill="#006c35" d="M0 0h24v18H0z" />
      <text x="12" y="8.3" fill="#fff" fontFamily="serif" fontSize="2.55" textAnchor="middle">
        لا إله إلا الله محمد رسول الله
      </text>
      <path stroke="#fff" strokeLinecap="round" strokeWidth=".75" d="M6.1 12.3h10.8" />
      <path fill="#fff" d="m16.7 11.85 1.55.45-1.55.45z" />
    </>
  ),
  he: (
    <>
      <path fill="#fff" d="M0 0h24v18H0z" />
      <path fill="#0038b8" d="M0 2h24v2H0zM0 14h24v2H0z" />
      <path
        fill="none"
        stroke="#0038b8"
        strokeWidth=".8"
        d="m12 5.2 3.2 5.5H8.8zm0 7.6-3.2-5.5h6.4z"
      />
    </>
  ),
};

export function FlagIcon({ lang, className }: FlagIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex h-[18px] w-6 shrink-0 overflow-hidden rounded-[5px] ring-1 ring-black/10",
        className,
      )}
    >
      <svg viewBox="0 0 24 18" className="h-full w-full" role="presentation">
        {flagArtwork[lang]}
      </svg>
    </span>
  );
}
