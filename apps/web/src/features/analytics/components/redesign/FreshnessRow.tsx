'use client';

import { cn } from '@/lib/utils';
import { Pill } from '@/components/sl/SlPrimitives';
import { formatFullDateTime } from '../../lib/format';

export type FreshnessState = 'ok' | 'partial' | 'stale' | 'never';

interface FreshnessRowProps {
  platformName: string;
  iso: string | null;
  state: FreshnessState;
  label: string;
  className?: string;
  locale?: 'es' | 'en';
}

const DOT_COLOR: Record<FreshnessState, string> = {
  ok: '#4ADE80',
  partial: '#FBBF24',
  stale: '#FBBF24',
  never: '#FF6B6B',
};

const PILL_TONE: Record<FreshnessState, 'green' | 'yellow' | 'pink'> = {
  ok: 'green',
  partial: 'yellow',
  stale: 'yellow',
  never: 'pink',
};

export function FreshnessRow({
  platformName,
  iso,
  state,
  label,
  className,
  locale = 'es',
}: FreshnessRowProps) {
  const color = DOT_COLOR[state];
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-[10px] border border-white/[0.08] bg-black/25 px-3.5 py-3',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}88` }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold text-white">{platformName}</div>
        <div className="text-[11px] text-white/50">
          {iso
            ? formatFullDateTime(iso, locale)
            : locale === 'es'
              ? 'Sin sync aún'
              : 'Never synced'}
        </div>
      </div>
      <Pill tone={PILL_TONE[state]}>{label}</Pill>
    </div>
  );
}
