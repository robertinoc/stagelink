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
  /** Override the `<ul>` wrapper className (default: centred flex-wrap). */
  className?: string;
}

/**
 * Public-page social-proof counters row (REQ-11).
 *
 * Renders a compact horizontal pill row with up to three counters. Each pill
 * is rendered only when the corresponding value is > 0; the entire section
 * returns `null` when all three are missing or zero, so a brand-new artist
 * with no data sees nothing instead of a row of zeros.
 *
 * Each pill carries a distinct brand accent colour:
 *  - EPs Released  → cyan  (music / sound)
 *  - Record Labels → fuchsia (Stagelink primary)
 *  - Collabs       → emerald (growth / collaboration)
 *
 * Designed to wrap cleanly on narrow viewports.
 */
export async function ArtistStatsRow({
  epsReleasedCount,
  recordLabelsCount,
  externalCollabsCount,
  locale,
  className,
}: ArtistStatsRowProps) {
  const epsVisible = (epsReleasedCount ?? 0) > 0;
  const labelsVisible = recordLabelsCount > 0;
  const collabsVisible = (externalCollabsCount ?? 0) > 0;

  if (!epsVisible && !labelsVisible && !collabsVisible) return null;

  const t = await getTranslations({ locale, namespace: 'public_page.stats' });

  return (
    <ul
      aria-label={t('aria_label')}
      className={className ?? 'flex flex-wrap items-center justify-center gap-2 text-xs sm:gap-3'}
    >
      {epsVisible ? (
        <li className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/[0.08] px-3 py-1.5 text-white transition-all duration-200 hover:scale-[1.04] hover:border-cyan-400/50 hover:shadow-[0_0_18px_rgba(34,211,238,0.2)]">
          <span className="font-semibold tabular-nums">{epsReleasedCount}</span>
          <span className="text-cyan-200/80">{t('eps_released')}</span>
        </li>
      ) : null}
      {labelsVisible ? (
        <li className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/[0.08] px-3 py-1.5 text-white transition-all duration-200 hover:scale-[1.04] hover:border-fuchsia-400/50 hover:shadow-[0_0_18px_rgba(168,85,247,0.2)]">
          <span className="font-semibold tabular-nums">{recordLabelsCount}</span>
          <span className="text-fuchsia-200/80">{t('record_labels')}</span>
        </li>
      ) : null}
      {collabsVisible ? (
        <li className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] px-3 py-1.5 text-white transition-all duration-200 hover:scale-[1.04] hover:border-emerald-400/50 hover:shadow-[0_0_18px_rgba(52,211,153,0.2)]">
          <span className="font-semibold tabular-nums">{externalCollabsCount}</span>
          <span className="text-emerald-200/80">{t('external_collabs')}</span>
        </li>
      ) : null}
    </ul>
  );
}
