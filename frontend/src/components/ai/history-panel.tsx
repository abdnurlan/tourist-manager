"use client";

import { useQuery } from "@tanstack/react-query";
import { History, MessageSquareText } from "lucide-react";
import { aiHistory } from "@/lib/api/ai";
import { queryKeys } from "@/lib/query";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { HistoryItem } from "./history-item";

interface HistoryPanelProps {
  className?: string;
}

/** Past Telegram + web AI messages (GET /ai/history). */
export function HistoryPanel({ className }: HistoryPanelProps) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.aiHistory,
    queryFn: aiHistory,
  });

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col rounded-2xl border border-border bg-surface/70 shadow-sm",
        className,
      )}
    >
      <header className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-accent-subtle text-accent ring-1 ring-accent/15">
          <History className="size-4" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-sm font-semibold tracking-tight text-foreground">
            {az.ai.history_title}
          </h2>
          <p className="truncate text-xs text-muted-foreground">
            {az.ai.history_subtitle}
          </p>
        </div>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3">
          {isLoading ? (
            <ul className="flex flex-col gap-2.5">
              {Array.from({ length: 6 }).map((_, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-xl border border-border bg-surface p-3"
                >
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/5" />
                  </div>
                </li>
              ))}
            </ul>
          ) : !data || data.length === 0 ? (
            <EmptyState
              compact
              icon={MessageSquareText}
              title={az.ai.history_empty_title}
              subtitle={az.ai.history_empty_subtitle}
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {data.map((item, i) => (
                <HistoryItem key={item.id} item={item} index={i} />
              ))}
            </ul>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
