import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Clock, MapPin, RotateCcw, Search, SlidersHorizontal, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookingDialog, type BookingTour } from "@/components/BookingDialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { GuideLangSelect } from "@/components/GuideLangSelect";
import { PaxStepper } from "@/components/PriceCalculator";
import { Logo } from "@/components/Logo";
import { fetchCatalogTours } from "@/lib/api/client";
import { quote } from "@/lib/pricing";
import { useGuideLang } from "@/hooks/use-guide-lang";
import { useLanguage } from "@/hooks/use-language";
import { CAT_KEYS, T, type CategoryKey, type Tour } from "@/lib/tours-data";
import { SEO } from "./__root";

// The full catalogue. The home page only previews six tours and links here.
//
// Every price on this page is a real quote for the party size and guide
// language chosen in the filter bar — not a "from" figure — so the price-range
// filter compares like with like.
export const Route = createFileRoute("/tours/")({
  head: () => ({
    links: [{ rel: "canonical", href: `${SEO.url}/tours` }],
    meta: [
      { title: "כל הטיולים — M4st Trip" },
      { name: "description", content: "כל הטיולים המאורגנים לאזרבייג'ן — סינון לפי קטגוריה, מחיר, גודל קבוצה ושפת מדריך." },
    ],
  }),
  component: ToursCatalog,
});

type SortKey = "default" | "price_asc" | "price_desc";

