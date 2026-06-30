"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader, PageBody } from "@/components/layout/page-header";
import {
  PageTransition,
  StaggerList,
  StaggerItem,
} from "@/components/shared/page-transition";
import { ProfileCard } from "@/components/settings/profile-card";
import { LanguageCard, AboutCard } from "@/components/settings/info-cards";
import { TelegramCard } from "@/components/settings/telegram-card";
import { CurrencyCard } from "@/components/settings/currency-card";
import { LogoutSection } from "@/components/settings/logout-section";
import { me } from "@/lib/api/auth";
import { getDashboard } from "@/lib/api/dashboard";
import { useAuth } from "@/lib/auth/auth-context";
import { queryKeys } from "@/lib/query";
import { az } from "@/lib/i18n/az";

/** Tənzimləmələr — profil, dil, Telegram, valyuta, haqqında, çıxış (CONTRACT §12). */
export default function SettingsPage() {
  const { user: cachedUser } = useAuth();

  // Fresh admin identity from /auth/me (placeholder = cached AuthContext user).
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: queryKeys.me,
    queryFn: me,
    initialData: cachedUser ?? undefined,
  });

  // Telegram status comes from the dashboard composite (CONTRACT §6.2).
  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboard,
  });

  return (
    <PageTransition>
      <PageHeader title={az.screen.settings} subtitle={az.settings.subtitle} />

      <PageBody>
          <StaggerList className="mx-auto flex max-w-2xl flex-col gap-4">
            <StaggerItem>
              <ProfileCard user={user} loading={userLoading && !user} />
            </StaggerItem>

            <StaggerItem>
              <LanguageCard />
            </StaggerItem>

            <StaggerItem>
              <TelegramCard
                status={dashboard?.telegram_status}
                loading={dashLoading}
              />
            </StaggerItem>

            <StaggerItem>
              <CurrencyCard />
            </StaggerItem>

            <StaggerItem>
              <AboutCard />
            </StaggerItem>

            <StaggerItem>
              <LogoutSection />
            </StaggerItem>
          </StaggerList>
        </PageBody>
    </PageTransition>
  );
}
