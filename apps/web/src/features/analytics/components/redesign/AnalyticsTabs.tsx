'use client';

import { cn } from '@/lib/utils';

export type AnalyticsTabId = 'page' | 'platforms';

interface TabSpec {
  id: AnalyticsTabId;
  label: string;
  hint: string;
}

interface AnalyticsTabsProps {
  activeId: AnalyticsTabId;
  onChange: (id: AnalyticsTabId) => void;
  tabs: TabSpec[];
}

export function AnalyticsTabs({ activeId, onChange, tabs }: AnalyticsTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Analytics sections"
      className="sticky top-0 z-[5] flex gap-1 border-b border-white/[0.08] px-8 py-0 backdrop-blur"
      style={{
        background: 'rgba(13,10,26,0.85)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
      }}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative inline-flex items-center gap-2 border-0 bg-transparent px-[18px] pb-4 pt-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E040FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A]',
            )}
          >
            <span
              className={cn(
                'font-[family-name:var(--font-heading)] text-[14px] font-semibold transition-colors',
                active ? 'text-white' : 'text-white/60 hover:text-white/80',
              )}
            >
              {tab.label}
            </span>
            <span
              className={cn(
                'text-[11px] transition-colors',
                active ? 'text-white/60' : 'text-white/40',
              )}
            >
              {tab.hint}
            </span>
            {active && (
              <span
                aria-hidden="true"
                className="absolute inset-x-[12px] bottom-0 h-0.5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg,#E040FB 0%,#9B30D0 45%,#4A1A8C 100%)',
                  boxShadow: '0 0 10px rgba(224,64,251,0.5)',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
