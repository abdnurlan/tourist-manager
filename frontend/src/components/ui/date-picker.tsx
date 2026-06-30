"use client";

import * as React from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { buildMonthGrid } from "@/components/calendar/calendar-utils";
import {
  parseDateISO,
  toDateISO,
  todayISO,
  monthName,
  formatLongDate,
} from "@/lib/utils/date";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";

export interface DatePickerProps {
  /** Selected date as plain YYYY-MM-DD ("" when empty). */
  value?: string;
  onChange: (iso: string) => void;
  /** Inclusive bounds (YYYY-MM-DD). Days outside are disabled. */
  min?: string;
  max?: string;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  /** Show a "clear" control (for optional fields). */
  clearable?: boolean;
  "aria-invalid"?: boolean;
  className?: string;
}

const CHEVRON =
  "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Custom calendar date picker — replaces the native <input type="date"> popup
 * with an in-brand month grid (Monday-first, navy selection, today ring,
 * terracotta weekends). All dates are plain YYYY-MM-DD, no timezone drift.
 */
export function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder = "Tarix seçin",
  id,
  disabled,
  clearable,
  className,
  ...rest
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"days" | "months">("days");
  const [anchor, setAnchor] = React.useState(() => value || todayISO());

  // On open, jump the grid to the selected month (or today) and reset to days.
  React.useEffect(() => {
    if (open) {
      setAnchor(value || todayISO());
      setMode("days");
    }
    // Only react to open/close; value is read at that moment intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const anchorDate = parseDateISO(anchor);
  const month = anchorDate.getMonth();
  const year = anchorDate.getFullYear();
  const grid = React.useMemo(() => buildMonthGrid(anchor), [anchor]);
  const today = todayISO();

  const outOfRange = (iso: string) =>
    Boolean((min && iso < min) || (max && iso > max));

  const stepMonth = (dir: -1 | 1) =>
    setAnchor(toDateISO(new Date(year, month + dir, 1)));
  const stepYear = (dir: -1 | 1) =>
    setAnchor(toDateISO(new Date(year + dir, month, 1)));

  const pick = (iso: string) => {
    if (outOfRange(iso)) return;
    onChange(iso);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          aria-invalid={rest["aria-invalid"]}
          className={cn(
            "flex h-11 w-full items-center gap-2 rounded-md border border-border bg-surface px-3.5 py-2 text-left text-body shadow-xs transition-colors duration-fast ease-out",
            "hover:border-accent/40",
            "focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25",
            "aria-[invalid=true]:border-danger",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn("flex-1 truncate", value ? "text-foreground" : "text-muted-foreground")}>
            {value ? formatLongDate(value) : placeholder}
          </span>
          {clearable && value && (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Təmizlə"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange("");
              }}
              className="-mr-1 flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[19.5rem] p-3">
        {/* Header: ‹ Month Year › */}
        <div className="mb-2 flex items-center justify-between gap-1">
          <button
            type="button"
            aria-label="Əvvəlki"
            className={CHEVRON}
            onClick={() => (mode === "days" ? stepMonth(-1) : stepYear(-1))}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setMode((m) => (m === "days" ? "months" : "days"))}
            className="rounded-md px-3 py-1 font-display text-sm font-semibold tracking-tight text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {mode === "days" ? `${monthName(month)} ${year}` : year}
          </button>
          <button
            type="button"
            aria-label="Növbəti"
            className={CHEVRON}
            onClick={() => (mode === "days" ? stepMonth(1) : stepYear(1))}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {mode === "days" ? (
          <>
            {/* Weekday header (Monday-first) */}
            <div className="grid grid-cols-7">
              {az.calendar.weekdaysShort.map((wd, i) => (
                <div
                  key={wd}
                  className={cn(
                    "pb-1 text-center text-[10px] font-semibold uppercase tracking-[0.06em]",
                    i >= 5 ? "text-terracotta/70" : "text-muted-foreground",
                  )}
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* 7×6 day grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {grid.map((date) => {
                const iso = toDateISO(date);
                const inMonth = date.getMonth() === month;
                const isToday = iso === today;
                const isSelected = iso === value;
                const isWeekend = (date.getDay() + 6) % 7 >= 5;
                const isDisabled = outOfRange(iso);
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => pick(iso)}
                    className={cn(
                      "relative flex h-9 items-center justify-center rounded-lg text-sm tabular-nums transition-colors",
                      "hover:bg-accent-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      inMonth ? "text-foreground" : "text-muted-foreground/40",
                      isWeekend && inMonth && !isSelected && "text-terracotta",
                      isToday && !isSelected && "font-semibold ring-1 ring-inset ring-accent/45",
                      isSelected &&
                        "bg-accent font-semibold text-accent-foreground shadow-xs hover:bg-accent-hover",
                      isDisabled && "pointer-events-none opacity-30",
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer: Today shortcut */}
            <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
              <button
                type="button"
                disabled={outOfRange(today)}
                onClick={() => pick(today)}
                className="rounded-md px-2 py-1 text-xs font-semibold text-accent transition-colors hover:bg-accent-subtle disabled:opacity-40"
              >
                {az.calendar.today}
              </button>
            </div>
          </>
        ) : (
          /* Month picker */
          <div className="grid grid-cols-3 gap-1.5 py-1">
            {az.calendar.monthsShort.map((mn, i) => {
              const selected = i === month;
              return (
                <button
                  key={mn}
                  type="button"
                  onClick={() => {
                    setAnchor(toDateISO(new Date(year, i, 1)));
                    setMode("days");
                  }}
                  className={cn(
                    "rounded-lg py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "bg-accent font-semibold text-accent-foreground"
                      : "text-foreground hover:bg-accent-subtle",
                  )}
                >
                  {mn}
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export interface DateTimePickerProps {
  /** "YYYY-MM-DDTHH:mm" (datetime-local value) or "". */
  value?: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Date + time picker (for reminders). Custom calendar for the date part plus a
 * compact time field — produces a standard datetime-local "YYYY-MM-DDTHH:mm".
 */
export function DateTimePicker({
  value,
  onChange,
  id,
  disabled,
  placeholder,
  className,
}: DateTimePickerProps) {
  const date = value ? value.slice(0, 10) : "";
  const time = value && value.length >= 16 ? value.slice(11, 16) : "";

  const setDate = (iso: string) => {
    if (!iso) return onChange("");
    onChange(`${iso}T${time || "09:00"}`);
  };
  const setTime = (t: string) => {
    if (!date) return; // pick a date first
    onChange(`${date}T${t || "09:00"}`);
  };

  return (
    <div className={cn("grid grid-cols-[1fr_7.5rem] gap-2", className)}>
      <DatePicker
        id={id}
        value={date}
        onChange={setDate}
        disabled={disabled}
        clearable
        placeholder={placeholder}
      />
      <Input
        type="time"
        value={time}
        disabled={disabled || !date}
        onChange={(e) => setTime(e.target.value)}
        aria-label="Saat"
      />
    </div>
  );
}
