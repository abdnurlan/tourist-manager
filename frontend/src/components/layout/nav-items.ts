import {
  LayoutDashboard,
  MapPinned,
  CalendarDays,
  Search,
  Sparkles,
  Settings,
  Compass,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { az } from "@/lib/i18n/az";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Compact label for the mobile bottom-nav (full `label` is too long for 6 tabs). */
  short?: string;
}

/** Primary navigation (CONTRACT §9.2, §12). Order is shared by sidebar + bottom-nav. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: az.nav.dashboard, icon: LayoutDashboard, short: "Ana" },
  { href: "/tours", label: az.nav.tours, icon: MapPinned, short: "Turlar" },
  { href: "/catalog", label: az.nav.catalog, icon: Compass, short: "Katalog" },
  { href: "/reservations", label: az.nav.reservations, icon: Ticket, short: "Rezerv" },
  { href: "/calendar", label: az.nav.calendar, icon: CalendarDays, short: "Təqvim" },
  { href: "/search", label: az.nav.search, icon: Search, short: "Axtarış" },
  { href: "/ai", label: az.nav.ai, icon: Sparkles, short: "AI" },
  { href: "/settings", label: az.nav.settings, icon: Settings, short: "Ayarlar" },
];

/** Bottom-nav shows the 5 most-used destinations (the full list of 8 would
 *  crowd the mobile bar). The sidebar carries everything; Settings stays here
 *  because on mobile it's the only path to settings + logout. */
export const BOTTOM_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter((i) =>
  ["/", "/tours", "/catalog", "/reservations", "/settings"].includes(i.href),
);

/** Active-state matcher that treats nested routes as active. */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
