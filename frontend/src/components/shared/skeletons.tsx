import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

/** Skeleton that mirrors the EventCard shape. */
export function EventCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("flex items-start gap-3.5 p-4", className)}>
      <Skeleton className="size-10 shrink-0 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

/** A list of N event skeletons. */
export function EventListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Skeleton for a tour card. */
export function TourCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("space-y-3 p-5", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-3 w-2/3" />
    </Card>
  );
}

/** Grid of stat-card skeletons. */
export function StatCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="space-y-3 p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-12" />
        </Card>
      ))}
    </div>
  );
}
