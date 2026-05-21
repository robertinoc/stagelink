'use client';

import { cn } from '@/lib/utils';

interface TopLinkRowProps {
  rank: number;
  title: string;
  type: string;
  clicks: number;
  share: number;
  /** Add separator border-top (false for first row). */
  separator?: boolean;
  className?: string;
  locale?: 'es' | 'en';
}

export function TopLinkRow({
  rank,
  title,
  type,
  clicks,
  share,
  separator = true,
  className,
  locale = 'es',
}: TopLinkRowProps) {
  const isFirst = rank === 1;
  return (
    <div
      className={cn(
        'grid items-center gap-3.5 py-3',
        separator && 'border-t border-white/[0.08]',
        className,
      )}
      style={{ gridTemplateColumns: '24px 1fr auto' }}
    >
      <div
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-md font-[family-name:var(--font-heading)] text-[11px] font-bold',
          isFirst
            ? 'text-white shadow-[0_0_18px_rgba(224,64,251,0.4)] bg-[linear-gradient(135deg,#E040FB_0%,#9B30D0_100%)]'
            : 'bg-white/[0.05] text-white/50',
        )}
      >
        {rank}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-semibold text-white">{title}</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-[11px] text-white/50">{type}</span>
          <span className="h-1 max-w-[240px] flex-1 overflow-hidden rounded-[2px] bg-white/[0.06]">
            <span
              className="block h-full bg-[linear-gradient(135deg,#E040FB_0%,#9B30D0_45%,#4A1A8C_100%)]"
              style={{ width: `${Math.max(2, Math.min(100, share))}%` }}
            />
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="font-[family-name:var(--font-heading)] text-[18px] font-bold text-white">
          {clicks.toLocaleString(locale === 'es' ? 'es-AR' : 'en-US')}
        </div>
        <div className="mt-0.5 text-[10px] text-white/50">{share}%</div>
      </div>
    </div>
  );
}
