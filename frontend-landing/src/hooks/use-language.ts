import { useEffect, useState } from "react";
import { getStoredLang, setStoredLang, type Lang } from "@/lib/tours-data";

const RTL_LANGS: Lang[] = ["ar", "he"];

function syncDocumentLanguage(lang: Lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
}

export function useLanguage() {
  const [lang, setLang] = useState<Lang>("az");

  useEffect(() => {
    const storedLang = getStoredLang();
    setLang(storedLang);
    syncDocumentLanguage(storedLang);

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<Lang>).detail;
      if (detail) {
        setLang(detail);
        syncDocumentLanguage(detail);
      }
    };
    window.addEventListener("seyahet-lang", onChange);
    return () => window.removeEventListener("seyahet-lang", onChange);
  }, []);

  const change = (next: Lang) => {
    setStoredLang(next);
    setLang(next);
    syncDocumentLanguage(next);
    window.dispatchEvent(new CustomEvent("seyahet-lang", { detail: next }));
  };

  return [lang, change] as const;
}
