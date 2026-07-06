"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarRange,
  Clock3,
  Download,
  FileText,
  MapPin,
  Printer,
} from "lucide-react";
import { PageBody, PageHeader } from "@/components/layout/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listTourEvents } from "@/lib/api/events";
import { listTours } from "@/lib/api/tours";
import { queryKeys } from "@/lib/query";
import { az, eventTypeLabel } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";
import {
  dateOnly,
  formatDateRange,
  formatLongDate,
  formatTime,
  parseDateISO,
  todayISO,
} from "@/lib/utils/date";
import type { Event, Tour } from "@/lib/types";

function dayDiff(startISO: string, endISO: string): number {
  const start = parseDateISO(startISO).getTime();
  const end = parseDateISO(endISO).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

function tourDuration(tour: Tour): number {
  return dayDiff(tour.start_date, tour.end_date) + 1;
}

function tourProgress(tour: Tour): number {
  const today = todayISO();
  const start = dateOnly(tour.start_date);
  const end = dateOnly(tour.end_date);
  if (today < start) return 0;
  if (today > end) return 100;
  return Math.round(((dayDiff(start, today) + 1) / tourDuration(tour)) * 100);
}

function generatedStamp(): string {
  const now = new Date();
  return `${formatLongDate(todayISO())}, ${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
}

function nextEvents(events: Event[]): Event[] {
  const today = todayISO();
  return [...events]
    .filter((event) => dateOnly(event.date) >= today)
    .sort((a, b) => {
      const byDate = dateOnly(a.date).localeCompare(dateOnly(b.date));
      if (byDate !== 0) return byDate;
      return (a.time ?? "99:99").localeCompare(b.time ?? "99:99");
    })
    .slice(0, 5);
}

export default function ActiveToursExportPage() {
  const sheetRef = useRef<HTMLElement | null>(null);
  const [downloading, setDownloading] = useState(false);
  const generated = useMemo(() => generatedStamp(), []);
  const toursQuery = useQuery({
    queryKey: queryKeys.tours({ status: "active" }),
    queryFn: () => listTours({ status: "active" }),
  });

  const tours = useMemo(
    () =>
      [...(toursQuery.data ?? [])].sort((a, b) =>
        dateOnly(a.start_date).localeCompare(dateOnly(b.start_date)),
      ),
    [toursQuery.data],
  );

  const eventQueries = useQueries({
    queries: tours.map((tour) => ({
      queryKey: queryKeys.tourEvents(tour.id),
      queryFn: () => listTourEvents(tour.id),
      enabled: Boolean(tour.id),
    })),
  });

  const totalEvents = tours.reduce((sum, tour) => sum + (tour.events_count ?? 0), 0);
  const loading = toursQuery.isLoading || eventQueries.some((query) => query.isLoading);
  const error = toursQuery.isError || eventQueries.some((query) => query.isError);
  const canExport = !loading && !error && tours.length > 0;

  const downloadPdf = async () => {
    if (!sheetRef.current) return;

    setDownloading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(sheetRef.current, {
        backgroundColor: "#ffffff",
        scale: Math.min(2, window.devicePixelRatio || 1),
        useCORS: true,
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL("image/png");

      let y = 0;
      pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);

      let remaining = imgHeight - pageHeight;
      while (remaining > 0) {
        y -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight);
        remaining -= pageHeight;
      }

      pdf.save(`aktiv-turlar-${todayISO()}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <PageTransition>
      <PageHeader
        title={az.calendar.export_title}
        subtitle={az.calendar.export_subtitle}
        actions={
          <div className="export-toolbar flex items-center gap-2">
            <Button asChild variant="secondary" size="sm" className="rounded-xl">
              <Link href="/calendar">
                <ArrowLeft className="size-4" />
                {az.action.back}
              </Link>
            </Button>
            <Button
              size="sm"
              className="rounded-xl"
              onClick={downloadPdf}
              loading={downloading}
              disabled={!canExport}
            >
              {!downloading && <Download className="size-4" />}
              {downloading ? az.calendar.preparing_pdf : az.calendar.download_pdf}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-xl"
              onClick={() => window.print()}
              disabled={!canExport}
            >
              <Printer className="size-4" />
              {az.calendar.print}
            </Button>
          </div>
        }
        className="export-toolbar"
      />

      <PageBody>
        {loading ? (
          <ExportSkeleton />
        ) : error ? (
          <EmptyState
            icon={FileText}
            title={az.common.error_title}
            subtitle={az.common.error_subtitle}
          />
        ) : tours.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title={az.calendar.active_tours_empty}
            subtitle={az.empty.tours.subtitle}
          />
        ) : (
          <section
            ref={sheetRef}
            className="export-sheet overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
          >
            <div className="relative border-b border-border bg-accent px-6 py-7 text-accent-foreground sm:px-8">
              <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_70%_30%,rgba(233,121,13,0.35),transparent_48%)]" />
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground/70">
                    {az.app.name}
                  </p>
                  <h1 className="mt-2 font-display text-4xl font-semibold leading-none tracking-tight">
                    {az.calendar.export_title}
                  </h1>
                  <p className="mt-3 max-w-xl text-sm text-accent-foreground/78">
                    {az.calendar.export_subtitle}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[280px]">
                  <Metric value={tours.length} label={az.common.tours} />
                  <Metric value={totalEvents} label={az.common.events} />
                  <Metric value={generated} label={az.calendar.generated_at} wide />
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-7">
              {tours.map((tour, index) => {
                const events = eventQueries[index]?.data ?? [];
                return (
                  <TourExportBlock
                    key={tour.id}
                    tour={tour}
                    events={events}
                    index={index + 1}
                  />
                );
              })}
            </div>
          </section>
        )}
      </PageBody>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          body {
            background: #ffffff !important;
          }

          body * {
            visibility: hidden !important;
          }

          .export-sheet,
          .export-sheet * {
            visibility: visible !important;
          }

          .export-sheet {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 100% !important;
            border: 0 !important;
            box-shadow: none !important;
          }

          .export-toolbar {
            display: none !important;
          }

          .tour-export-block {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </PageTransition>
  );
}

