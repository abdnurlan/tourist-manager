"use client";

/* ─────────────────────────────────────────────────────────────
   Ana səhifə (Dashboard) — route "/" (CONTRACT §6.2, §9.10, §12)
   GET /dashboard composite aggregate.
   ───────────────────────────────────────────────────────────── */

import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  CalendarClock,
  MapPinned,
  CalendarRange,
  ListTodo,
  BellRing,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { PageBody } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { EventCard } from "@/components/shared/event-card";
import { EmptyState } from "@/components/shared/empty-state";
import {
  PageTransition,
  StaggerList,
  StaggerItem,
} from "@/components/shared/page-transition";
import {
  EventCardSkeleton,
  TourCardSkeleton,
  StatCardsSkeleton,
} from "@/components/shared/skeletons";
import { useAuth } from "@/lib/auth/auth-context";
import { az } from "@/lib/i18n/az";
import { sortByTime } from "@/lib/utils/date";

import { useDashboard } from "@/components/dashboard/use-dashboard";
import { DashboardMasthead } from "@/components/dashboard/dashboard-masthead";
import { SectionCard } from "@/components/dashboard/section-card";
import { TourMiniCard } from "@/components/dashboard/tour-mini-card";
import { ReminderItem } from "@/components/dashboard/reminder-item";
import { ActivityItem } from "@/components/dashboard/activity-item";
import { TelegramCard } from "@/components/dashboard/telegram-card";
import { WeatherCard } from "@/components/dashboard/weather-card";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading, isError, refetch, isFetching } = useDashboard();

  return (
    <PageTransition>
      <Topbar
        leading={
          <span className="text-h3 font-semibold tracking-tight text-foreground md:hidden">
            {az.screen.dashboard}
          </span>
        }
        actions={
          // Desktop only — on mobile the floating action button covers "new tour",
          // so showing both here would be redundant.
          <Button
            variant="primary"
            size="sm"
            className="max-md:hidden"
            onClick={() => router.push("/tours/new")}
          >
            <MapPinned className="size-4" />
            {az.dashboard.quick_new_tour}
          </Button>
        }
      />

      <PageBody className="space-y-8 md:pt-8">
        <DashboardMasthead username={user?.username} />

        {/* Error state */}
        {isError ? (
          <EmptyState
            icon={Activity}
            title={az.common.error_title}
            subtitle={az.common.error_subtitle}
            action={
              <Button variant="secondary" onClick={() => refetch()} loading={isFetching}>
                {az.action.retry}
              </Button>
            }
          />
        ) : (
          <>
            {/* ── Stats row ─────────────────────────────────────── */}
            {isLoading ? (
              <StatCardsSkeleton count={3} />
            ) : (
              <StaggerList className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StaggerItem>
                  <StatCard
                    label={az.dashboard.stat_active_tours}
                    value={data?.total_active_tours ?? 0}
                    icon={MapPinned}
                    tone="accent"
                  />
                </StaggerItem>
                <StaggerItem>
                  <StatCard
                    label={az.dashboard.stat_today_events}
                    value={data?.today_events.length ?? 0}
                    icon={CalendarCheck}
                    tone="info"
                  />
                </StaggerItem>
                <StaggerItem className="max-lg:col-span-2">
                  <StatCard
                    label={az.dashboard.stat_waiting}
                    value={data?.events_waiting_today ?? 0}
                    icon={ListTodo}
                    tone="terracotta"
                    hint={az.dashboard.waiting_today}
                  />
                </StaggerItem>
              </StaggerList>
            )}

            {/* ── Quick actions ─────────────────────────────────── */}
            <QuickActions />

            {/* ── Two-column layout (desktop) / stacked (mobile) ── */}
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Primary column */}
              <div className="space-y-8 lg:col-span-2">
                {/* Bu günün eventləri */}
                <SectionCard
                  title={az.dashboard.today_events}
                  icon={<CalendarCheck className="size-5" />}
                  bare
                >
                  {isLoading ? (
                    <div className="space-y-3">
                      <EventCardSkeleton />
                      <EventCardSkeleton />
                    </div>
                  ) : data && data.today_events.length > 0 ? (
                    <StaggerList className="space-y-3">
                      {sortByTime(data.today_events).map((event) => (
                        <StaggerItem key={event.id}>
                          <EventCard
                            event={event}
                            onClick={() => router.push(`/tours/${event.tour_id}`)}
                          />
                        </StaggerItem>
                      ))}
                    </StaggerList>
                  ) : (
                    <Card className="glass">
                      <EmptyState
                        icon={CalendarCheck}
                        title={az.empty.today.title}
                        subtitle={az.empty.today.subtitle}
                        compact
                      />
                    </Card>
                  )}
                </SectionCard>

                {/* Yaxınlaşan eventlər */}
                <SectionCard
                  title={az.dashboard.upcoming_events}
                  icon={<CalendarClock className="size-5" />}
                  action={
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => router.push("/calendar")}
                    >
                      {az.action.view_all}
                    </Button>
                  }
                  bare
                >
                  {isLoading ? (
                    <div className="space-y-3">
                      <EventCardSkeleton />
                      <EventCardSkeleton />
                    </div>
                  ) : data && data.upcoming_events.length > 0 ? (
                    <StaggerList className="space-y-3">
                      {data.upcoming_events.map((event) => (
                        <StaggerItem key={event.id}>
                          <EventCard
                            event={event}
                            onClick={() => router.push(`/tours/${event.tour_id}`)}
                          />
                        </StaggerItem>
                      ))}
                    </StaggerList>
                  ) : (
                    <Card className="glass">
                      <EmptyState
                        icon={CalendarClock}
                        title={az.dashboard.no_upcoming_events}
                        compact
                      />
                    </Card>
                  )}
                </SectionCard>

                {/* Aktiv turlar */}
                <SectionCard
                  title={az.dashboard.active_tours}
                  icon={<MapPinned className="size-5" />}
                  action={
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => router.push("/tours")}
                    >
                      {az.action.view_all}
                    </Button>
                  }
                  bare
                >
                  {isLoading ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TourCardSkeleton />
                      <TourCardSkeleton />
                    </div>
                  ) : data && data.active_tours.length > 0 ? (
                    <StaggerList className="grid gap-3 sm:grid-cols-2">
                      {data.active_tours.map((tour) => (
                        <StaggerItem key={tour.id}>
                          <TourMiniCard tour={tour} />
                        </StaggerItem>
                      ))}
                    </StaggerList>
                  ) : (
                    <Card className="glass">
                      <EmptyState
                        icon={MapPinned}
                        title={az.dashboard.no_active_tours}
                        compact
                      />
                    </Card>
                  )}
                </SectionCard>

                {/* Yaxınlaşan turlar */}
                <SectionCard
                  title={az.dashboard.upcoming_tours}
                  icon={<CalendarRange className="size-5" />}
                  bare
                >
                  {isLoading ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <TourCardSkeleton />
                      <TourCardSkeleton />
                    </div>
                  ) : data && data.upcoming_tours.length > 0 ? (
                    <StaggerList className="grid gap-3 sm:grid-cols-2">
                      {data.upcoming_tours.map((tour) => (
                        <StaggerItem key={tour.id}>
                          <TourMiniCard tour={tour} />
                        </StaggerItem>
                      ))}
                    </StaggerList>
                  ) : (
                    <Card className="glass">
                      <EmptyState
                        icon={CalendarRange}
                        title={az.dashboard.no_upcoming_tours}
                        compact
                      />
                    </Card>
                  )}
                </SectionCard>
              </div>

              {/* Sidebar column */}
              <aside className="space-y-8">
                {/* Bu gün gözləyən işlər */}
                <SectionCard
                  title={az.dashboard.waiting_today}
                  icon={<ListTodo className="size-5" />}
                >
                  {isLoading ? (
                    <div className="h-12 animate-pulse rounded-xl bg-surface-muted" />
                  ) : (data?.events_waiting_today ?? 0) > 0 ? (
                    <div className="flex items-center gap-3">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-terracotta-subtle font-display text-h2 font-semibold leading-none tabular-nums text-terracotta ring-1 ring-terracotta/15">
                        {data?.events_waiting_today}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {az.dashboard.waiting_today}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-success">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/12 ring-1 ring-success/15">
                        <CheckCircle2 className="size-5" strokeWidth={1.75} />
                      </span>
                      <p className="text-sm font-medium text-foreground">
                        {az.dashboard.waiting_today_done}
                      </p>
                    </div>
                  )}
                </SectionCard>

                {/* Bu günün xatırlatmaları */}
                <SectionCard
                  title={az.dashboard.today_reminders}
                  icon={<BellRing className="size-5" />}
                >
                  {isLoading ? (
                    <div className="space-y-3">
                      <div className="h-10 animate-pulse rounded-lg bg-surface-muted" />
                      <div className="h-10 animate-pulse rounded-lg bg-surface-muted" />
                    </div>
                  ) : data && data.today_reminders.length > 0 ? (
                    <StaggerList className="space-y-3.5">
                      {data.today_reminders.map((reminder) => (
                        <StaggerItem key={reminder.id}>
                          <ReminderItem reminder={reminder} />
                        </StaggerItem>
                      ))}
                    </StaggerList>
                  ) : (
                    <EmptyState
                      icon={BellRing}
                      title={az.empty.reminders.title}
                      compact
                    />
                  )}
                </SectionCard>

                {/* Son fəaliyyət */}
                <SectionCard
                  title={az.dashboard.recent_activity}
                  icon={<Activity className="size-5" />}
                >
                  {isLoading ? (
                    <div className="space-y-3">
                      <div className="h-10 animate-pulse rounded-lg bg-surface-muted" />
                      <div className="h-10 animate-pulse rounded-lg bg-surface-muted" />
                      <div className="h-10 animate-pulse rounded-lg bg-surface-muted" />
                    </div>
                  ) : data && data.recent_activity.length > 0 ? (
                    <StaggerList className="space-y-3.5">
                      {data.recent_activity.map((item) => (
                        <StaggerItem key={item.id}>
                          <ActivityItem item={item} />
                        </StaggerItem>
                      ))}
                    </StaggerList>
                  ) : (
                    <EmptyState
                      icon={Activity}
                      title={az.empty.activity.title}
                      compact
                    />
                  )}
                </SectionCard>

                {/* Hava + Telegram statusu */}
                {isLoading ? (
                  <div className="space-y-8">
                    <div className="h-28 animate-pulse rounded-2xl bg-surface-muted" />
                    <div className="h-28 animate-pulse rounded-2xl bg-surface-muted" />
                  </div>
                ) : (
                  data && (
                    <div className="space-y-8">
                      <WeatherCard weather={data.weather} />
                      <TelegramCard status={data.telegram_status} />
                    </div>
                  )
                )}
              </aside>
            </div>
          </>
        )}
      </PageBody>
    </PageTransition>
  );
}
