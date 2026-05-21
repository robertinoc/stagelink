'use client';

import { cn } from '@/lib/utils';
import { BentoLabel } from '@/components/sl/Bento';

interface PlatformMetricProps {
  label: string;
  value: string;
  suffix?: string;
  delta?: number | null;
  brand: string;
  big?: boolean;
  className?: string;
  locale?: 'es' | 'en';
}

export function PlatformMetric({
  label,
  value,
  suffix,
  delta,
  brand,
  big = false,
  className,
  locale = 'es',
}: PlatformMetricProps) {
  const deltaStr =
    delta == null
      ? null
      : delta === 0
        ? '±0'
        : `${delta > 0 ? '+' : ''}${delta.toLocaleString(locale === 'es' ? 'es-AR' : 'en-US')}`;
  const deltaColor =
    delta == null || delta === 0
      ? 'text-white/50'
      : delta > 0
        ? 'text-[#4ADE80]'
        : 'text-[#FF6B6B]';
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-white/[0.08] bg-black/25 px-[18px] py-4',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-0 h-full w-[3px]"
        style={{ background: brand, boxShadow: `0 0 8px ${brand}88` }}
      />
      <BentoLabel>{label}</BentoLabel>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={cn(
            'font-[family-name:var(--font-heading)] font-bold leading-none tracking-[-0.02em] text-white',
            big ? 'text-[38px]' : 'text-[26px]',
          )}
        >
          {value}
        </span>
        {suffix && <span className="text-[13px] text-white/50">{suffix}</span>}
      </div>
      <div className="mt-2.5 text-[11px]">
        <span className={cn('font-bold', deltaColor)}>{deltaStr ?? '—'}</span>
        <span className="ml-1 text-white/50">
          {locale === 'es' ? 'desde el último sync' : 'since last sync'}
        </span>
      </div>
    </div>
  );
}
