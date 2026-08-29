import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Users, Star, ArrowRight, Mountain, Compass, PlaneTakeoff, Search, Phone, Instagram, Menu, X } from "lucide-react";
import { BookingDialog, type BookingTour } from "@/components/BookingDialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { CountUp } from "@/components/CountUp";
import { SplitText } from "@/components/SplitText";
import { Reveal } from "@/components/Reveal";
import { TestimonialsMarquee } from "@/components/ui/testimonials-marquee";
import { T, CAT_KEYS, REVIEWS, type CategoryKey, type Tour } from "@/lib/tours-data";
import { fetchCatalogTours } from "@/lib/api/client";

import { useLanguage } from "@/hooks/use-language";

import heroImg from "@/assets/hero-mountains.jpg";
import heroVideo from "@/assets/hero.mp4";

const CURRENT_YEAR = 2026;

// The landing page is one document; these are its blocks. Each also has a real
// URL (/tours, /reviews, …) so links are shareable — no "#" fragments.
/** How many tours the home page previews before sending visitors to /tours. */
const HOME_TOUR_COUNT = 6;

// "tours" is no longer a scroll anchor route: /tours is a real catalogue page.
export const SECTIONS = ["reviews", "how", "contact"] as const;
export type SectionId = (typeof SECTIONS)[number];

export function isSectionId(v: string): v is SectionId {
  return (SECTIONS as readonly string[]).includes(v);
}

