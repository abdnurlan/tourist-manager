import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ar, az, enUS, he, ru } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, Clock, MapPin, Star, Users, X } from "lucide-react";
import { BookingDialog, type BookingTour } from "@/components/BookingDialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { T, type Lang, type Tour, type TourDate } from "@/lib/tours-data";
import { fetchCatalogTour } from "@/lib/api/client";
import { useLanguage } from "@/hooks/use-language";
import { Logo } from "@/components/Logo";

const DATE_LOCALES = { az, en: enUS, he, ar, ru };

// Format a dated tour's range in the active language, e.g. "15 – 18 okt 2026"
// (or a single "15 okt 2026" when start and end coincide).
function fmtDateRange(d: TourDate, lang: Lang): string {
  const loc = DATE_LOCALES[lang];
  const start = format(parseISO(d.startDate), "d MMM yyyy", { locale: loc });
  if (!d.endDate || d.endDate === d.startDate) return start;
  const end = format(parseISO(d.endDate), "d MMM yyyy", { locale: loc });
  return `${start} – ${end}`;
}

// A date is bookable when it's not cancelled and hasn't started yet.
function isBookable(d: TourDate): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return d.status !== "cancelled" && d.startDate >= today && d.bookedSeats < d.capacity;
}

// Weekday + day/month for a single program day, e.g. "Cümə, 12 apr".
function fmtDay(iso: string, lang: Lang): string {
  return format(parseISO(iso), "EEE, d MMM", { locale: DATE_LOCALES[lang] });
}

