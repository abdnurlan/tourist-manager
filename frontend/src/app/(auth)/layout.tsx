"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { LoadingScreen } from "@/components/shared/loading-screen";

/**
 * Public auth group (login). Already-authenticated users are redirected
 * away to the dashboard (CONTRACT §12).
 */
export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const next = params.get("next");
      router.replace(next && next.startsWith("/") ? next : "/");
    }
  }, [isLoading, isAuthenticated, router, params]);

  if (isLoading || isAuthenticated) {
    return <LoadingScreen fullscreen />;
  }

  return <>{children}</>;
}