function Metric({
  value,
  label,
  wide,
}: {
  value: string | number;
  label: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-accent-foreground/18 bg-accent-foreground/8 px-2.5 py-2",
        wide && "col-span-3 sm:col-span-1",
      )}
    >
      <p className="truncate font-display text-lg font-semibold leading-none tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-accent-foreground/65">
        {label}
      </p>
    </div>
  );
}

function TourExportBlock({
  tour,
  events,
  index,
}: {
  tour: Tour;
  events: Event[];
  index: number;
}) {
  const progress = tourProgress(tour);
  const upcoming = nextEvents(events);

  return (
    <article className="tour-export-block overflow-hidden rounded-lg border border-border bg-background/55">
      <div className="grid gap-0 md:grid-cols-[1fr_240px]">
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-terracotta text-sm font-bold text-terracotta-foreground">
              {index}
            </span>
            <StatusBadge tourStatus={tour.status} />
            <Badge variant="outline">
              {tourDuration(tour)} {az.common.days}
            </Badge>
          </div>

          <h2 className="mt-3 font-display text-2xl font-semibold leading-tight tracking-tight">
            {tour.title}
          </h2>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarRange className="size-4" />
              {formatDateRange(tour.start_date, tour.end_date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-4" />
              {progress}%
            </span>
          </div>

          {tour.description && (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/78">
              {tour.description}
            </p>
          )}

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-terracotta"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="border-t border-border bg-surface p-5 md:border-l md:border-t-0">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {az.dashboard.upcoming_events}
          </p>
          <div className="mt-3 space-y-2.5">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">{az.calendar.no_events}</p>
            ) : (
              upcoming.map((event) => (
                <div key={event.id} className="rounded-md border border-border/70 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate text-sm font-semibold">
                      {event.title}
                    </p>
                    <span className="shrink-0 font-display text-xs tabular-nums text-muted-foreground">
                      {formatTime(event.time)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatLongDate(event.date)} · {eventTypeLabel(event.type)}
                  </p>
                  {event.location && (
                    <p className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-foreground/70">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ExportSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <Skeleton className="h-24 w-full" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  );
}
