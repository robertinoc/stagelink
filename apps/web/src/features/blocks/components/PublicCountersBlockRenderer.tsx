'use client';

import { useTranslations } from 'next-intl';
import type { PublicCounterKey, PublicCountersBlockConfig } from '@stagelink/types';

interface PublicCountersBlockRendererProps {
  title: string | null;
  config: PublicCountersBlockConfig;
}

/** Per-counter accent styling, mirroring the legacy ArtistStatsRow. */
const COUNTER_STYLE: Record<PublicCounterKey, { pill: string; label: string; i18nKey: string }> = {
  eps: {
    pill: 'border-cyan-500/30 bg-cyan-500/[0.08] hover:border-cyan-400/50 hover:shadow-[0_0_18px_rgba(34,211,238,0.2)]',
    label: 'text-cyan-200/80',
    i18nKey: 'eps_released',
  },
  labels: {
    pill: 'border-fuchsia-500/30 bg-fuchsia-500/[0.08] hover:border-fuchsia-400/50 hover:shadow-[0_0_18px_rgba(168,85,247,0.2)]',
    label: 'text-fuchsia-200/80',
    i18nKey: 'record_labels',
  },
  collabs: {
    pill: 'border-emerald-500/30 bg-emerald-500/[0.08] hover:border-emerald-400/50 hover:shadow-[0_0_18px_rgba(52,211,153,0.2)]',
    label: 'text-emerald-200/80',
    i18nKey: 'external_collabs',
  },
};

/**
 * Public renderer for the "Public Counters" block. The visible counters
 * (key + value, value > 0 only) are resolved server-side (localizeBlock) and
 * arrive on `config.counters`. Mirrors the social-proof pill row that used to
 * live automatically in the page header.
 */
export function PublicCountersBlockRenderer({ title, config }: PublicCountersBlockRendererProps) {
  const t = useTranslations('public_page.stats');
  const counters = config.counters ?? [];

  if (counters.length === 0) return null;

  return (
    <section className="space-y-3 print:break-inside-avoid">
      {title?.trim() ? (
        <h2 className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
          {title}
        </h2>
      ) : null}
      <ul
        aria-label={t('aria_label')}
        className="flex flex-wrap items-center justify-center gap-2 text-xs sm:gap-3"
      >
        {counters.map((counter) => {
          const style = COUNTER_STYLE[counter.key];
          return (
            <li
              key={counter.key}
              className={`inline-flex cursor-default items-center gap-1.5 rounded-full border px-3 py-1.5 text-white transition-all duration-200 hover:scale-[1.04] ${style.pill}`}
            >
              <span className="font-semibold tabular-nums">{counter.value}</span>
              <span className={style.label}>{t(style.i18nKey)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