function ToursCatalog() {
  const [lang, setLang] = useLanguage();
  const [guide, setGuide] = useGuideLang();
  const t = T[lang];
  const dir = t.dir;

  const [category, setCategory] = useState<"all" | CategoryKey>("all");
  const [query, setQuery] = useState("");
  const [pax, setPax] = useState(2);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [booking, setBooking] = useState<BookingTour | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data: tours = [], isLoading } = useQuery({
    queryKey: ["catalog-tours"],
    queryFn: fetchCatalogTours,
  });

  // Price each tour once for the current party + guide, then filter and sort on
  // that number so what the visitor filters by is what the card shows.
  const priced = useMemo(
    () => tours.map((tour) => ({ tour, q: quote(tour.pricing, pax, guide) })),
    [tours, pax, guide],
  );

  const results = useMemo(() => {
    const min = minPrice.trim() === "" ? null : Number(minPrice);
    const max = maxPrice.trim() === "" ? null : Number(maxPrice);
    const needle = query.trim().toLowerCase();

    const list = priced.filter(({ tour, q }) => {
      if (category !== "all" && tour.category !== category) return false;
      const loc = tour.i18n[lang];
      if (needle && !loc.title.toLowerCase().includes(needle) && !loc.region.toLowerCase().includes(needle)) {
        return false;
      }
      // On-request tours carry no number, so a price filter cannot judge them.
      if ((min !== null || max !== null) && (!q || q.onRequest)) return false;
      if (min !== null && !Number.isNaN(min) && q && q.total < min) return false;
      if (max !== null && !Number.isNaN(max) && q && q.total > max) return false;
      return true;
    });

    if (sort === "default") return list;
    return [...list].sort((a, b) => {
      const av = a.q?.total ?? Number.POSITIVE_INFINITY;
      const bv = b.q?.total ?? Number.POSITIVE_INFINITY;
      return sort === "price_asc" ? av - bv : bv - av;
    });
  }, [priced, category, query, lang, minPrice, maxPrice, sort]);

  const filtersDirty =
    category !== "all" || query !== "" || minPrice !== "" || maxPrice !== "" || sort !== "default" || pax !== 2;

  function resetFilters() {
    setCategory("all");
    setQuery("");
    setMinPrice("");
    setMaxPrice("");
    setSort("default");
    setPax(2);
  }

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: "default", label: t.catalog.sortDefault },
    { key: "price_asc", label: t.catalog.sortPriceAsc },
    { key: "price_desc", label: t.catalog.sortPriceDesc },
  ];

  return (
    <div dir={dir} lang={lang} className="min-h-dvh text-foreground">
      {/* NAV */}
      <header
        className={`fixed left-1/2 z-40 w-[calc(100%-1.5rem)] -translate-x-1/2 transition-[top,max-width] duration-[400ms] ease-[cubic-bezier(.25,.46,.45,.94)] sm:w-[calc(100%-2rem)] ${
          scrolled ? "top-3 max-w-[860px]" : "top-4 max-w-6xl"
        }`}
      >
        <div
          className={`glass glass-sheen flex items-center justify-between gap-2 rounded-full transition-[padding,box-shadow] duration-[400ms] ease-[cubic-bezier(.25,.46,.45,.94)] sm:gap-4 ${
            scrolled ? "nav-scrolled px-3 py-3 sm:px-4" : "px-3 py-3 sm:px-5"
          }`}
        >
          <Link
            to="/"
            className="group relative shrink-0 rounded-md before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={t.brand}
          >
            <Logo height={29} alt={t.brand} className="transition-transform duration-300 group-hover:-translate-y-0.5" />
          </Link>
          <LanguageSwitcher lang={lang} onChange={setLang} dir={dir} />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32">
        <Link
          to="/"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 font-display text-sm font-semibold transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {dir === "rtl" ? <ArrowRight aria-hidden="true" className="h-4 w-4" /> : <ArrowLeft aria-hidden="true" className="h-4 w-4" />}
          {t.catalog.backHome}
        </Link>

        <h1 className="mt-8 font-display text-4xl font-bold md:text-5xl">{t.catalog.title}</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{t.catalog.subtitle}</p>

        <div className="mt-12 grid gap-10 lg:grid-cols-[300px_1fr]">
          {/* FILTERS */}
          <aside>
            <div className="sticky top-28 space-y-6 rounded-3xl border border-border bg-card p-6 shadow-(--shadow-soft)">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-display font-bold">
                  <SlidersHorizontal aria-hidden="true" className="h-4 w-4" /> {t.catalog.filters}
                </span>
                {filtersDirty && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /> {t.catalog.reset}
                  </button>
                )}
              </div>

              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.hero.searchPh}
                  aria-label={t.hero.searchPh}
                  className="h-11 ltr:pl-9 rtl:pr-9"
                />
              </div>

              <PaxStepper pax={pax} onChange={setPax} label={t.pricing.paxLabel} personLabel={t.pricing.person} />

              <div className="border-t border-border pt-6">
                <GuideLangSelect value={guide} onChange={setGuide} lang={lang} />
              </div>

              <div className="border-t border-border pt-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t.catalog.priceRange}</div>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    inputMode="numeric"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder={t.catalog.min}
                    aria-label={t.catalog.min}
                    className="h-11"
                  />
                  <span aria-hidden="true" className="text-muted-foreground">–</span>
                  <Input
                    inputMode="numeric"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder={t.catalog.max}
                    aria-label={t.catalog.max}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t.catalog.sortLabel}</div>
                <div role="radiogroup" aria-label={t.catalog.sortLabel} className="mt-2 grid gap-2">
                  {sortOptions.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      role="radio"
                      aria-checked={sort === o.key}
                      onClick={() => setSort(o.key)}
                      className={`min-h-11 rounded-xl border px-3 py-2.5 text-start text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        sort === o.key
                          ? "border-brand-orange bg-brand-orange/10 font-semibold text-foreground"
                          : "border-border text-muted-foreground hover:border-brand-orange/60 hover:text-foreground"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* RESULTS */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {CAT_KEYS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  className={`min-h-11 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    category === c
                      ? "border-brand-orange bg-brand-orange/10 font-semibold text-accent-ink"
                      : "border-border text-muted-foreground hover:border-brand-orange/60 hover:text-foreground"
                  }`}
                >
                  {t.cats[c]}
                </button>
              ))}
            </div>

            <p aria-live="polite" className="mt-6 text-sm text-muted-foreground">
              {isLoading ? "…" : `${results.length} ${t.catalog.results}`}
            </p>

            <div className="mt-6 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-3xl border border-border bg-card">
                    <div className="aspect-[4/3] animate-pulse bg-secondary" />
                    <div className="space-y-3 p-6">
                      <div className="h-4 w-1/3 animate-pulse rounded bg-secondary" />
                      <div className="h-6 w-2/3 animate-pulse rounded bg-secondary" />
                    </div>
                  </div>
                ))}

              {!isLoading &&
                results.map(({ tour, q }) => {
                  const loc = tour.i18n[lang];
                  return (
                    <article key={tour.id} className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-(--shadow-card) transition-transform duration-300 hover:-translate-y-1">
                      <Link to="/tours/$tourId" params={{ tourId: tour.id }} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={tour.image}
                            alt={loc.title}
                            loading="lazy"
                            width={800}
                            height={600}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <Badge className="absolute top-4 ltr:left-4 rtl:right-4">{t.cats[tour.category]}</Badge>
                        </div>
                      </Link>

                      <div className="flex flex-1 flex-col p-6">
                        <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                          <span className="flex items-center gap-1"><Star aria-hidden="true" className="h-3.5 w-3.5 fill-brand-orange text-brand-orange" /> {tour.rating}</span>
                          <span className="flex items-center gap-1"><MapPin aria-hidden="true" className="h-3.5 w-3.5" /> {loc.region}</span>
                        </div>

                        <Link to="/tours/$tourId" params={{ tourId: tour.id }} className="mt-2 block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          <h2 className="font-display text-xl font-bold leading-snug">{loc.title}</h2>
                        </Link>

                        <div className="mt-4 flex items-center gap-4 text-xs font-medium text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Clock aria-hidden="true" className="h-3.5 w-3.5" /> {tour.duration} {t.tours.days}</span>
                          <span className="flex items-center gap-1.5"><Users aria-hidden="true" className="h-3.5 w-3.5" /> {tour.groupSize}</span>
                        </div>

                        <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-5">
                          <div>
                            <div className="text-xs text-muted-foreground">
                              {!q || q.onRequest
                                ? t.pricing.onRequest
                                : q.basis === "group"
                                  ? t.pricing.groupTotal
                                  : q.basis === "vehicle"
                                    ? q.vehicles > 1
                                      ? `${t.pricing.perVehicle} · ${q.vehicles} ${t.pricing.vehicles}`
                                      : t.pricing.perVehicle
                                    : t.pricing.perPersonBasis}
                            </div>
                            <div className="font-display text-2xl font-bold tabular-nums text-brand-orange">
                              {!q || q.onRequest ? "—" : `${q.total} $`}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              setBooking({
                                id: tour.id,
                                title: loc.title,
                                region: loc.region,
                                duration: `${tour.duration} ${t.tours.days}`,
                                price: tour.price,
                                pricing: tour.pricing,
                                image: tour.image,
                              })
                            }
                          >
                            {t.tours.book}
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
            </div>

            {!isLoading && results.length === 0 && (
              <div className="mt-6 rounded-3xl border border-dashed border-border bg-card py-20 text-center text-muted-foreground">
                {t.catalog.none}
              </div>
            )}
          </div>
        </div>
      </main>

      <BookingDialog
        tour={booking}
        initialPeople={pax}
        open={!!booking}
        lang={lang}
        onOpenChange={(o) => !o && setBooking(null)}
      />
    </div>
  );
}
