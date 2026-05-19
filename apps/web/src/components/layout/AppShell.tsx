'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { AppSidebar } from './AppSidebar';
import { AppTopbar } from './AppTopbar';
import type { Artist } from '@/lib/api/artists';
import type { PlanCode } from '@stagelink/types';

interface AppShellProps {
  artist: Artist | null;
  effectivePlan: PlanCode | null;
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
export function AppShell({ artist, effectivePlan, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    // sl-root enables container queries for responsive layout inside this element
    <div
      className="sl-root flex h-screen overflow-hidden"
      style={{ background: 'var(--sl-bg-deep, #0D0A1A)', containerType: 'inline-size' }}
    >
      {/* ── Desktop sidebar (always visible on lg+) ─────────────────────── */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <AppSidebar artist={artist} effectivePlan={effectivePlan} />
      </div>

      {/* ── Mobile sidebar (Sheet drawer) ────────────────────────────────── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        {/*
         * p-0 lets AppSidebar fill edge-to-edge.
         * SheetContent renders an absolute-positioned × button at right-4 top-4.
         */}
        <SheetContent
          side="left"
          className="w-60 border-r border-white/8 p-0"
          style={{ background: 'var(--sl-bg-deep, #0D0A1A)' }}
        >
          {/* Visually hidden title required by Radix Dialog for screen-reader accessibility */}
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <AppSidebar
            artist={artist}
            effectivePlan={effectivePlan}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* ── Main content column ──────────────────────────────────────────── */}
      {/* min-w-0 prevents this flex child from growing beyond the viewport width */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppTopbar artist={artist} onMenuOpen={() => setMobileOpen(true)} />
        {/* Ambient glow background on the scrollable content area */}
        <main
          className="flex-1 overflow-y-auto"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 75% -10%, rgba(155,48,208,0.18) 0%, transparent 55%),
              radial-gradient(ellipse 40% 30% at 10% 100%, rgba(0,212,255,0.07) 0%, transparent 60%),
              var(--sl-bg-deep, #0D0A1A)
            `,
          }}
        >
          <div className="p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
