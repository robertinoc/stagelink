'use client';

import { Bento } from '@/components/sl/Bento';
import { Pill } from '@/components/sl/SlPrimitives';
import { EmptyDataNote } from './EmptyDataNote';
import { TopLinkRow } from './TopLinkRow';

export interface TopLinksCardItem {
  rank: number;
  title: string;
  type: string;
  clicks: number;
  share: number;
}

interface TopLinksCardProps {
  title: string;
  hint: string;
  activeLabel: string;
  emptyMessage: string;
  items: TopLinksCardItem[];
  locale?: 'es' | 'en';
}

export function TopLinksCard({
  title,
  hint,
  activeLabel,
  emptyMessage,
  items,
  locale = 'es',
}: TopLinksCardProps) {
  return (
    <Bento pad={22}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="font-[family-name:var(--font-heading)] text-[16px] font-bold text-white">
            {title}
          </div>
          <p className="mt-1 text-[12px] text-white/50">{hint}</p>
        </div>
        <Pill tone="neutral">
          {items.length} {activeLabel}
        </Pill>
      </div>
      {items.length === 0 ? (
        <EmptyDataNote tone="info">{emptyMessage}</EmptyDataNote>
      ) : (
        <div>
          {items.map((it, i) => (
            <TopLinkRow
              key={it.rank}
              rank={it.rank}
              title={it.title}
              type={it.type}
              clicks={it.clicks}
              share={it.share}
              separator={i > 0}
              locale={locale}
            />
          ))}
        </div>
      )}
    </Bento>
  );
}
