'use client';

import { BentoLabel } from '@/components/sl/Bento';
import type { StageLinkInsightsSnapshot } from '@stagelink/types';
import { PlatformMetric } from './PlatformMetric';
import { formatShortDate } from '../../lib/format';

const YT = '#FF0000';

interface YouTubePanelProps {
  snapshot: StageLinkInsightsSnapshot | null;
  prev?: StageLinkInsightsSnapshot | null;
  labels: {
    subscribers: string;
    totalViews: string;
    videos: string;
    recentVideos: string;
    viewAll: string;
    viewsLabel: string;
  };
  recentVideosUrl?: string;
  locale?: 'es' | 'en';
}

function num(snapshot: StageLinkInsightsSnapshot | null | undefined, key: string): number | null {
  if (!snapshot) return null;
  const v = snapshot.metrics[key];
  return typeof v === 'number' ? v : null;
}

export function YouTubePanel({
  snapshot,
  prev,
  labels,
  recentVideosUrl,
  locale = 'es',
}: YouTubePanelProps) {
  const subs = num(snapshot, 'subscriberCount');
  const views = num(snapshot, 'totalViews');
  const videos = num(snapshot, 'videoCount');

  const prevSubs = num(prev, 'subscriberCount');
  const prevViews = num(prev, 'totalViews');
  const prevVideos = num(prev, 'videoCount');

  const recent = (snapshot?.topContent ?? []).filter((c) => c.platform === 'youtube').slice(0, 3);

  return (
    <div
      className="grid gap-3 sl-platform-grid"
      style={{ gridTemplateColumns: 'repeat(3, 1fr) 1.5fr' }}
    >
      <PlatformMetric
        label={labels.subscribers}
        value={subs != null ? subs.toLocaleString(locale === 'es' ? 'es-AR' : 'en-US') : '—'}
        delta={subs != null && prevSubs != null ? subs - prevSubs : null}
        brand={YT}
        locale={locale}
      />
      <PlatformMetric
        label={labels.totalViews}
        value={views != null ? views.toLocaleString(locale === 'es' ? 'es-AR' : 'en-US') : '—'}
        delta={views != null && prevViews != null ? views - prevViews : null}
        brand={YT}
        big
        locale={locale}
      />
      <PlatformMetric
        label={labels.videos}
        value={videos != null ? String(videos) : '—'}
        delta={videos != null && prevVideos != null ? videos - prevVideos : null}
        brand={YT}
        locale={locale}
      />
      <div className="rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3.5">
        <BentoLabel>{labels.recentVideos}</BentoLabel>
        <div className="mt-2.5 space-y-2">
          {recent.length === 0 ? (
            <div className="text-[12px] text-white/40">—</div>
          ) : (
            recent.map((c) => {
              const date = (c as { capturedAt?: string }).capturedAt;
              return (
                <a
                  key={c.externalId}
                  href={c.externalUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E040FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A]"
                >
                  <span
                    aria-hidden="true"
                    className="h-[22px] w-9 shrink-0 rounded"
                    style={{ background: `linear-gradient(135deg, ${YT}66 0%, ${YT}22 100%)` }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11.5px] font-medium text-white">{c.title}</div>
                    <div className="text-[10px] text-white/50">
                      {c.metricValue} {labels.viewsLabel}
                      {date && ` · ${formatShortDate(date, locale)}`}
                    </div>
                  </div>
                </a>
              );
            })
          )}
        </div>
        {recentVideosUrl && (
          <a
            href={recentVideosUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex text-[12px] font-semibold text-[#E040FB] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E040FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A]"
          >
            {labels.viewAll} →
          </a>
        )}
      </div>
    </div>
  );
}
