import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, Clock, MapPin, Mountain, Star, Users, X } from "lucide-react";
import { BookingDialog, type BookingTour } from "@/components/BookingDialog";
import { TOURS, T, LANGS, type Tour } from "@/lib/tours-data";
import { useLanguage } from "@/hooks/use-language";

export const Route = createFileRoute("/tours/$tourId")({
  loader: ({ params }): { tour: Tour } => {
    const tour = TOURS.find((tr) => tr.id === params.tourId);
    if (!tour) throw notFound();
    return { tour };
  },
  head: ({ loaderData }) => {
    const tour = loaderData?.tour;
    const loc = tour?.i18n.az;
    return {
      meta: [
        { title: loc ? `${loc.title} — Səyahət AZ` : "Tur — Səyahət AZ" },
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
      <p className="text-foreground/80">{error.message}</p>
    </div>
  ),
});

function NotFoundView() {
  const [lang] = useLanguage();
  const t = T[lang];
  return (
    <div dir={t.dir} className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <p className="font-display text-3xl">{t.detail.notFound}</p>
      <Button asChild className="rounded-full">
        <Link to="/">{t.detail.back}</Link>
      </Button>
    </div>
  );
}

function TourDetail() {
  const { tour } = Route.useLoaderData() as { tour: Tour };
  const [lang, setLang] = useLanguage();
  const [booking, setBooking] = useState<BookingTour | null>(null);

  const t = T[lang];
  const dir = t.dir;
  const loc = tour.i18n[lang];

  const openBooking = () =>
    setBooking({
      id: tour.id,
      title: loc.title,
      region: loc.region,
      duration: `${tour.duration} ${t.tours.days}`,
      price: tour.price,
      image: tour.image,
    });

  return (
    <div dir={dir} lang={lang} className="min-h-screen text-foreground">
      {/* NAV */}
      <header className="fixed top-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2">
        <div className="glass glass-sheen flex items-center justify-between gap-4 rounded-full px-5 py-3">
          <Link to="/" className="flex items-center gap-2 text-foreground">
            <Mountain className="h-5 w-5" strokeWidth={1.5} />
            <span className="font-display text-lg font-medium tracking-tight">{t.brand}</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="glass flex items-center gap-0.5 rounded-full p-0.5 text-xs">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`rounded-full px-2.5 py-1 transition ${
                    lang === l.code ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative h-[70vh] min-h-[520px] w-full overflow-hidden">
        <img src={tour.image} alt={loc.title} width={1920} height={1280} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="pointer-events-none absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />

        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 pb-12">
          <Link to="/" className="glass mb-6 inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm text-foreground hover:text-accent">
            {dir === "rtl" ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {t.detail.back}
          </Link>
          <Badge className="glass mb-4 w-fit rounded-full text-foreground">{t.cats[tour.category]}</Badge>
          <h1 className="max-w-4xl font-display text-4xl font-medium leading-[1.05] text-foreground md:text-6xl lg:text-7xl">
            {loc.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-foreground/85">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {loc.region}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {tour.duration} {t.tours.days}</span>
            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {tour.groupSize} {t.tours.people}</span>
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-accent text-accent" /> {tour.rating}</span>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {/* Overview */}
            <div className="glass glass-sheen rounded-3xl p-8">
              <h2 className="font-display text-2xl font-medium md:text-3xl">{t.detail.overview}</h2>
              <p className="mt-4 leading-relaxed text-foreground/80">{loc.overview}</p>
            </div>

            {/* Itinerary */}
            <div className="glass glass-sheen rounded-3xl p-8">
              <h2 className="font-display text-2xl font-medium md:text-3xl">{t.detail.itinerary}</h2>
              <ol className="mt-6 space-y-6">
                {loc.itinerary.map((day, i) => (
                  <li key={day.title} className="relative flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 font-display text-lg font-medium text-accent">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-medium">{day.title}</h3>
                      <p className="mt-1 text-foreground/75">{day.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Included / Excluded */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="glass glass-sheen rounded-3xl p-8">
                <h3 className="font-display text-xl font-medium">{t.detail.included}</h3>
                <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                  {loc.included.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass glass-sheen rounded-3xl p-8">
                <h3 className="font-display text-xl font-medium">{t.detail.excluded}</h3>
                <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                  {loc.excluded.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-foreground/50" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Highlights */}
            <div className="glass glass-sheen rounded-3xl p-8">
              <h3 className="font-display text-xl font-medium">{t.tours.eyebrow}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {loc.highlights.map((h) => (
                  <span key={h} className="glass rounded-full px-3 py-1.5 text-sm text-foreground/85">{h}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Sticky booking card */}
          <aside className="lg:col-span-1">
            <div className="glass-strong glass-sheen sticky top-28 rounded-3xl p-8">
              <div className="text-xs uppercase tracking-widest text-foreground/60">{t.tours.perPerson}</div>
              <div className="mt-1 font-display text-5xl font-medium text-accent">{tour.price} ₼</div>

              <div className="mt-6 space-y-3 border-t border-white/10 pt-6 text-sm text-foreground/80">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {t.detail.duration}</span>
                  <span>{tour.duration} {t.tours.days}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Users className="h-4 w-4" /> {t.detail.group}</span>
                  <span>{tour.groupSize}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2"><Star className="h-4 w-4" /> {t.detail.rating}</span>
                  <span>{tour.rating} / 5</span>
                </div>
              </div>

              <Button size="lg" className="mt-6 w-full rounded-xl" onClick={openBooking}>
                {t.detail.bookNow} <ArrowRight className={`h-4 w-4 ${dir === "rtl" ? "mr-1 rotate-180" : "ml-1"}`} />
              </Button>
            </div>
          </aside>
        </div>
      </section>

      <BookingDialog tour={booking} open={!!booking} onOpenChange={(o) => !o && setBooking(null)} />
    </div>
  );
}
