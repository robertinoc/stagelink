'use client';

import { useTranslations } from 'next-intl';
import type { PublicCounterKey, PublicCountersBlockConfig } from '@stagelink/types';

interface PublicCountersBlockRendererProps {
  title: string | null;
  config: PublicCountersBlockConfig;
}

/**
 * Per-counter accent styling. Each card carries a distinct brand accent on the
 * number, a tinted background + border, and a matching hover glow — mirroring
 * (and amplifying) the legacy ArtistStatsRow palette.
 */
const COUNTER_STYLE: Record<
  PublicCounterKey,
  { card: string; number: string; label: string; i18nKey: string }
> = {
  eps: {
    card: 'border-cyan-500/25 bg-cyan-500/[0.07] hover:border-cyan-400/50 hover:shadow-[0_0_40px_rgba(34,211,238,0.22)]',
    number: 'text-cyan-300',
    label: 'text-cyan-200/70',
    i18nKey: 'eps_released',
  },
  labels: {
    card: 'border-fuchsia-500/25 bg-fuchsia-500/[0.07] hover:border-fuchsia-400/50 hover:shadow-[0_0_40px_rgba(217,70,239,0.22)]',
    number: 'text-fuchsia-300',
    label: 'text-fuchsia-200/70',
    i18nKey: 'record_labels',
  },
  collabs: {
    card: 'border-emerald-500/25 bg-emerald-500/[0.07] hover:border-emerald-400/50 hover:shadow-[0_0_40px_rgba(52,211,153,0.22)]',
    number: 'text-emerald-300',
    label: 'text-emerald-200/70',
    i18nKey: 'external_collabs',
  },
};

/**
 * Public renderer for the "Public Counters" block. The visible counters
 * (key + value, value > 0 only) are resolved server-side (localizeBlock) and
 * arrive on `config.counters`.
 *
 * Renders large full-width stat cards (one per visible counter): a big
 * Space Grotesk number above a small uppercase label, with the brand accent
 * and a hover glow. The grid stretches the cards evenly across the column.
 */
export function PublicCountersBlockRenderer({ title, config }: PublicCountersBlockRendererProps) {
  const t = useTranslations('public_page.stats');
  const counters = config.counters ?? [];

  if (counters.length === 0) return null;

  return (
    <section className="space-y-4 print:break-inside-avoid">
      {title?.trim() ? (
        <h2 className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
          {title}
        </h2>
      ) : null}
      <ul
        aria-label={t('aria_label')}
        className="grid gap-3 sm:gap-4"
        style={{ gridTemplateColumns: `repeat(${counters.length}, minmax(0, 1fr))` }}
      >
        {counters.map((counter) => {
          const style = COUNTER_STYLE[counter.key];
          return (
            <li
              key={counter.key}
              className={`group flex cursor-default flex-col items-center justify-center gap-1.5 rounded-2xl border px-3 py-6 text-center transition-all duration-300 hover:-translate-y-0.5 sm:gap-2 sm:px-5 sm:py-8 ${style.card}`}
            >
              <span
                className={`font-[family-name:var(--font-heading)] text-4xl font-bold leading-none tabular-nums tracking-tight sm:text-6xl ${style.number}`}
              >
                {counter.value}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase leading-tight tracking-[0.16em] sm:text-xs ${style.label}`}
              >
                {t(style.i18nKey)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
