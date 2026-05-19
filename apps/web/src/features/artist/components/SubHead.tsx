'use client';

// SubHead — reusable card sub-header used in every Bento card.
// title + optional hint below + optional right slot (chip, button, etc.)

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface SubHeadProps {
  title: ReactNode;
  hint?: ReactNode;
  right?: ReactNode;
  className?: string;
}

export function SubHead({ title, hint, right, className }: SubHeadProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
      <div className="min-w-0">
        <div className="font-[family-name:var(--font-heading)] text-[14px] font-semibold text-white leading-snug">
          {title}
        </div>
        {hint && <div className="mt-1 text-[12px] text-white/50 leading-snug">{hint}</div>}
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </div>
  );
}

// Chip — compact counter badge used in SubHead right slot
interface ChipProps {
  children: ReactNode;
  className?: string;
}

export function Chip({ children, className }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-[9px] py-[3px] rounded-full text-[11px] font-bold font-[family-name:var(--font-heading)]',
        'bg-white/[0.08] border border-white/10 text-white/60',
        className,
      )}
    >
      {children}
    </span>
  );
}
