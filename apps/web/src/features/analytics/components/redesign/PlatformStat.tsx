'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PlatformStatProps {
  label: string;
  value: string;
  icon?: ReactNode;
  hint?: string;
  className?: string;
}

export function PlatformStat({ label, value, icon, hint, className }: PlatformStatProps) {
  return (
    <div
      className={cn('rounded-xl border border-white/[0.08] bg-black/30 px-4 py-[14px]', className)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-white/50">{label}</span>
        {icon && <span aria-hidden="true">{icon}</span>}
      </div>
      <div className="mt-1 font-[family-name:var(--font-heading)] text-[26px] font-bold leading-none text-white">
        {value}
      </div>
      {hint && <div className="mt-1 text-[10.5px] text-white/30">{hint}</div>}
    </div>
  );
}
