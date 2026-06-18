"use client";

import { UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { az } from "@/lib/i18n/az";
import { initials } from "@/lib/utils/format";
import type { User } from "@/lib/types";

export interface ProfileCardProps {
  user: User | null | undefined;
  loading?: boolean;
}

/** Profil — admin identity from /auth/me. */
export function ProfileCard({ user, loading }: ProfileCardProps) {
  return (
    <Card ticket className="py-5 pr-5 md:py-6 md:pr-6">
      <div className="flex items-center gap-4">
        {loading ? (
          <Skeleton className="size-14 rounded-full" />
        ) : (
          <Avatar className="size-14 ring-1 ring-border">
            <AvatarFallback className="font-display text-h3">
              {initials(user?.username ?? "?")}
            </AvatarFallback>
          </Avatar>
        )}

        <div className="min-w-0 flex-1">
          {loading ? (
            <>
              <Skeleton className="h-5 w-32 rounded-md" />
              <Skeleton className="mt-2 h-4 w-20 rounded-md" />
            </>
          ) : (
            <>
              <p className="truncate font-display text-h3 font-semibold leading-tight tracking-tight text-foreground">
                {user?.username}
              </p>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserRound className="size-3.5" />
                <span>{az.settings.profile}</span>
              </div>
            </>
          )}
        </div>

        {!loading && (
          <Badge variant="accent" className="shrink-0">
            {az.settings.role_admin}
          </Badge>
        )}
      </div>
    </Card>
  );
}
