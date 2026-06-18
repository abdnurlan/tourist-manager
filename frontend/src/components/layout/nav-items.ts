import {
  LayoutDashboard,
  MapPinned,
  CalendarDays,
  Search,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { az } from "@/lib/i18n/az";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Primary navigation (CONTRACT §9.2, §12). Order is shared by sidebar + bottom-nav. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: az.nav.dashboard, icon: LayoutDashboard },
  { href: "/tours", label: az.nav.tours, icon: MapPinned },
  { href: "/calendar", label: az.nav.calendar, icon: CalendarDays },
  { href: "/search", label: az.nav.search, icon: Search },
  { href: "/ai", label: az.nav.ai, icon: Sparkles },
  { href: "/settings", label: az.nav.settings, icon: Settings },
];

/** Bottom-nav shows 5 items (settings reachable via topbar/menu on mobile). */
export const BOTTOM_NAV_ITEMS: NavItem[] = NAV_ITEMS.slice(0, 5);

/** Active-state matcher that treats nested routes as active. */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
