'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { AppSidebar } from './AppSidebar';
import { AppTopbar } from './AppTopbar';
import type { Artist } from '@/lib/api/artists';

interface AppShellProps {
  artist: Artist | null;
  children: React.ReactNode;
}

/**
 * AppShell — client component that manages the two-column app layout.
 *
 * Desktop (lg+):
 *   Fixed sidebar (240 px) on the left + scrollable content on the right.
 *
 * Mobile (< lg):
 *   Hidden sidebar; hamburger button in the topbar opens it as a Sheet drawer.
 *
 * locale is NOT drilled through here — AppSidebar and AppTopbar read it
 * directly via useLocale() from next-intl.
 */
export function AppShell({ artist, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Desktop sidebar (always visible on lg+) ─────────────────────── */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <AppSidebar artist={artist} />
      </div>

      {/* ── Mobile sidebar (Sheet drawer) ────────────────────────────────── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-60 p-0">
          {/* Visually hidden title required by Radix Dialog for screen-reader accessibility */}
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <AppSidebar artist={artist} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* ── Main content column ──────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppTopbar artist={artist} onMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
