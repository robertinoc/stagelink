'use client';

import { cn } from '@/lib/utils';
import { TrendPill } from './TrendPill';

interface MiniStatProps {
  label: string;
  value: string;
  desc?: string;
  accent: string;
  trend?: { value: number; prev: number };
  className?: string;
}

export function MiniStat({ label, value, desc, accent, trend, className }: MiniStatProps) {
  return (
    <div
      className={cn('rounded-xl border border-white/[0.08] bg-black/25 px-[18px] py-4', className)}
    >
      <div className="font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.4px] text-white/50">
        {label}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="font-[family-name:var(--font-heading)] text-[28px] font-bold leading-none text-white">
          {value}
        </span>
        {trend && <TrendPill value={trend.value} prev={trend.prev} small />}
      </div>
      <div
        aria-hidden="true"
        className="mt-2 h-[2px] w-7 rounded"
        style={{ background: accent, boxShadow: `0 0 6px ${accent}88` }}
      />
      {desc && <p className="mt-2 text-[12px] leading-snug text-white/50">{desc}</p>}
    </div>
  );
}