export const Route = createFileRoute("/tours/$tourId")({
  loader: async ({ params }): Promise<{ tour: Tour }> => {
    const tour = await fetchCatalogTour(params.tourId);
    if (!tour) throw notFound();
    return { tour };
  },
  head: ({ loaderData }) => {
    const tour = loaderData?.tour;
    const loc = tour?.i18n.az;
    return {
      meta: [
        { title: loc ? `${loc.title} — M4st Trip` : "Tur — M4st Trip" },
        { name: "description", content: loc?.overview ?? "" },
        { property: "og:title", content: loc?.title ?? "" },
        { property: "og:description", content: loc?.overview ?? "" },
        ...(tour ? [{ property: "og:image", content: tour.image }] : []),
      ],
    };
  },
  component: TourDetail,
  notFoundComponent: () => <NotFoundView />,
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center p-6 text-center">
      <p className="text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function NotFoundView() {
  const [lang] = useLanguage();
  const t = T[lang];
  return (
    <div dir={t.dir} className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6 text-center">
      <Logo height={48} alt={t.brand} />
      <p className="font-display text-3xl font-bold">{t.detail.notFound}</p>
      <Button asChild>
        <Link to="/">{t.detail.back}</Link>
      </Button>
    </div>
  );
}

function TourDetail() {
  const { tour } = Route.useLoaderData() as { tour: Tour };
  const [lang, setLang] = useLanguage();
  const [booking, setBooking] = useState<BookingTour | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const bookableDates = tour.dates.filter(isBookable);
  const [selected, setSelected] = useState<TourDate | null>(
    bookableDates.length > 0 ? bookableDates[0] : null,
  );

  const t = T[lang];
  const dir = t.dir;
  const loc = tour.i18n[lang];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openBooking = () => {
    if (!selected) return;
    setBooking({
      id: tour.id,
      title: loc.title,
      region: loc.region,
      duration: `${tour.duration} ${t.tours.days}`,
      price: selected.price ?? tour.price,
      image: tour.image,
      tourId: selected.id,
      departureDate: selected.startDate,
    });
  };

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
          <div className="flex items-center gap-2">
            <LanguageSwitcher lang={lang} onChange={setLang} dir={dir} />
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero-shell relative h-[70svh] min-h-[520px] w-full overflow-hidden">
        <img src={tour.image} alt={loc.title} width={1920} height={1280} className="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden="true" className="hero-scrim absolute inset-0" />
        <div aria-hidden="true" className="hero-scrim-side absolute inset-0" />

        <div className="hero-body relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-12">
          <Link to="/" className="mb-6 inline-flex h-11 w-fit items-center gap-2 rounded-full border border-white/30 bg-brand-green/50 px-5 font-display text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-brand-green/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange">
            {dir === "rtl" ? <ArrowRight aria-hidden="true" className="h-4 w-4" /> : <ArrowLeft aria-hidden="true" className="h-4 w-4" />}
            {t.detail.back}
          </Link>
          <Badge className="mb-4 w-fit">{t.cats[tour.category]}</Badge>
          <h1 className="max-w-4xl font-display text-4xl font-bold leading-[1.05] text-white md:text-6xl lg:text-7xl">
            {loc.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-white/90">
            <span className="flex items-center gap-1.5"><MapPin aria-hidden="true" className="h-4 w-4" /> {loc.region}</span>
            <span className="flex items-center gap-1.5"><Clock aria-hidden="true" className="h-4 w-4" /> {tour.duration} {t.tours.days}</span>
            <span className="flex items-center gap-1.5"><Users aria-hidden="true" className="h-4 w-4" /> {tour.groupSize} {t.tours.people}</span>
            <span className="flex items-center gap-1.5"><Star aria-hidden="true" className="h-4 w-4 fill-brand-orange text-brand-orange" /> {tour.rating}</span>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {/* Overview */}
            <div className="rounded-3xl border border-border bg-card p-8 shadow-(--shadow-card)">
              <h2 className="font-display text-2xl font-bold md:text-3xl">{t.detail.overview}</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">{loc.overview}</p>
            </div>

            {/* Itinerary */}
            <div className="rounded-3xl border border-border bg-card p-8 shadow-(--shadow-card)">
              <h2 className="font-display text-2xl font-bold md:text-3xl">{t.detail.itinerary}</h2>
              <ol className="mt-6 space-y-6">
                {loc.itinerary.map((day, i) => (
                  <li key={day.title} className="relative flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange font-display text-lg font-bold tabular-nums text-primary-foreground">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold">{day.title}</h3>
                      <p className="mt-1 leading-relaxed text-muted-foreground">{day.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Day-by-day program for the selected date (active vs free days) */}
            {selected && selected.days.length > 0 && (
              <div className="rounded-3xl border border-border bg-card p-8 shadow-(--shadow-card)">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-2xl font-bold md:text-3xl">{t.detail.schedule}</h2>
                  <span className="text-sm text-muted-foreground">
                    {fmtDateRange(selected, lang)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.days.filter((d) => d.active).length} {t.detail.activeDays} ·{" "}
                  {selected.days.filter((d) => !d.active).length} {t.detail.restDays}
                </p>
                <ul className="mt-6 space-y-3">
                  {selected.days.map((d) => (
                    <li
                      key={d.date}
                      className={`rounded-2xl border p-4 ${
                        d.active
                          ? "border-brand-orange/50 bg-brand-orange/8"
                          : "border-border bg-secondary/60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={`h-2.5 w-2.5 rounded-full ${d.active ? "bg-brand-orange" : "bg-brand-grey"}`}
                        />
                        <span className="font-medium">{fmtDay(d.date, lang)}</span>
                        {!d.active && (
                          <span className="text-sm text-muted-foreground">· {t.detail.restDay}</span>
                        )}
                      </div>
                      {d.active && (
                        <ul className="mt-3 space-y-2 ps-5">
                          {d.events.map((e, i) => (
                            <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground">
                              {e.time && (
                                <span className="inline-flex items-center gap-1 font-semibold tabular-nums text-accent-ink">
                                  <Clock aria-hidden="true" className="h-3.5 w-3.5" /> {e.time}
                                </span>
                              )}
                              <span>{e.title}</span>
                              {e.location && (
                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                  <MapPin aria-hidden="true" className="h-3.5 w-3.5" /> {e.location}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Included / Excluded */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-8 shadow-(--shadow-card)">
                <h3 className="font-display text-xl font-bold">{t.detail.included}</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {loc.included.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-border bg-card p-8 shadow-(--shadow-card)">
                <h3 className="font-display text-xl font-bold">{t.detail.excluded}</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {loc.excluded.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <X aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand-grey" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Highlights */}
            <div className="rounded-3xl border border-border bg-card p-8 shadow-(--shadow-card)">
              <h3 className="font-display text-xl font-bold">{t.tours.eyebrow}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {loc.highlights.map((h) => (
                  <span key={h} className="rounded-full bg-secondary px-3.5 py-1.5 text-sm font-medium text-secondary-foreground">{h}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky booking card */}
          <aside className="order-first lg:order-none lg:col-span-1">
            <div className="sticky top-28 rounded-3xl border border-border bg-card p-8 shadow-(--shadow-soft)">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t.tours.perPerson}</div>
              <div className="mt-1 font-display text-5xl font-bold tabular-nums text-brand-orange">
                {(selected?.price ?? tour.price)} ₼
              </div>

              <div className="mt-6 space-y-3 border-t border-border pt-6 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Clock aria-hidden="true" className="h-4 w-4" /> {t.detail.duration}</span>
                  <span>{tour.duration} {t.tours.days}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Users aria-hidden="true" className="h-4 w-4" /> {t.detail.group}</span>
                  <span>{tour.groupSize}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Star aria-hidden="true" className="h-4 w-4" /> {t.detail.rating}</span>
                  <span>{tour.rating} / 5</span>
                </div>
              </div>

              {/* Dated departure picker */}
              <div className="mt-6 border-t border-border pt-6">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t.detail.dates}</div>
                {bookableDates.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">{t.detail.noDates}</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {bookableDates.map((d) => {
                      const active = selected?.id === d.id;
                      const remaining = d.capacity - d.bookedSeats;
                      return (
                        <li key={d.id}>
                          <button
                            type="button"
                            onClick={() => setSelected(d)}
                            className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                              active
                                ? "border-brand-orange bg-brand-orange/10 font-semibold text-foreground"
                                : "border-border text-muted-foreground hover:border-brand-orange/60 hover:text-foreground"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                aria-hidden="true"
                                className={`h-3.5 w-3.5 rounded-full border-2 ${active ? "border-brand-orange bg-brand-orange" : "border-brand-grey"}`}
                              />
                              {fmtDateRange(d, lang)}
                            </span>
                            <span className="tabular-nums text-muted-foreground">
                              {d.price} ₼ · {remaining} {t.detail.seats}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <Button
                size="lg"
                disabled={!selected}
                className="group mt-6 w-full transition-transform duration-300 hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={openBooking}
              >
                {t.detail.bookNow}{" "}
                <ArrowRight aria-hidden="true" className={`h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 ${dir === "rtl" ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </aside>
        </div>
      </section>

      <BookingDialog tour={booking} open={!!booking} lang={lang} onOpenChange={(o) => !o && setBooking(null)} />
    </div>
  );
}
