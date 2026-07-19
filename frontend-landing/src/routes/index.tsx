import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Users, Star, ArrowRight, Mountain, Compass, Search, Phone, Instagram, Menu, X } from "lucide-react";
import { BookingDialog, type BookingTour } from "@/components/BookingDialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Reveal } from "@/components/Reveal";
import { TestimonialsMarquee } from "@/components/ui/testimonials-marquee";
import { T, CAT_KEYS, REVIEWS, type CategoryKey, type Tour } from "@/lib/tours-data";
import { fetchCatalogTours } from "@/lib/api/client";

import { useLanguage } from "@/hooks/use-language";

import heroImg from "@/assets/hero-mountains.jpg";
import heroVideo from "@/assets/hero.mp4";
import logoImg from "@/assets/logo.png";

const CURRENT_YEAR = 2026;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "M4STrip — Azərbaycan üzrə daxili turlar və kəşf marşrutları" },
      { name: "description", content: "Azərbaycanın ən gözəl bölgələrinə daxili turlar: Şəki, Qəbələ, Xınalıq, Qobustan, Lənkəran və daha çoxu." },
    ],
  }),
  component: Index,
});

function Index() {
  const [lang, setLang] = useLanguage();
  const [category, setCategory] = useState<"all" | CategoryKey>("all");
  const [query, setQuery] = useState("");
  const [bookingTour, setBookingTour] = useState<BookingTour | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const t = T[lang];
  const dir = t.dir;

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

  return (
    <div dir={dir} lang={lang} className="min-h-screen text-foreground">
      {/* NAV */}
      <header
        className={`fixed left-1/2 z-40 w-[calc(100%-2rem)] -translate-x-1/2 transition-[top,max-width] duration-[400ms] ease-[cubic-bezier(.25,.46,.45,.94)] ${
          scrolled ? "top-3 max-w-[860px]" : "top-4 max-w-6xl"
        }`}
      >
        <div
          className={`glass glass-sheen flex items-center justify-between gap-4 rounded-full transition-[padding,box-shadow] duration-[400ms] ease-[cubic-bezier(.25,.46,.45,.94)] ${
            scrolled ? "nav-scrolled px-4 py-2" : "px-5 py-3"
          }`}
        >
          <Link to="/" className="group flex items-center gap-2 text-foreground">
            <img src={logoImg} alt={t.brand} width={36} height={36} className="h-9 w-9 shrink-0 object-contain transition-transform duration-300 group-hover:-translate-y-0.5" />
            <span className="font-display text-lg font-medium tracking-tight">{t.brand}</span>
          </Link>
          <nav
            className={`hidden items-center text-sm text-foreground/80 transition-[gap] duration-[400ms] ease-[cubic-bezier(.25,.46,.45,.94)] lg:flex ${
              scrolled ? "gap-4" : "gap-7"
            }`}
          >
            {[
              { href: "#tours", label: t.nav.tours },
              { href: "#reviews", label: t.reviews.eyebrow },
              { href: "#how", label: t.nav.how },
              { href: "#contact", label: t.nav.contact },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative transition-colors duration-300 hover:text-foreground after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher lang={lang} onChange={setLang} dir={dir} />
            <Button size="sm" className="hidden rounded-full transition-transform duration-300 hover:scale-[1.03] active:scale-95 sm:inline-flex">{t.nav.book}</Button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="glass flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-foreground transition active:scale-95 lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="animate-menu-in glass glass-sheen mt-2 flex flex-col gap-1 rounded-3xl p-3 lg:hidden">
            {[
              { href: "#tours", label: t.nav.tours },
              { href: "#reviews", label: t.reviews.eyebrow },
              { href: "#how", label: t.nav.how },
              { href: "#contact", label: t.nav.contact },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl px-4 py-3 text-sm text-foreground/85 transition-colors hover:bg-white/10 hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
            <Button className="mt-1 rounded-2xl" onClick={() => setMenuOpen(false)}>{t.nav.book}</Button>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative h-[92vh] min-h-[640px] w-full overflow-hidden">
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
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="animate-float pointer-events-none absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
        <div className="animate-float-alt pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-20 md:pb-28">
          <Badge className="animate-fade-up mb-6 w-fit rounded-full border-white/25 bg-white/15 px-4 py-1.5 text-white backdrop-blur-md" style={{ animationDelay: "0.1s" }}>{t.hero.badge}</Badge>
          <h1 className="animate-fade-up max-w-4xl font-display text-5xl font-medium leading-[1.05] text-white md:text-7xl lg:text-8xl" style={{ animationDelay: "0.2s" }}>
            {t.hero.title1} <em className="italic text-accent">{t.hero.title2}</em>
          </h1>
          <p className="animate-fade-up mt-6 max-w-xl text-lg text-white/90 md:text-xl" style={{ animationDelay: "0.35s" }}>{t.hero.subtitle}</p>

          <div className="animate-fade-up mt-10 flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-white/20 bg-white/15 p-3 backdrop-blur-md md:flex-row md:items-center" style={{ animationDelay: "0.5s" }}>
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="h-5 w-5 text-white/80" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.hero.searchPh}
                className="border-0 bg-transparent text-white shadow-none placeholder:text-white/70 focus-visible:ring-0"
              />
            </div>
            <Button size="lg" className="cursor-pointer rounded-xl transition-transform duration-300 hover:scale-[1.02] active:scale-95" onClick={() => document.getElementById("tours")?.scrollIntoView({ behavior: "smooth" })}>
              {t.hero.cta} <ArrowRight className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 ${dir === "rtl" ? "mr-1 rotate-180" : "ml-1"}`} />
            </Button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mx-auto -mt-16 max-w-7xl px-6">
        <div className="relative z-10 grid grid-cols-2 gap-8 rounded-3xl border border-border bg-card px-8 py-10 shadow-(--shadow-soft) md:grid-cols-4">
          {t.stats.map((s) => (
            <div key={s.v}>
              <div className="font-display text-4xl font-medium text-accent md:text-5xl">{s.k}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TOURS */}
      <section id="tours" className="mx-auto max-w-7xl px-6 py-24">
        <Reveal className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm uppercase tracking-widest text-accent">{t.tours.eyebrow}</p>
            <h2 className="font-display text-4xl font-medium md:text-5xl">{t.tours.title}</h2>
            <p className="mt-4 text-foreground/75">{t.tours.subtitle}</p>
          </div>
          <div className="glass flex flex-wrap gap-1 rounded-full p-1">
            {CAT_KEYS.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm transition-all duration-300 ${
                  category === c ? "bg-primary text-primary-foreground shadow" : "text-foreground/80 hover:text-foreground hover:bg-white/5"
                }`}
              >
                {t.cats[c]}
              </button>
            ))}
          </div>
        </Reveal>

        <div key={category + query} className="reveal-stagger is-revealed mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass overflow-hidden rounded-3xl">
                <div className="aspect-[4/5] animate-pulse bg-foreground/5" />
                <div className="space-y-3 p-6">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-foreground/10" />
                  <div className="h-6 w-2/3 animate-pulse rounded bg-foreground/10" />
                  <div className="h-4 w-full animate-pulse rounded bg-foreground/5" />
                </div>
              </div>
            ))}
          {filtered.map((tour, idx) => {
            const loc = tour.i18n[lang];
            return (
              <article key={tour.id} style={{ "--i": idx % 6 } as CSSProperties} className="glass glass-sheen sheen-sweep group overflow-hidden rounded-3xl ring-1 ring-transparent transition-[box-shadow,--tw-ring-color] duration-300 hover:shadow-[var(--shadow-soft)] hover:ring-accent/30">
                <Link to="/tours/$tourId" params={{ tourId: tour.id }} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img src={tour.image} alt={loc.title} loading="lazy" width={1024} height={1280} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <Badge className={`glass absolute top-4 rounded-full text-foreground ${dir === "rtl" ? "right-4" : "left-4"}`}>
                      {t.cats[tour.category]}
                    </Badge>
                    <div className={`glass absolute top-4 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-foreground ${dir === "rtl" ? "left-4" : "right-4"}`}>
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {tour.rating}
                    </div>
                  </div>
                </Link>
                <div className="p-6">
                  <Link to="/tours/$tourId" params={{ tourId: tour.id }} className="block">
                    <div className="flex items-center gap-1.5 text-xs text-foreground/70">
                      <MapPin className="h-3.5 w-3.5" /> {loc.region}
                    </div>
                    <h3 className="mt-2 font-display text-2xl font-semibold leading-tight tracking-tight transition-colors duration-200 group-hover:text-accent">{loc.title}</h3>
                  </Link>
                  <ul className="mt-4 space-y-2 text-sm text-foreground/70">
                    {loc.highlights.slice(0, 3).map((h) => (
                      <li key={h} className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/70" /> {h}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex items-center gap-4 text-xs font-medium text-foreground/60">
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {tour.duration} {t.tours.days}</span>
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {tour.groupSize} {t.tours.people}</span>
                  </div>
                  <div className="mt-6 flex items-end justify-between border-t border-foreground/10 pt-5">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-foreground/50">{t.tours.perPerson}</div>
                      <div className="mt-0.5 font-display text-3xl font-semibold tabular-nums text-accent">{tour.price} ₼</div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="secondary" className="cursor-pointer rounded-full transition-transform duration-300 hover:scale-[1.03] active:scale-95">
                        <Link to="/tours/$tourId" params={{ tourId: tour.id }}>{t.tours.details}</Link>
                      </Button>
                      <Button size="sm" className="cursor-pointer rounded-full transition-transform duration-300 hover:scale-[1.03] active:scale-95" onClick={() => setBookingTour({ id: tour.id, title: loc.title, region: loc.region, duration: `${tour.duration} ${t.tours.days}`, price: tour.price, image: tour.image })}>
                        {t.tours.book}
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          {!isLoading && filtered.length === 0 && (
            <div className="glass col-span-full rounded-3xl py-20 text-center text-foreground/70">{t.tours.empty}</div>
          )}
        </div>
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

      {/* HOW IT WORKS */}

      <section id="how">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <Reveal>
            <p className="mb-3 text-sm uppercase tracking-widest text-accent">{t.how.eyebrow}</p>
            <h2 className="max-w-2xl font-display text-4xl font-medium md:text-5xl">{t.how.title}</h2>
          </Reveal>

          <Reveal stagger className="mt-14 grid gap-6 md:grid-cols-3">
            {t.how.steps.map((s, i) => {
              const Icon = [Compass, Users, Mountain][i];
              return (
                <div key={s.t} style={{ "--i": i } as CSSProperties} className="glass glass-sheen group relative rounded-3xl p-8 ring-1 ring-transparent transition-[box-shadow,--tw-ring-color] duration-300 hover:shadow-[var(--shadow-soft)] hover:ring-accent/25">
                  <div className={`absolute -top-2 font-display text-7xl text-accent/40 transition-colors duration-300 group-hover:text-accent/60 ${dir === "rtl" ? "left-6" : "right-6"}`}>0{i + 1}</div>
                  <Icon className="h-8 w-8 text-accent transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
                  <h3 className="mt-5 font-display text-2xl font-medium">{s.t}</h3>
                  <p className="mt-3 text-foreground/75">{s.d}</p>
                </div>
              );
            })}
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="mx-auto max-w-7xl px-6 py-24">
        <Reveal className="glass-strong glass-sheen relative overflow-hidden rounded-3xl p-12 md:p-16">
          <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-warm)", opacity: 0.5 }} />
          <div className="animate-float pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-accent/40 blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <h2 className="font-display text-4xl font-medium text-foreground md:text-5xl">{t.cta.title}</h2>
            <p className="mt-4 text-foreground/85">{t.cta.subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Input placeholder={t.cta.ph} className="glass h-12 rounded-xl border-0 text-foreground placeholder:text-foreground/60" />
              <Button size="lg" className="h-12 cursor-pointer rounded-xl transition-transform duration-300 hover:scale-[1.03] active:scale-95">{t.cta.btn}</Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-foreground/85">
              <a href="tel:+994519600212" className="flex items-center gap-2 transition-colors hover:text-foreground"><Phone className="h-4 w-4" /><span dir="ltr">051 960 02 12</span></a>
              <a href="https://www.instagram.com/m4strip/" target="_blank" rel="noreferrer" aria-label="M4STrip Instagram" className="flex items-center gap-2 transition-colors hover:text-foreground"><Instagram className="h-4 w-4" /><span dir="ltr">@m4strip</span></a>
            </div>
          </div>
          <Mountain className="absolute -right-10 -bottom-10 h-72 w-72 text-foreground/10" strokeWidth={1} />
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-foreground/70 md:flex-row">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt={t.brand} width={24} height={24} className="h-6 w-6 object-contain" />
            <span className="font-display text-base text-foreground">{t.brand}</span>
          </div>
          <p>© {CURRENT_YEAR} {t.brand}. {t.footer}</p>
        </div>
      </footer>

      <BookingDialog tour={bookingTour} open={!!bookingTour} lang={lang} onOpenChange={(o) => !o && setBookingTour(null)} />
    </div>
  );
}
