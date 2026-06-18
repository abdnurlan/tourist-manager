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
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[calc(env(safe-area-inset-bottom))] pt-1.5">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = isNavActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 text-[11px] font-medium transition-colors duration-fast",
                  active ? "text-accent" : "text-muted-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-active"
                    className="absolute inset-x-2 top-1 h-8 rounded-md bg-accent-subtle"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative">
                  <Icon className="size-[22px]" strokeWidth={active ? 2.25 : 2} />
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-dot"
                      className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-terracotta"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                </span>
                <span className="relative truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
