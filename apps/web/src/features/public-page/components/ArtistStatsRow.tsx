import { getTranslations } from 'next-intl/server';
import type { SupportedLocale } from '@stagelink/types';

interface ArtistStatsRowProps {
  /** Manual counter. `null` or `0` → hidden. */
  epsReleasedCount: number | null;
  /** Server-derived from `recordLabels.length`. `0` → hidden. */
  recordLabelsCount: number;
  /** Manual counter. `null` or `0` → hidden. */
  externalCollabsCount: number | null;
  locale: SupportedLocale;
}

/**
 * Public-page social-proof counters row (REQ-11).
 *
 * Renders a compact horizontal pill row with up to three counters. Each pill
 * is rendered only when the corresponding value is > 0; the entire section
 * returns `null` when all three are missing or zero, so a brand-new artist
 * with no data sees nothing instead of a row of zeros.
 *
 * Designed to wrap cleanly on narrow viewports.
 */
export async function ArtistStatsRow({
  epsReleasedCount,
  recordLabelsCount,
  externalCollabsCount,
  locale,
}: ArtistStatsRowProps) {
  const epsVisible = (epsReleasedCount ?? 0) > 0;
  const labelsVisible = recordLabelsCount > 0;
  const collabsVisible = (externalCollabsCount ?? 0) > 0;

  if (!epsVisible && !labelsVisible && !collabsVisible) return null;

  const t = await getTranslations({ locale, namespace: 'public_page.stats' });

  return (
    <ul
      aria-label={t('aria_label')}
      className="flex flex-wrap items-center justify-center gap-2 text-xs sm:gap-3"
    >
      {epsVisible ? (
        <li className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white">
          <span className="font-semibold tabular-nums">{epsReleasedCount}</span>
          <span className="text-zinc-300">{t('eps_released')}</span>
        </li>
      ) : null}
      {labelsVisible ? (
        <li className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white">
          <span className="font-semibold tabular-nums">{recordLabelsCount}</span>
          <span className="text-zinc-300">{t('record_labels')}</span>
        </li>
      ) : null}
      {collabsVisible ? (
        <li className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white">
          <span className="font-semibold tabular-nums">{externalCollabsCount}</span>
          <span className="text-zinc-300">{t('external_collabs')}</span>
        </li>
      ) : null}
    </ul>
  );
}
