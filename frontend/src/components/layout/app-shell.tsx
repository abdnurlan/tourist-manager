"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { FloatingActionButton } from "./fab";
import { BackgroundTexture } from "./background-texture";

export interface AppShellProps {
  children: ReactNode;
  /** Hide the mobile FAB on screens that have their own primary action. */
  hideFab?: boolean;
  /** Custom FAB handler (default → /tours/new). */
  onFabClick?: () => void;
}

/**
 * Authenticated app shell (CONTRACT §11.9, §12):
 *   - desktop: fixed left sidebar + content column (max ~1200px)
 *   - mobile: bottom nav + floating action button
 * The protected route-group layout renders pages inside this shell.
 */
export function AppShell({ children, hideFab, onFabClick }: AppShellProps) {
  return (
    <div className="relative min-h-dvh bg-background">
      {/* Fixed editorial atmosphere behind everything (z-0). */}
      <BackgroundTexture />

      {/* All interactive shell content sits above the texture layers. */}
      <div className="relative z-10">
        <Sidebar />

        {/* Content column: offset for sidebar on desktop, padded for bottom nav on mobile.
            Full-width so the sticky glass Topbar can span the whole column; inner
            content is centered to max-w-[1200px] by PageHeader / PageBody / the Topbar. */}
        <div className="md:pl-64">
          <main className="w-full pb-[calc(env(safe-area-inset-bottom)+88px)] md:pb-12">
            {children}
          </main>
        </div>

        <BottomNav />
        {!hideFab && <FloatingActionButton onClick={onFabClick} />}
      </div>
    </div>
  );
}
