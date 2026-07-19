"use client";

/* ─────────────────────────────────────────────────────────────
   TanStack Query provider + shared QueryClient (CONTRACT §1)
   ───────────────────────────────────────────────────────────── */

import { useState } from "react";
import type { ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";
import { ApiClientError } from "@/lib/api/axios";

const config: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Never retry auth / not-found / validation errors.
        if (error instanceof ApiClientError) {
          if ([400, 401, 403, 404, 422].includes(error.status)) return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
};

export function makeQueryClient(): QueryClient {
  return new QueryClient(config);
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // One client per browser session; lazy-init avoids SSR sharing.
  const [client] = useState(makeQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

/** Centralized query keys for cache consistency across screen agents. */
export const queryKeys = {
  dashboard: ["dashboard"] as const,
  tours: (filters?: unknown) => ["tours", filters ?? null] as const,
  tour: (id: string) => ["tour", id] as const,
  tourEvents: (id: string) => ["tour", id, "events"] as const,
  tourGuests: (id: string) => ["tour", id, "guests"] as const,
  event: (id: string) => ["event", id] as const,
  calendar: (filters?: unknown) => ["calendar", filters ?? null] as const,
  calendarTours: (filters?: unknown) =>
    ["calendar", "tours", filters ?? null] as const,
  search: (q: string) => ["search", q] as const,
  aiHistory: ["ai", "history"] as const,
  me: ["auth", "me"] as const,
  catalogTours: (filters?: unknown) => ["catalog-tours", filters ?? null] as const,
  catalogTour: (id: string) => ["catalog-tour", id] as const,
  bookings: (filters?: unknown) => ["bookings", filters ?? null] as const,
};
