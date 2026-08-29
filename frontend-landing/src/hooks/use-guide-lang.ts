import { useEffect, useState } from "react";

/**
 * Which guide the traveller books, and therefore which rate column applies.
 * Deliberately independent of the site's interface language: reading the site
 * in Hebrew does not mean paying the Hebrew-guide rate — it is an explicit
 * choice made inside the tour package.
 */
export type GuideLang = "std" | "he";

const KEY = "m4st-guide-lang";
const EVENT = "m4st-guide-lang-change";
/** The base rate column; a Hebrew-speaking guide is a paid upgrade on top. */
export const DEFAULT_GUIDE: GuideLang = "std";

function read(): GuideLang {
  if (typeof window === "undefined") return DEFAULT_GUIDE;
  return window.localStorage.getItem(KEY) === "he" ? "he" : DEFAULT_GUIDE;
}

export function useGuideLang() {
  const [guide, setGuide] = useState<GuideLang>(DEFAULT_GUIDE);

  useEffect(() => {
    setGuide(read());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<GuideLang>).detail;
      if (detail) setGuide(detail);
    };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  const change = (next: GuideLang) => {
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, next);
    setGuide(next);
    // Keep every mounted price on the page in step (cards, calculator, dialog).
    window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  };

  return [guide, change] as const;
}
