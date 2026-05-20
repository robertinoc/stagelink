'use client';

import { Bento } from '@/components/sl/Bento';
import { EmptyDataNote } from './EmptyDataNote';

export interface SourceItem {
  name: string;
  emoji: string;
  brand: string;
  share: number;
}

interface SourcesCardProps {
  title: string;
  hint: string;
  /**
   * Sources data — when null/undefined the card renders the friendly "coming
   * soon" empty state. Backend gap; see plan §gaps de backend.
   */
  items: SourceItem[] | null;
  comingSoonMessage: string;
}

export function SourcesCard({ title, hint, items, comingSoonMessage }: SourcesCardProps) {
  return (
    <Bento pad={22}>
      <div className="mb-3">
        <div className="font-[family-name:var(--font-heading)] text-[16px] font-bold text-white">
          {title}
        </div>
        <p className="mt-1 text-[12px] text-white/50">{hint}</p>
      </div>
      {!items || items.length === 0 ? (
        <EmptyDataNote tone="info">{comingSoonMessage}</EmptyDataNote>
      ) : (
        <div className="space-y-2.5">
          {items.map((it) => (
            <div
              key={it.name}
              className="grid items-center gap-3 py-2.5"
              style={{ gridTemplateColumns: 'auto 1fr auto' }}
            >
              <span
                aria-hidden="true"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-base"
                style={{ background: `${it.brand}22`, border: `1px solid ${it.brand}44` }}
              >
                {it.emoji}
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-white">{it.name}</div>
                <span className="mt-1 block h-1 overflow-hidden rounded-[2px] bg-white/[0.06]">
                  <span
                    className="block h-full"
                    style={{
                      width: `${Math.max(2, Math.min(100, it.share))}%`,
                      background: it.brand,
                      boxShadow: `0 0 6px ${it.brand}66`,
                    }}
                  />
                </span>
              </div>
              <div className="font-[family-name:var(--font-heading)] text-[14px] font-bold text-white">
                {it.share}%
              </div>
            </div>
          ))}
        </div>
      )}
    </Bento>
  );
}
