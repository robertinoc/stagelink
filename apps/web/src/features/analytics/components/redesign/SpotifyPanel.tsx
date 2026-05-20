'use client';

import { BentoLabel } from '@/components/sl/Bento';
import type { StageLinkInsightsSnapshot } from '@stagelink/types';
import { PlatformMetric } from './PlatformMetric';
import { EmptyDataNote } from './EmptyDataNote';

const SPOTIFY = '#1DB954';

interface SpotifyPanelProps {
  snapshot: StageLinkInsightsSnapshot | null;
  /** Penultimate snapshot for deltas. */
  prev?: StageLinkInsightsSnapshot | null;
  labels: {
    followers: string;
    popularity: string;
    genres: string;
    topTracksEmpty: string;
  };
  locale?: 'es' | 'en';
}

function numericMetric(
  snapshot: StageLinkInsightsSnapshot | null | undefined,
  key: string,
): number | null {
  if (!snapshot) return null;
  const v = snapshot.metrics[key];
  return typeof v === 'number' ? v : null;
}

function arrayMetric(
  snapshot: StageLinkInsightsSnapshot | null | undefined,
  key: string,
): string[] {
  if (!snapshot) return [];
  const raw = snapshot.metrics[key];
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function SpotifyPanel({ snapshot, prev, labels, locale = 'es' }: SpotifyPanelProps) {
  const followers = numericMetric(snapshot, 'followersTotal');
  const popularity = numericMetric(snapshot, 'popularity');
  const genres = arrayMetric(snapshot, 'genres');

  const prevFollowers = numericMetric(prev, 'followersTotal');
  const prevPopularity = numericMetric(prev, 'popularity');

  const followersDelta =
    followers != null && prevFollowers != null ? followers - prevFollowers : null;
  const popularityDelta =
    popularity != null && prevPopularity != null ? popularity - prevPopularity : null;

  const hasTopTracks =
    snapshot?.topContent?.some(
      (c) =>
        c.platform === 'spotify' && (c.metricLabel === 'plays' || c.metricLabel === 'popularity'),
    ) ?? false;

  return (
    <>
      <div className="grid gap-3 sl-platform-grid" style={{ gridTemplateColumns: '1fr 1fr 1.6fr' }}>
        <PlatformMetric
          label={labels.followers}
          value={
            followers != null ? followers.toLocaleString(locale === 'es' ? 'es-AR' : 'en-US') : '—'
          }
          delta={followersDelta}
          brand={SPOTIFY}
          locale={locale}
        />
        <PlatformMetric
          label={labels.popularity}
          value={popularity != null ? String(popularity) : '—'}
          suffix="/100"
          delta={popularityDelta}
          brand={SPOTIFY}
          locale={locale}
        />
        <div className="rounded-xl border border-white/[0.08] bg-black/25 px-[18px] py-4">
          <BentoLabel>{labels.genres}</BentoLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {genres.length === 0 ? (
              <span className="text-[12px] text-white/40">—</span>
            ) : (
              genres.map((g) => (
                <span
                  key={g}
                  className="rounded-full border px-2.5 py-1 text-[11.5px] font-semibold"
                  style={{
                    background: `${SPOTIFY}1F`,
                    color: SPOTIFY,
                    borderColor: `${SPOTIFY}40`,
                  }}
                >
                  {g}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
      {!hasTopTracks && (
        <div className="mt-3.5">
          <EmptyDataNote tone="warning">{labels.topTracksEmpty}</EmptyDataNote>
        </div>
      )}
    </>
  );
}
