import { useEffect, useState } from "react";
import { getStoredLang, setStoredLang, type Lang } from "@/lib/tours-data";

export function useLanguage() {
  const [lang, setLang] = useState<Lang>("az");

  useEffect(() => {
    setLang(getStoredLang());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<Lang>).detail;
      if (detail) setLang(detail);
    };
    window.addEventListener("seyahet-lang", onChange);
    return () => window.removeEventListener("seyahet-lang", onChange);
  }, []);

  const change = (next: Lang) => {
    setStoredLang(next);
    setLang(next);
    window.dispatchEvent(new CustomEvent("seyahet-lang", { detail: next }));
  };

  return [lang, change] as const;
}
