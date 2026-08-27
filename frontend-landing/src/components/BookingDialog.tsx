import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ar, az, enUS, he, ru } from "date-fns/locale";
import {
  CalendarIcon,
  MapPin,
  Clock,
  Users,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Minus,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BOOKING_COPY } from "@/lib/booking-i18n";
import type { Lang } from "@/lib/tours-data";
import { cn } from "@/lib/utils";
import { submitBooking } from "@/lib/api/client";
import { toast } from "sonner";

const DATE_LOCALES = { az, en: enUS, he, ar, ru };

export type BookingTour = {
  id: string;
  title: string;
  region: string;
  duration: string;
  price: number;
  image: string;
  // Selected dated tour: when present the travel date is fixed to it and the
  // per-person price is that tour's (catalog-inherited) price.
  tourId?: string;
  departureDate?: string; // YYYY-MM-DD
};

type Step = "details" | "payment" | "success";

interface Props {
  tour: BookingTour | null;
  open: boolean;
  lang: Lang;
  onOpenChange: (open: boolean) => void;
}

export function BookingDialog({ tour, open, lang, onOpenChange }: Props) {
  const lockedDate = tour?.departureDate ? new Date(tour.departureDate) : undefined;
  const [step, setStep] = useState<Step>("details");
  const [date, setDate] = useState<Date | undefined>(lockedDate);
  const [people, setPeople] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [processing, setProcessing] = useState(false);
  const copy = BOOKING_COPY[lang];
  const dateLocale = DATE_LOCALES[lang];
  const isRtl = lang === "ar" || lang === "he";

  const total = useMemo(() => (tour ? tour.price * people : 0), [tour, people]);

  // When a departure-bound tour is opened, lock the travel date to the departure.
  useEffect(() => {
    if (tour?.departureDate) setDate(new Date(tour.departureDate));
  }, [tour?.departureDate]);

  const reset = () => {
    setStep("details");
    setDate(lockedDate);
    setPeople(2);
    setName("");
    setEmail("");
    setPhone("");
    setCard("");
    setExpiry("");
    setCvc("");
    setProcessing(false);
  };

  const handleClose = (next: boolean) => {
    onOpenChange(next);
    if (!next) setTimeout(reset, 300);
  };

  const canContinue = !!date && people > 0 && name.trim() && email.trim();
  const canPay = card.replace(/\s/g, "").length >= 12 && expiry.length >= 4 && cvc.length >= 3;

  const handlePay = async () => {
    if (!tour) return;
    setProcessing(true);
    try {
      // Simulated payment step, then persist the reservation to the backend.
      await new Promise((r) => setTimeout(r, 1400));
      await submitBooking({
        tour_slug: tour.id,
        tour_title: tour.title,
        full_name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        people,
        date: date ? format(date, "yyyy-MM-dd") : null,
        tour_id: tour.tourId ?? null,
      });
      setStep("success");
      toast.success(copy.confirmed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : copy.confirmed);
    } finally {
      setProcessing(false);
    }
  };

  if (!tour) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        dir={isRtl ? "rtl" : "ltr"}
        className="max-h-[92dvh] max-w-2xl grid-rows-[auto_auto_minmax(0,1fr)] gap-0 overflow-hidden p-0"
      >
        {/* Header image */}
        <div className="relative h-36 w-full shrink-0 overflow-hidden sm:h-44">
          <img src={tour.image} alt={tour.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-green via-brand-green/45 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-1.5 text-xs font-medium text-white/90 drop-shadow">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" /> {tour.region}
            </div>
            <DialogTitle className="mt-1 font-display text-2xl font-bold text-white drop-shadow-md">
              {tour.title}
            </DialogTitle>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-border px-4 py-3 text-xs">
          {(["details", "payment", "success"] as Step[]).map((s, i) => {
            const active = step === s;
            const done = ["details", "payment", "success"].indexOf(step) > i;
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium",
                    active && "bg-primary text-primary-foreground",
                    done && "bg-brand-green text-on-green",
                    !active && !done && "bg-secondary text-muted-foreground",
                  )}
                >
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span
                  className={cn("font-medium text-muted-foreground", (active || done) && "font-semibold text-foreground")}
                >
                  {copy.steps[i]}
                </span>
                {i < 2 && <div className="mx-2 h-px w-8 bg-border" />}
              </div>
            );
          })}
        </div>

        <DialogDescription className="sr-only">{copy.description}</DialogDescription>

        <div className="min-h-0 overflow-y-auto px-5 pb-6 pt-4 sm:px-6">
          {step === "details" && (
            <div className="space-y-5">
              {/* Date — locked to the selected departure, or free-choice fallback */}
              <div className="space-y-2">
                <Label>{copy.travelDate}</Label>
                {tour.departureDate ? (
                  <div className="flex h-11 items-center gap-2 rounded-md border border-input bg-secondary/40 px-3 text-sm font-medium">
                    <CalendarIcon aria-hidden="true" className="h-4 w-4 text-accent-ink" />
                    {date && format(date, "d MMMM yyyy, EEEE", { locale: dateLocale })}
                  </div>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-11 w-full justify-start gap-2 text-start font-normal",
                          !date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="h-4 w-4" />
                        {date
                          ? format(date, "d MMMM yyyy, EEEE", { locale: dateLocale })
                          : copy.selectDate}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        locale={dateLocale}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {/* People */}
              <div className="space-y-2">
                <Label>{copy.peopleCount}</Label>
                <div className="flex h-11 items-center justify-between rounded-md border border-input bg-background px-3">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" /> {people} {copy.people}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="touch-target-square h-9 w-9"
                      aria-label={`-1 ${copy.people}`}
                      onClick={() => setPeople(Math.max(1, people - 1))}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">{people}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="touch-target-square h-9 w-9"
                      aria-label={`+1 ${copy.people}`}
                      onClick={() => setPeople(Math.min(20, people + 1))}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{copy.fullName}</Label>
                  <Input
                    id="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={copy.namePlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{copy.phone}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+994 50 000 00 00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{copy.email}</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={copy.emailPlaceholder}
                />
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between rounded-lg bg-secondary/60 p-4">
                <div className="text-sm text-muted-foreground flex items-center gap-3">
                  <Clock className="h-4 w-4" /> {tour.duration} · {people} {copy.people}
                </div>
                <div className="text-end">
                  <div className="text-xs text-muted-foreground">{copy.total}</div>
                  <div className="font-display text-xl font-bold tabular-nums text-accent-ink">{total} ₼</div>
                </div>
              </div>

              <Button
                className="w-full h-11"
                disabled={!canContinue}
                onClick={() => setStep("payment")}
              >
                {copy.continueToPayment}{" "}
                {isRtl ? <ArrowLeft className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-5">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{copy.date}</span>
                  <span className="font-medium">
                    {date && format(date, "d MMM yyyy", { locale: dateLocale })}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{copy.peopleCount}</span>
                  <span className="font-medium">{people}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">{copy.totalAmount}</span>
                  <span className="font-display text-2xl font-bold tabular-nums text-brand-orange">{total} ₼</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card">{copy.cardNumber}</Label>
                  <div className="relative">
                    <CreditCard
                      className={cn(
                        "absolute top-3.5 h-4 w-4 text-muted-foreground",
                        isRtl ? "right-3" : "left-3",
                      )}
                    />
                    <Input
                      id="card"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={card}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                        setCard(v.replace(/(\d{4})(?=\d)/g, "$1 "));
                      }}
                      placeholder="1234 5678 9012 3456"
                      className={isRtl ? "pr-9" : "pl-9"}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">{copy.expiry}</Label>
                    <Input
                      id="expiry"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={expiry}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                      }}
                      placeholder="MM/YY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-md bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                <ShieldCheck aria-hidden="true" className="h-4 w-4 text-accent-ink" />
                {copy.secureNote}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("details")}>
                  {isRtl ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}{" "}
                  {copy.back}
                </Button>
                <Button className="flex-1" disabled={!canPay || processing} onClick={handlePay}>
                  {processing ? copy.processing : `${copy.pay} ${total} ₼`}
                </Button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange/15">
                <CheckCircle2 aria-hidden="true" className="h-9 w-9 text-brand-orange" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold">{copy.confirmed}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {copy.confirmationPrefix}{" "}
                <span className="text-foreground font-medium">{email}</span>
                {copy.confirmationSuffix}
              </p>
              <div className="mx-auto mt-6 max-w-sm rounded-lg border border-border p-4 text-start text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{copy.tour}</span>
                  <span className="font-medium">{tour.title}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-muted-foreground">{copy.date}</span>
                  <span>{date && format(date, "d MMM yyyy", { locale: dateLocale })}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-muted-foreground">{copy.peopleCount}</span>
                  <span>{people}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground">{copy.amount}</span>
                  <span className="font-semibold tabular-nums text-accent-ink">{total} ₼</span>
                </div>
              </div>
              <Button className="mt-6 w-full" onClick={() => handleClose(false)}>
                {copy.close}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
