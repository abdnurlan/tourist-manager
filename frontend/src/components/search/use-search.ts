"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { search } from "@/lib/api/search";
import type { SearchResponse } from "@/lib/types";

/** Debounce any fast-changing value (default 280ms). */
export function useDebouncedValue<T>(value: T, delay = 280): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export interface UseInstantSearchResult {
  /** Trimmed query that the active request was issued for. */
  query: string;
  data: SearchResponse | undefined;
  /** Fetching with no usable query yet → idle empty state. */
  isIdle: boolean;
  /** Initial load for the current query (no previous data to show). */
  isLoading: boolean;
  /** Background refetch while debounced query changes. */
  isFetching: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * Debounced instant search against GET /search?q=.
 * Returns grouped tours + events, keeping previous results visible while the
 * next debounced query loads (no jarring flicker).
 */
export function useInstantSearch(rawQuery: string): UseInstantSearchResult {
  const debounced = useDebouncedValue(rawQuery.trim(), 280);
  const enabled = debounced.length > 0;

  const q = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => search(debounced),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  return {
    query: debounced,
    data: enabled ? q.data : undefined,
    isIdle: !enabled,
    isLoading: enabled && q.isLoading,
    isFetching: enabled && q.isFetching,
    isError: q.isError,
    refetch: () => void q.refetch(),
  };
}
