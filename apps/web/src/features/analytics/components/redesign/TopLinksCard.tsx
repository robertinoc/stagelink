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
  /** Optional "see all" button — when provided, rendered at the bottom of the card. */
  seeMoreLabel?: string;
  onSeeMore?: () => void;
  locale?: 'es' | 'en';
}

export function TopLinksCard({
  title,
  hint,
  activeLabel,
  emptyMessage,
  items,
  seeMoreLabel,
  onSeeMore,
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
      {seeMoreLabel && onSeeMore && items.length > 0 && (
        <button
          type="button"
          onClick={onSeeMore}
          className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-[#E040FB] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E040FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A] rounded"
        >
          {seeMoreLabel} →
        </button>
      )}
    </Bento>
  );
}
