'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface StickyTabItem<TId extends string = string> {
  id: TId;
  label: string;
  hint?: string;
  /** Compact pill rendered to the right of the label. */
  badge?: { label: string; tone?: 'active' | 'idle' } | null;
}

interface StickyTabsProps<TId extends string = string> {
  items: ReadonlyArray<StickyTabItem<TId>>;
  active: TId;
  onChange: (id: TId) => void;
  ariaLabel: string;
  className?: string;
}

/**
 * Sticky horizontal tab bar shared by Settings (and the spirit-twin of the
 * tab bars in Profile / Analytics). Backdrop blur, magenta gradient
 * underline on the active tab, badge styled per spec §4.2.
 */
export function StickyTabs<TId extends string = string>({
  items,
  active,
  onChange,
  ariaLabel,
  className,
}: StickyTabsProps<TId>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        // -mx-4 px-4 on mobile (matches AppShell p-4); sm:-mx-6 sm:px-6 on sm+ (matches sm:p-6).
        // Keeps the tab bar full-bleed without overflowing the viewport.
        'sticky top-0 z-[5] -mx-4 flex gap-1 overflow-x-auto border-b border-white/10 bg-[rgba(13,10,26,0.85)] px-4 backdrop-blur-md sm:-mx-6 sm:px-6',
        className,
      )}
    >
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`settings-panel-${item.id}`}
            id={`settings-tab-${item.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative shrink-0 cursor-pointer border-0 bg-transparent px-[18px] pb-4 pt-3.5 text-left',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E040FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A]',
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'font-[family-name:var(--font-heading)] text-[14px] font-semibold',
                  isActive ? 'text-white' : 'text-white/60',
                )}
              >
                {item.label}
              </span>
              {item.badge && (
                <TabBadge active={isActive} tone={item.badge.tone}>
                  {item.badge.label}
                </TabBadge>
              )}
            </div>
            {item.hint && (
              <span
                className={cn(
                  'mt-1 block text-[11px]',
                  isActive ? 'text-white/65' : 'text-white/40',
                )}
              >
                {item.hint}
              </span>
            )}
            {isActive && <TabUnderline />}
          </button>
        );
      })}
    </div>
  );
}

function TabBadge({
  active,
  tone,
  children,
}: {
  active: boolean;
  tone?: 'active' | 'idle';
  children: ReactNode;
}) {
  const useActiveLook = active || tone === 'active';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[5px] border px-[7px] py-[2px] text-[10px] font-bold tracking-[0.3px]',
        useActiveLook
          ? 'border-[rgba(224,64,251,0.35)] bg-[rgba(224,64,251,0.15)] text-[#E040FB]'
          : 'border-white/10 bg-white/[0.05] text-white/50',
      )}
    >
      {children}
    </span>
  );
}

function TabUnderline() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-[linear-gradient(90deg,#E040FB_0%,#9B30D0_100%)] shadow-[0_0_12px_rgba(224,64,251,0.55)]"
    />
  );
}
