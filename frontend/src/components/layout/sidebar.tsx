"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV_ITEMS, isNavActive } from "./nav-items";
import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/auth-context";
import { az } from "@/lib/i18n/az";
import { initials } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/** Map a role token to its Azerbaijani label (only "admin" exists today). */
function roleLabel(role: string | undefined): string {
  const map: Record<string, string> = { admin: az.settings.role_admin };
  return (role && map[role]) ?? az.settings.role_admin;
}

/** Desktop fixed left sidebar (CONTRACT §11.9). Hidden < md. */
export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-surface md:flex">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-border/70 px-5">
        <Logo size={72} className="size-9 shrink-0" />
        <div className="leading-tight">
          <p className="font-display text-base font-semibold tracking-tight text-foreground">
            {az.app.name}
          </p>
          <p className="text-xs text-muted-foreground">{az.app.tagline}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-fast ease-out",
                active
                  ? "bg-accent-subtle text-accent"
                  : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-terracotta" />
              )}
              <Icon className="size-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Account */}
      <div className="border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-9">
              <AvatarFallback>{initials(user?.username ?? "?")}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.username ?? "—"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {az.settings.role}: {roleLabel(user?.role)}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuLabel>{user?.username}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={() => void logout()}>
              <LogOut />
              {az.action.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
