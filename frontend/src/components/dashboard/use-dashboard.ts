"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "@/lib/api/dashboard";
import { queryKeys } from "@/lib/query";
import type { DashboardResponse } from "@/lib/types";

/** GET /dashboard via TanStack Query (CONTRACT §6.2). */
export function useDashboard() {
  return useQuery<DashboardResponse>({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboard,
  });
}
