"use client";

import { useState } from "react";
import { CalendarDays, Trash2 } from "lucide-react";

import { BottomSheetForm } from "@/components/shared/bottom-sheet-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useDepartures,
  useCreateDeparture,
  useDeleteDeparture,
} from "@/lib/hooks/use-departures";
import { az } from "@/lib/i18n/az";
import type { Departure } from "@/lib/types";

interface DeparturesPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tourId: string;
  basePrice: number;
}

const t = az.catalog.departures;

/**
 * DeparturesPanel manages the dated departures of one catalog tour: it lists the
 * existing departures (with price, seats and status) and offers an inline form
 * to add a new one. A departure's price is optional — empty inherits basePrice.
 */
export function DeparturesPanel({ open, onOpenChange, tourId, basePrice }: DeparturesPanelProps) {
  const { data: departures, isLoading } = useDepartures(open ? tourId : null);
  const create = useCreateDeparture(tourId);
  const remove = useDeleteDeparture(tourId);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("12");
  const [deleting, setDeleting] = useState<Departure | null>(null);

  function add() {
    if (!start) return;
    create.mutate(
      {
        start_date: start,
        end_date: end || null,
        price: price ? Number(price) : null,
        capacity: capacity ? Number(capacity) : 12,
      },
      {
        onSuccess: () => {
          setStart("");
          setEnd("");
          setPrice("");
          setCapacity("12");
        },
      },
    );
  }

  return (
    <>
      <BottomSheetForm open={open} onOpenChange={onOpenChange} title={t.title}>
        <div className="space-y-4">
          {/* Existing departures */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">…</p>
          ) : !departures || departures.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.empty}</p>
          ) : (
            <ul className="space-y-2">
              {departures.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <CalendarDays className="size-4 text-accent" />
                    <span>
                      {d.start_date}
                      {d.end_date ? ` – ${d.end_date}` : ""} · {d.price ?? basePrice} ₼ ·{" "}
                      {d.booked}/{d.capacity} {t.seats} ·{" "}
                      <span className="text-muted-foreground">{t.status[d.status]}</span>
                    </span>
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={az.action.delete}
                    onClick={() => setDeleting(d)}
                    className="text-danger hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {/* Add form */}
          <div className="rounded-lg border border-dashed border-border p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="dep-start">{t.start_date}</Label>
                <Input
                  id="dep-start"
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dep-end">{t.end_date}</Label>
                <Input
                  id="dep-end"
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dep-price">{az.catalog.fields.price}</Label>
                <Input
                  id="dep-price"
                  type="number"
                  placeholder={t.price_hint}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dep-capacity">{t.capacity}</Label>
                <Input
                  id="dep-capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="mt-3 w-full"
              onClick={add}
              disabled={!start || create.isPending}
            >
              {t.add}
            </Button>
          </div>
        </div>
      </BottomSheetForm>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
          setDeleting(null);
        }}
        description={t.delete_confirm}
        loading={remove.isPending}
      />
    </>
  );
}
