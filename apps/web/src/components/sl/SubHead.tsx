import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SubHeadProps {
  title: string;
  hint?: string;
  right?: ReactNode;
  className?: string;
}

/**
 * Header row for secondary Bento blocks. Pairs a title with an optional
 * hint and right slot for action buttons. Reusable across every settings
 * tab so block headers don't drift in spacing or typography.
 */
export function SubHead({ title, hint, right, className }: SubHeadProps) {
  return (
    <div
      className={cn('flex flex-wrap items-start justify-between gap-4 pb-4', className)}
    >
      <div className="min-w-0">
        <h3 className="m-0 font-[family-name:var(--font-heading)] text-[16px] font-bold leading-tight tracking-[-0.01em] text-white">
          {title}
        </h3>
        {hint && (
          <p className="mt-1.5 max-w-[640px] text-[13px] leading-[1.55] text-white/60">
            {hint}
          </p>
        )}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}