export function LandingPage({ section }: { section?: SectionId }) {
  const [lang, setLang] = useLanguage();
  const [category, setCategory] = useState<"all" | CategoryKey>("all");
  const [query, setQuery] = useState("");
  const [bookingTour, setBookingTour] = useState<BookingTour | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const t = T[lang];
  const dir = t.dir;

  // A section route (/tours, /reviews, …) renders this same document and scrolls
  // to the matching block. On "/" `section` is undefined — nothing to scroll to.
  useEffect(() => {
    if (!section) return;
    const el = document.getElementById(section);
    if (!el) return;
    // One frame first: the blocks above the target must have laid out before we
    // measure, otherwise the scroll lands short.
    const raf = requestAnimationFrame(() =>
      el.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
    return () => cancelAnimationFrame(raf);
  }, [section]);

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

  const filtered = useMemo(() => {
    return tours.filter((tour: Tour) => {
      const matchesCat = category === "all" || tour.category === category;
      const q = query.trim().toLowerCase();
      const loc = tour.i18n[lang];
      const matchesQuery = !q || loc.title.toLowerCase().includes(q) || loc.region.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [tours, category, query, lang]);

  // Home shows a preview only; /tours carries the full catalogue with filters.
  const preview = useMemo(() => filtered.slice(0, HOME_TOUR_COUNT), [filtered]);

  // One typed route ("/$section") backs all four; the param is the block id, so
  // these render as /tours, /reviews, /how and /contact.
  const navItems = [
    { section: "reviews", label: t.reviews.eyebrow },
    { section: "how", label: t.nav.how },
    { section: "contact", label: t.nav.contact },
  ] as const satisfies ReadonlyArray<{ section: SectionId; label: string }>;

  return (
    <div dir={dir} lang={lang} className="min-h-dvh text-foreground">
      {/* Keyboard users can jump past the fixed nav. */}
      <a
        href="#tours"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-brand-green focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-on-green"
      >
        {t.nav.tours}
      </a>

      {/* NAV */}
      <header
        className={`fixed left-1/2 z-40 w-[calc(100%-1.5rem)] -translate-x-1/2 transition-[top,max-width] duration-[400ms] ease-[cubic-bezier(.25,.46,.45,.94)] sm:w-[calc(100%-2rem)] ${
          scrolled ? "top-3 max-w-[900px]" : "top-4 max-w-6xl"
        }`}
      >
        <div
          className={`glass glass-sheen flex items-center justify-between gap-2 rounded-full transition-[padding,box-shadow] duration-[400ms] ease-[cubic-bezier(.25,.46,.45,.94)] sm:gap-4 ${
            scrolled ? "nav-scrolled px-3 py-3 sm:px-4" : "px-3 py-3 sm:px-5"
          }`}
        >
          {/* The wordmark carries the name — no duplicate text label beside it. */}
          <Link
            to="/"
            className="group relative shrink-0 rounded-md before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={t.brand}
          >
            <Logo
              height={29}
              alt={t.brand}
              className="transition-transform duration-300 group-hover:-translate-y-0.5"
            />
          </Link>
          <nav
            aria-label={t.nav.tours}
            className={`hidden items-center font-display text-sm font-medium text-foreground/80 transition-[gap] duration-[400ms] ease-[cubic-bezier(.25,.46,.45,.94)] lg:flex ${
              scrolled ? "gap-4" : "gap-7"
            }`}
          >
            <Link
              to="/tours"
              className="relative rounded-sm transition-colors duration-300 before:absolute before:inset-x-0 before:-inset-y-3 before:content-[''] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:bg-brand-orange after:transition-all after:duration-300 hover:after:w-full"
              activeProps={{ className: "text-foreground after:w-full" }}
            >
              {t.nav.tours}
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.section}
                to="/$section"
                params={{ section: item.section }}
                // `before:` widens the tap area to 44px on touch (iPad shows this
                // nav) without changing the pill's height; `after:` is the underline.
                className="relative rounded-sm transition-colors duration-300 before:absolute before:inset-x-0 before:-inset-y-3 before:content-[''] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-0 after:bg-brand-orange after:transition-all after:duration-300 hover:after:w-full"
                activeProps={{ className: "text-foreground after:w-full" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher lang={lang} onChange={setLang} dir={dir} />
            <Button
              size="sm"
              className="hidden h-10 transition-transform duration-300 hover:scale-[1.03] active:scale-95 sm:inline-flex"
              onClick={() => document.getElementById("tours")?.scrollIntoView({ behavior: "smooth" })}
            >
              {t.nav.book}
            </Button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="glass touch-target-square flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <nav
            aria-label={t.nav.tours}
            className="animate-menu-in glass glass-sheen mt-2 flex flex-col gap-1 rounded-3xl p-3 lg:hidden"
          >
            <Link
              to="/tours"
              onClick={() => setMenuOpen(false)}
              className="rounded-2xl px-4 py-3 font-display text-sm font-medium text-foreground/85 transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {t.nav.tours}
            </Link>
            {navItems.map((item) => (
              <Link
                key={item.section}
                to="/$section"
                params={{ section: item.section }}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl px-4 py-3 font-display text-sm font-medium text-foreground/85 transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {item.label}
              </Link>
            ))}
            <Button className="mt-1" onClick={() => setMenuOpen(false)}>{t.nav.book}</Button>
          </nav>
        )}
      </header>

      {/* HERO */}
      {/* Taller floor on small phones: the content is bottom-aligned, and at
          640px the badge slid under the fixed nav on a 568px-tall screen. */}
      <section className="hero-shell relative h-[92svh] min-h-[700px] w-full overflow-hidden sm:min-h-[640px]">
        <img src={heroImg} alt="" width={1920} height={1080} className="absolute inset-0 h-full w-full scale-105 object-cover" />
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={heroImg}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-105 object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        {/* Brand Green scrim — keeps the white type above 4.5:1 over any frame. */}
        <div aria-hidden="true" className="hero-scrim absolute inset-0" />
        <div aria-hidden="true" className="hero-scrim-side absolute inset-0" />
        <div aria-hidden="true" className="animate-float pointer-events-none absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-brand-orange/25 blur-3xl" />
        <div aria-hidden="true" className="animate-float-alt pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-brand-green/40 blur-3xl" />

        <div className="hero-body relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-20 md:pb-28">
          <Badge className="hero-badge animate-fade-up mb-6 w-fit border-transparent bg-brand-orange text-[13px] text-primary-foreground" style={{ animationDelay: "0.1s" }}>{t.hero.badge}</Badge>
          <SplitText
            as="h1"
            key={lang}
            dir={dir}
            delay={0.2}
            segments={[{ text: t.hero.title1 }, { text: t.hero.title2, className: "text-brand-orange" }]}
            className="max-w-4xl font-display text-5xl font-bold leading-[1.05] text-white md:text-7xl lg:text-8xl"
          />
          <p className="hero-lede animate-fade-up mt-6 max-w-xl text-lg leading-relaxed text-white/90 md:text-xl" style={{ animationDelay: "0.35s" }}>{t.hero.subtitle}</p>

          <div className="hero-search animate-fade-up mt-10 flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-white/25 bg-brand-green/45 p-3 backdrop-blur-md md:flex-row md:items-center" style={{ animationDelay: "0.5s" }}>
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-white/90" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.hero.searchPh}
                aria-label={t.hero.searchPh}
                className="h-11 border-0 bg-transparent text-base text-white shadow-none placeholder:text-white/80 focus-visible:ring-0"
              />
            </div>
            <Button size="lg" className="group transition-transform duration-300 hover:scale-[1.02] active:scale-95" onClick={() => document.getElementById("tours")?.scrollIntoView({ behavior: "smooth" })}>
              {t.hero.cta} <ArrowRight aria-hidden="true" className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 ${dir === "rtl" ? "rotate-180" : ""}`} />
            </Button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto -mt-16 max-w-7xl px-6" aria-label={t.hero.badge}>
        <Reveal stagger className="relative z-10 grid grid-cols-2 gap-8 rounded-3xl border border-border bg-card px-8 py-10 shadow-(--shadow-soft) md:grid-cols-4">
          {t.stats.map((s, i) => (
            <div key={s.v} style={{ "--i": i } as CSSProperties}>
              <CountUp
                value={s.k}
                delay={i * 0.08}
                className="block font-display text-4xl font-bold tabular-nums text-brand-orange md:text-5xl"
              />
              <div className="mt-1.5 text-sm font-medium text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* TOURS */}
      <section id="tours" className="mx-auto max-w-7xl px-6 py-24">
        <Reveal>
          <div className="max-w-2xl">
            <p className="eyebrow mb-3">{t.tours.eyebrow}</p>
            <h2 className="font-display text-4xl font-bold md:text-5xl">{t.tours.title}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{t.tours.subtitle}</p>
          </div>
          {/* Own row: the category count grows, so it scrolls rather than wraps. */}
          <div
            className="-mx-6 mt-8 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label={t.tours.title}
          >
            <div className="glass inline-flex gap-1 rounded-full p-1">
              {CAT_KEYS.map((c) => (
                <button
                  key={c}
                  role="tab"
                  aria-selected={category === c}
                  onClick={() => setCategory(c)}
                  className={`min-h-11 shrink-0 cursor-pointer rounded-full px-4 font-display text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    category === c
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground/75 hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {t.cats[c]}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div key={category + query} className="reveal-stagger is-revealed mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-3xl border border-border bg-card">
                <div className="aspect-[4/5] animate-pulse bg-secondary" />
                <div className="space-y-3 p-6">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-secondary" />
                  <div className="h-6 w-2/3 animate-pulse rounded bg-secondary" />
                  <div className="h-4 w-full animate-pulse rounded bg-secondary" />
                </div>
              </div>
            ))}
          {preview.map((tour, idx) => {
            const loc = tour.i18n[lang];
            return (
              <article key={tour.id} style={{ "--i": idx % 6 } as CSSProperties} className="sheen-sweep group overflow-hidden rounded-3xl border border-border bg-card shadow-(--shadow-card) transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-1 hover:border-brand-orange/40 hover:shadow-(--shadow-soft)">
                <Link to="/tours/$tourId" params={{ tourId: tour.id }} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img src={tour.image} alt={loc.title} loading="lazy" width={1024} height={1280} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <Badge variant="green" className={`absolute top-4 ${dir === "rtl" ? "right-4" : "left-4"}`}>
                      {t.cats[tour.category]}
                    </Badge>
                    <div className={`absolute top-4 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 font-display text-xs font-semibold tabular-nums text-foreground shadow-sm ${dir === "rtl" ? "left-4" : "right-4"}`}>
                      <Star aria-hidden="true" className="h-3.5 w-3.5 fill-brand-orange text-brand-orange" /> {tour.rating}
                    </div>
                  </div>
                </Link>
                <div className="p-6">
                  <Link to="/tours/$tourId" params={{ tourId: tour.id }} className="block rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
                      <MapPin aria-hidden="true" className="h-3.5 w-3.5" /> {loc.region}
                    </div>
                    <h3 className="mt-2 font-display text-2xl font-bold leading-tight break-words transition-colors duration-200 group-hover:text-accent-ink">{loc.title}</h3>
                  </Link>
                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {loc.highlights.slice(0, 3).map((h) => (
                      <li key={h} className="flex items-start gap-2.5">
                        <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-orange" /> {h}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex items-center gap-4 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Clock aria-hidden="true" className="h-3.5 w-3.5" /> {tour.duration} {t.tours.days}</span>
                    <span className="flex items-center gap-1.5"><Users aria-hidden="true" className="h-3.5 w-3.5" /> {tour.groupSize} {t.tours.people}</span>
                  </div>
                  {/* No price here by design: the price depends on party size,
                      so the card sends the visitor to the calculator instead. */}
                  <div className="mt-6 flex flex-wrap items-center justify-end gap-4 border-t border-border pt-5">
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="outline" className="transition-transform duration-300 hover:scale-[1.03] active:scale-95">
                        <Link to="/tours/$tourId" params={{ tourId: tour.id }}>{t.tours.details}</Link>
                      </Button>
                      <Button size="sm" className="transition-transform duration-300 hover:scale-[1.03] active:scale-95" onClick={() => setBookingTour({ id: tour.id, title: loc.title, region: loc.region, duration: `${tour.duration} ${t.tours.days}`, price: tour.price, pricing: tour.pricing, image: tour.image })}>
                        {t.tours.book}
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          {!isLoading && filtered.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-border bg-card py-20 text-center text-muted-foreground">{t.tours.empty}</div>
          )}
        </div>

        {!isLoading && filtered.length > HOME_TOUR_COUNT && (
          <div className="mt-12 flex justify-center">
            <Button asChild size="lg" variant="outline" className="group transition-transform duration-300 hover:scale-[1.02] active:scale-95">
              <Link to="/tours">
                {t.catalog.viewAll}
                <ArrowRight aria-hidden="true" className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 ${dir === "rtl" ? "rotate-180" : ""}`} />
              </Link>
            </Button>
          </div>
        )}
      </section>

      {/* REVIEWS */}
      <TestimonialsMarquee
        eyebrow={t.reviews.eyebrow}
        title={t.reviews.title}
        subtitle={t.reviews.subtitle}
        dir={dir}
        testimonials={REVIEWS.map((r) => {
          const rl = r.i18n[lang];
          const tour = tours.find((tr) => tr.id === r.tourId);
          const tourTitle = tour?.i18n[lang].title;
          return {
            id: r.id,
            text: rl.text,
            image: r.avatar,
            name: rl.name,
            role: tourTitle ? `${t.reviews.tourLabel}: ${tourTitle}` : rl.location,
            rating: r.rating,
          };
        })}
      />

      {/* HOW IT WORKS — the brand's dark Green band. */}
      <section id="how" className="surface-green relative overflow-hidden">
        <div aria-hidden="true" className="animate-float pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-brand-orange/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 py-24">
          <Reveal>
            <p className="eyebrow mb-3">{t.how.eyebrow}</p>
            <h2 className="max-w-2xl font-display text-4xl font-bold text-on-green md:text-5xl">{t.how.title}</h2>
          </Reveal>

          <Reveal stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {t.how.steps.map((s, i) => {
              // "Set off" reads as departure; Mountain rendered as a thin, low-mass
              // triangle next to the circular Compass and Users glyphs.
              const Icon = [Compass, Users, PlaneTakeoff][i];
              return (
                <div key={s.t} style={{ "--i": i } as CSSProperties} className="glass-on-green group relative overflow-hidden rounded-3xl p-6 transition-[background-color,border-color,transform] duration-300 last:sm:col-span-2 hover:-translate-y-1 hover:border-brand-orange/50 sm:p-8 lg:last:col-span-1">
                  {/* One row: icon at the start, step number at the end —
                      justify-between mirrors itself in RTL, no dir branch needed. */}
                  <div className="flex items-center justify-between gap-4">
                    <Icon aria-hidden="true" className="h-9 w-9 shrink-0 text-brand-orange transition-transform duration-300 group-hover:scale-110" strokeWidth={1.75} />
                    <span aria-hidden="true" className="font-display text-6xl font-bold leading-none tabular-nums text-brand-orange/35 transition-colors duration-300 group-hover:text-brand-orange/60">0{i + 1}</span>
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-bold text-on-green">{s.t}</h3>
                  <p className="mt-3 leading-relaxed text-on-green-muted">{s.d}</p>
                </div>
              );
            })}
          </Reveal>
        </div>
      </section>

      {/* CTA — Electric Orange band, Green ink (brand guide's signature pairing). */}
      <section id="contact" className="relative overflow-hidden bg-brand-orange">
        <Mountain aria-hidden="true" className="absolute -bottom-16 -right-16 h-96 w-96 text-brand-green/15" strokeWidth={1} />
        <Reveal className="relative mx-auto max-w-7xl px-6 py-24 md:py-28">
          <div className="max-w-2xl">
            <h2 className="font-display text-4xl font-bold text-brand-green md:text-5xl">{t.cta.title}</h2>
            <p className="mt-4 max-w-xl text-lg font-medium leading-relaxed text-brand-green/85">{t.cta.subtitle}</p>
            <form
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                const v = new FormData(e.currentTarget).get("contact")?.toString().trim();
                if (v) toast.success(t.cta.sent ?? "Sorğunuz göndərildi ✓");
                e.currentTarget.reset();
              }}
            >
              <label htmlFor="cta-contact" className="sr-only">{t.cta.ph}</label>
              <Input
                id="cta-contact"
                name="contact"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                placeholder={t.cta.ph}
                className="h-12 min-h-12 w-full rounded-xl border-transparent bg-white text-base text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-brand-green focus-visible:ring-2 focus-visible:ring-brand-green/50 sm:flex-1"
              />
              <Button
                type="submit"
                variant="green"
                size="lg"
                className="group h-12 shrink-0 rounded-xl px-7 shadow-md transition-[transform,box-shadow] duration-200 hover:shadow-lg active:scale-[0.98]"
              >
                {t.cta.btn}
                <ArrowRight aria-hidden="true" className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 ${dir === "rtl" ? "rotate-180" : ""}`} />
              </Button>
            </form>
            <div className="mt-8 flex flex-wrap gap-2 font-display text-sm font-semibold text-brand-green">
              <a href="tel:+994519600212" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-green/10 px-4 transition-colors hover:bg-brand-green/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"><Phone aria-hidden="true" className="h-4 w-4 shrink-0" /><span dir="ltr">+994 51 960 02 12</span></a>
              <a href="mailto:info@m4strip.com" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-green/10 px-4 transition-colors hover:bg-brand-green/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"><span dir="ltr">info@m4strip.com</span></a>
              <a href="https://www.instagram.com/m4strip/" target="_blank" rel="noreferrer" aria-label="M4st Trip Instagram" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-green/10 px-4 transition-colors hover:bg-brand-green/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"><Instagram aria-hidden="true" className="h-4 w-4 shrink-0" /><span dir="ltr">@m4strip</span></a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="surface-green">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-12 text-sm text-on-green-muted md:flex-row">
          <Logo variant="light" height={44} alt={t.brand} />
          <div className="flex flex-col items-center gap-1 text-center md:flex-row md:gap-5">
            <p>© {CURRENT_YEAR} {t.brand}. {t.footer}</p>
            <p>
              {(() => {
                const [before, after] = t.madeBy.split("{c}");
                return (
                  <>
                    {before}
                    <a
                      href="https://codalov.co"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-brand-orange underline-offset-4 transition-colors hover:text-on-green hover:underline"
                    >
                      Codalov
                    </a>
                    {after}
                  </>
                );
              })()}
            </p>
          </div>
        </div>
      </footer>

      <BookingDialog tour={bookingTour} open={!!bookingTour} lang={lang} onOpenChange={(o) => !o && setBookingTour(null)} />
    </div>
  );
}
