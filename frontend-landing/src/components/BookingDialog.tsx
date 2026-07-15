import { useMemo, useState } from "react";
import { format } from "date-fns";
import { az } from "date-fns/locale";
import { CalendarIcon, MapPin, Clock, Users, ArrowRight, ArrowLeft, CheckCircle2, CreditCard, ShieldCheck, Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type BookingTour = {
  id: string;
  title: string;
  region: string;
  duration: string;
  price: number;
  image: string;
};

type Step = "details" | "payment" | "success";

interface Props {
  tour: BookingTour | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDialog({ tour, open, onOpenChange }: Props) {
  const [step, setStep] = useState<Step>("details");
  const [date, setDate] = useState<Date | undefined>();
  const [people, setPeople] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [processing, setProcessing] = useState(false);

  const total = useMemo(() => (tour ? tour.price * people : 0), [tour, people]);

  const reset = () => {
    setStep("details");
    setDate(undefined);
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
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1400));
    setProcessing(false);
    setStep("success");
    toast.success("Rezervasiya təsdiqləndi!");
  };

  if (!tour) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        {/* Header image */}
        <div className="relative h-44 w-full overflow-hidden">
          <img src={tour.image} alt={tour.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-1.5 text-xs text-background/90 drop-shadow">
              <MapPin className="h-3.5 w-3.5" /> {tour.region}
            </div>
            <DialogTitle className="mt-1 font-display text-2xl font-medium text-background drop-shadow">
              {tour.title}
            </DialogTitle>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 border-b border-border px-6 py-3 text-xs">
          {(["details", "payment", "success"] as Step[]).map((s, i) => {
            const active = step === s;
            const done = ["details", "payment", "success"].indexOf(step) > i;
            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium",
                    active && "bg-primary text-primary-foreground",
                    done && "bg-accent text-accent-foreground",
                    !active && !done && "bg-secondary text-muted-foreground",
                  )}
                >
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={cn("text-muted-foreground", (active || done) && "text-foreground")}>
                  {s === "details" ? "Detallar" : s === "payment" ? "Ödəniş" : "Təsdiq"}
                </span>
                {i < 2 && <div className="mx-2 h-px w-8 bg-border" />}
              </div>
            );
          })}
        </div>

        <DialogDescription className="sr-only">Tur rezervasiyası</DialogDescription>

        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6 pt-4">
          {step === "details" && (
            <div className="space-y-5">
              {/* Date */}
              <div className="space-y-2">
                <Label>Səyahət tarixi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal h-11", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "d MMMM yyyy, EEEE", { locale: az }) : "Tarix seç"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      locale={az}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* People */}
              <div className="space-y-2">
                <Label>Nəfər sayı</Label>
                <div className="flex h-11 items-center justify-between rounded-md border border-input bg-background px-3">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" /> {people} nəfər
                  </span>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setPeople(Math.max(1, people - 1))}>
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{people}</span>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setPeople(Math.min(20, people + 1))}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad və soyad</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ayan Məmmədov" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+994 50 000 00 00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sen@example.com" />
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between rounded-lg bg-secondary/60 p-4">
                <div className="text-sm text-muted-foreground flex items-center gap-3">
                  <Clock className="h-4 w-4" /> {tour.duration} · {people} nəfər
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Cəmi</div>
                  <div className="font-display text-xl font-medium text-primary">{total} ₼</div>
                </div>
              </div>

              <Button className="w-full h-11" disabled={!canContinue} onClick={() => setStep("payment")}>
                Ödənişə keç <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-5">
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tarix</span>
                  <span className="font-medium">{date && format(date, "d MMM yyyy", { locale: az })}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Nəfər</span>
                  <span className="font-medium">{people}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">Ümumi məbləğ</span>
                  <span className="font-display text-2xl font-medium text-primary">{total} ₼</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card">Kart nömrəsi</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="card"
                      value={card}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                        setCard(v.replace(/(\d{4})(?=\d)/g, "$1 "));
                      }}
                      placeholder="1234 5678 9012 3456"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Bitmə tarixi</Label>
                    <Input
                      id="expiry"
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
                    <Input id="cvc" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-md bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Ödənişiniz şifrələnir. Bu demo rejimidir — real kartdan məbləğ tutulmur.
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("details")}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Geri
                </Button>
                <Button className="flex-1" disabled={!canPay || processing} onClick={handlePay}>
                  {processing ? "Ödəniş edilir..." : `${total} ₼ ödə`}
                </Button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                <CheckCircle2 className="h-9 w-9 text-accent" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-medium">Rezervasiya təsdiqləndi</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Təsdiq detalları <span className="text-foreground font-medium">{email}</span> ünvanına göndərildi.
              </p>
              <div className="mx-auto mt-6 max-w-sm rounded-lg border border-border p-4 text-left text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Tur</span><span className="font-medium">{tour.title}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Tarix</span><span>{date && format(date, "d MMM yyyy", { locale: az })}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-muted-foreground">Nəfər</span><span>{people}</span></div>
                <div className="mt-2 flex justify-between border-t border-border pt-2"><span className="text-muted-foreground">Məbləğ</span><span className="font-medium text-primary">{total} ₼</span></div>
              </div>
              <Button className="mt-6 w-full" onClick={() => handleClose(false)}>Bağla</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
