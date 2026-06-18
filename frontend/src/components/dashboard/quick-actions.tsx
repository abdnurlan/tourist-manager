"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  MapPinned,
  CalendarPlus,
  Sparkles,
  CalendarDays,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/shared/section-header";
import { StaggerList, StaggerItem } from "@/components/shared/page-transition";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  tone: string;
}

const ACTIONS: QuickAction[] = [
  {
    label: az.dashboard.quick_new_tour,
    href: "/tours/new",
    icon: MapPinned,
    tone: "bg-accent-subtle text-accent",
  },
  {
    label: az.dashboard.quick_new_event,
    href: "/tours",
    icon: CalendarPlus,
    tone: "bg-terracotta-subtle text-terracotta",
  },
  {
    label: az.dashboard.quick_ai,
    href: "/ai",
    icon: Sparkles,
    tone: "bg-info/12 text-info",
  },
  {
    label: az.dashboard.quick_calendar,
    href: "/calendar",
    icon: CalendarDays,
    tone: "bg-warning/12 text-warning",
  },
];

export interface QuickActionsProps {
  className?: string;
}

/** Quick-action shortcut tiles (new tour/event, AI, calendar). */
export function QuickActions({ className }: QuickActionsProps) {
  const router = useRouter();
  return (
    <section className={cn("space-y-3", className)}>
      <SectionHeader title={az.dashboard.quick_actions} />
      <StaggerList className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <StaggerItem key={action.label}>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(action.href)}
                className="w-full text-left"
              >
                <Card
                  interactive
                  className="group flex h-full items-center gap-3 p-4"
                >
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-base ease-out group-hover:scale-105",
                      action.tone,
                    )}
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold leading-tight text-foreground">
                    {action.label}
                  </span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground/50 transition-all duration-base ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
                </Card>
              </motion.button>
            </StaggerItem>
          );
        })}
      </StaggerList>
    </section>
  );
}
