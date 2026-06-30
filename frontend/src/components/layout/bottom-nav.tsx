"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { BOTTOM_NAV_ITEMS, isNavActive } from "./nav-items";
import { cn } from "@/lib/utils/cn";

/** Mobile bottom navigation (CONTRACT §11.9). Hidden >= md. Glass sticky. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-30 border-t border-border md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-1 pb-[calc(env(safe-area-inset-bottom))] pt-1.5">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="relative flex min-h-[52px] flex-col items-center justify-center gap-1 px-0.5 py-1.5 text-[10px] font-medium"
              >
                {/* Active = solid navy chip carrying a white icon. The chip
                    slides between tabs via the shared layoutId. */}
                <span className="relative flex h-8 w-11 items-center justify-center">
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-active"
                      className="absolute inset-0 rounded-2xl bg-accent shadow-sm"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <Icon
                    className={cn(
                      "relative size-[21px] transition-colors duration-fast",
                      active ? "text-accent-foreground" : "text-muted-foreground",
                    )}
                    strokeWidth={active ? 2.4 : 2}
                  />
                </span>
                <span
                  className={cn(
                    "max-w-full truncate transition-colors duration-fast",
                    active ? "font-semibold text-accent" : "text-muted-foreground",
                  )}
                >
                  {item.short ?? item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
