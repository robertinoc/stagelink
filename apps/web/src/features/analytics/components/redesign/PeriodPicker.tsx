'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { AnalyticsRange } from '@/lib/api/analytics';

interface PeriodPickerProps {
  range: AnalyticsRange;
  /** Whether the user's plan unlocks 1-year. */
  hasOneYearAccess: boolean;
  labels: { d7: string; d30: string; d90: string; y1: string; proBadge: string };
}

const OPTIONS: Array<{ id: AnalyticsRange; key: 'd7' | 'd30' | 'd90' | 'y1' }> = [
  { id: '7d', key: 'd7' },
  { id: '30d', key: 'd30' },
  { id: '90d', key: 'd90' },
  { id: '365d', key: 'y1' },
];

export function PeriodPicker({ range, hasOneYearAccess, labels }: PeriodPickerProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function handleClick(id: AnalyticsRange, locked: boolean) {
    if (locked || id === range) return;
    const next = new URLSearchParams(params.toString());
    next.set('range', id);
    startTransition(() => router.push(`?${next.toString()}`, { scroll: false }));
  }

  return (
    <>
      {pending && (
        <div
          aria-hidden="true"
          className="fixed left-0 right-0 top-0 z-50 h-0.5 bg-[#E040FB]"
          style={{ animation: 'sl-progress 1.2s linear infinite' }}
        />
      )}
      <div
        role="tablist"
        aria-label="Period"
        className="inline-flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-black/30 p-1"
      >
        {OPTIONS.map((o) => {
          const locked = o.id === '365d' && !hasOneYearAccess;
          const active = o.id === range;
          return (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-disabled={locked}
              disabled={locked || pending}
              onClick={() => handleClick(o.id, locked)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-[7px] text-[12px] font-semibold transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E040FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A]',
                active && 'text-white shadow-[0_0_16px_rgba(224,64,251,0.35)]',
                !active && !locked && 'text-white/70 hover:text-white',
                locked && 'cursor-not-allowed text-white/30',
              )}
              style={
                active
                  ? {
                      background: 'linear-gradient(135deg,#E040FB 0%,#9B30D0 45%,#4A1A8C 100%)',
                    }
                  : undefined
              }
            >
              {labels[o.key]}
              {locked && (
                <span
                  aria-hidden="true"
                  className="ml-1 rounded border px-[5px] py-[2px] text-[8px] font-bold"
                  style={{
                    background: 'rgba(224,64,251,0.18)',
                    color: '#E040FB',
                    borderColor: 'rgba(224,64,251,0.4)',
                  }}
                >
                  {labels.proBadge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
