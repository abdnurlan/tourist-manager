"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { AppShell } from "@/components/layout/app-shell";
import { LoadingScreen } from "@/components/shared/loading-screen";

/**
 * Protected route-group layout (CONTRACT §8, §12).
 * Redirects unauthenticated users to /login and wraps every screen in the
 * AppShell (desktop sidebar / mobile bottom-nav + FAB).
 */
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  // While bootstrapping the token, or before redirect, show the loading screen.
  if (isLoading || !isAuthenticated) {
    return <LoadingScreen fullscreen />;
  }

  return <AppShell>{children}</AppShell>;
}
