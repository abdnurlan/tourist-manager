"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";

export interface FloatingActionButtonProps {
  /** Custom handler; defaults to navigating to /tours/new. */
  onClick?: () => void;
  label?: string;
  className?: string;
}

/** Routes where the quick-create FAB must never appear. */
const FAB_HIDDEN_ROUTES = ["/ai", "/login"];

/** Mobile floating action button for quick create (CONTRACT §11.9). Hidden
 *  >= md, and route-aware: never renders on /ai or /login. */
export function FloatingActionButton({
  onClick,
  label = az.action.add,
  className,
}: FloatingActionButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  const hidden = FAB_HIDDEN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  if (hidden) return null;

  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick ?? (() => router.push("/tours/new"))}
      whileTap={{ scale: 0.92 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={cn(
        "bottom-safe fixed right-5 z-40 flex size-14 items-center justify-center rounded-full bg-terracotta text-terracotta-foreground shadow-lg md:hidden",
        "active:bg-terracotta-hover",
        className,
      )}
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 76px)" }}
    >
      <Plus className="size-6" strokeWidth={2.5} />
    </motion.button>
  );
}
