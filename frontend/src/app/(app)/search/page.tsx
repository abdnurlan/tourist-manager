"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { PageHeader, PageBody } from "@/components/layout/page-header";
import { PageTransition } from "@/components/shared/page-transition";
import { SearchInput } from "@/components/search/search-input";
import { SearchResults } from "@/components/search/search-results";
import { useInstantSearch } from "@/components/search/use-search";
import { az } from "@/lib/i18n/az";
import type { Tour, EventWithTour } from "@/lib/types";

/** Axtarış — global instant search across tours + events (CONTRACT §6.6, §12). */
export default function SearchPage() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const { query, data, isIdle, isLoading, isFetching, isError, refetch } =
    useInstantSearch(value);

  const goToTour = useCallback(
    (tourId: string) => router.push(`/tours/${tourId}`),
    [router],
  );

  const handleSelectTour = useCallback(
    (tour: Tour) => goToTour(tour.id),
    [goToTour],
  );

  // Events open inside their parent tour detail timeline.
  const handleSelectEvent = useCallback(
    (event: EventWithTour) => goToTour(event.tour_id),
    [goToTour],
  );

  // Busy only when typing ahead of an already-shown result set.
  const busy = isFetching && !isLoading;

  return (
    <>
      <Topbar title={az.screen.search} />

      <PageTransition>
        <PageHeader title={az.screen.search} />

        <PageBody className="space-y-6">
          <SearchInput value={value} onChange={setValue} busy={busy} />

          <SearchResults
            query={query}
            data={data}
            isIdle={isIdle}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onSelectTour={handleSelectTour}
            onSelectEvent={handleSelectEvent}
          />
        </PageBody>
      </PageTransition>
    </>
  );
}
