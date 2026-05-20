'use client';

import { cn } from '@/lib/utils';
import { computeTrend } from '../../lib/trend';

interface TrendPillProps {
  value: number;
  prev: number;
  small?: boolean;
  className?: string;
}

export function TrendPill({ value, prev, small = false, className }: TrendPillProps) {
  const { direction, label } = computeTrend(value, prev);
  const tone =
    direction === 'up'
      ? 'bg-[rgba(74,222,128,0.14)] text-[#4ADE80] border-[rgba(74,222,128,0.25)]'
      : direction === 'down'
        ? 'bg-[rgba(255,107,107,0.14)] text-[#FF6B6B] border-[rgba(255,107,107,0.25)]'
        : 'bg-white/[0.06] text-white/50 border-white/8';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-bold leading-none whitespace-nowrap',
        small ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[12px]',
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}
