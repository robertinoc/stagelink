'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendPill } from './TrendPill';
import { MiniSparkline } from './MiniSparkline';

interface KpiTileProps {
  label: string;
  value: number;
  prev: number;
  /** Optional unit suffix like "%". Rendered next to the number. */
  unit?: string;
  /** Decimals for the displayed value. */
  decimals?: number;
  icon: ReactNode;
  sparkData: number[];
  sparkColor?: string;
  /** Position in the strip — controls left border between tiles. */
  position?: 'first' | 'middle';
  /** Optional explanatory tooltip shown on hover (and as info-dot for visibility). */
  hint?: string;
  className?: string;
  locale?: 'es' | 'en';
}

export function KpiTile({
  label,
  value,
  prev,
  unit,
  decimals = 0,
  icon,
  sparkData,
  sparkColor = '#E040FB',
  position = 'middle',
  hint,
  className,
  locale = 'es',
}: KpiTileProps) {
  const fmt = new Intl.NumberFormat(locale === 'es' ? 'es-AR' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <div
      className={cn(
        'sl-kpi-tile flex flex-col justify-between px-[22px] py-5',
        position === 'middle' && 'border-l border-white/[0.08]',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-md bg-white/[0.05] text-white/70">
          {icon}
        </span>
        <span className="text-[11.5px] font-medium text-white/70">{label}</span>
        {hint && (
          // CSS-only tooltip: instant on hover/focus, no native HTML title delay.
          // The `?` is a focusable button so keyboard users can trigger it too.
          <span className="group relative inline-flex">
            <button
              type="button"
              aria-label={hint}
              tabIndex={0}
              className="inline-flex h-[14px] w-[14px] cursor-help items-center justify-center rounded-full border border-white/15 bg-transparent text-[9px] font-bold text-white/40 transition-colors hover:border-white/40 hover:text-white/80 focus:outline-none focus:ring-1 focus:ring-white/40"
            >
              ?
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 top-full z-50 mt-1.5 w-[240px] -translate-x-1/2 rounded-lg border border-white/15 bg-[#0D0A1A]/95 px-3 py-2 text-[11px] font-normal leading-relaxed text-white/85 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
            >
              {hint}
            </span>
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5 font-[family-name:var(--font-heading)] text-[32px] font-bold leading-none tracking-[-0.02em] text-white">
        {fmt.format(value)}
        {unit && <span className="text-[16px] font-semibold text-white/50">{unit}</span>}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <TrendPill value={value} prev={prev} small />
        <div className="flex-1 min-w-0">
          <MiniSparkline data={sparkData} color={sparkColor} height={28} />
        </div>
      </div>
    </div>
  );
}
