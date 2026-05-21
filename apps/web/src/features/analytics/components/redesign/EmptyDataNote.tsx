'use client';

import { cn } from '@/lib/utils';

interface EmptyDataNoteProps {
  children: React.ReactNode;
  tone?: 'warning' | 'info';
  className?: string;
}

export function EmptyDataNote({ children, tone = 'warning', className }: EmptyDataNoteProps) {
  const styles =
    tone === 'warning'
      ? 'bg-[rgba(251,191,36,0.06)] border-[rgba(251,191,36,0.18)]'
      : 'bg-[rgba(0,212,255,0.06)] border-[rgba(0,212,255,0.15)]';
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-[10px] border px-[18px] py-[14px] text-[12.5px] leading-[1.5] text-white/70',
        styles,
        className,
      )}
    >
      <span aria-hidden="true" className="shrink-0">
        {tone === 'warning' ? '⚠️' : 'ⓘ'}
      </span>
      <span>{children}</span>
    </div>
  );
}
