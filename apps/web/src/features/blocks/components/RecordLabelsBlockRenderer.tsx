'use client';

import { useTranslations } from 'next-intl';
import type { RecordLabel, RecordLabelsBlockConfig } from '@stagelink/types';
import { RecordLabelLogo } from '../../epk/components/RecordLabelLogo';
import { resolveRecordLabelLogoSrc } from '@/lib/record-label-logo';

interface RecordLabelsBlockRendererProps {
  title: string | null;
  config: RecordLabelsBlockConfig;
}

/**
 * Public renderer for the "Record Labels" block. The full label objects are
 * resolved server-side (localizeBlock) and arrive on `config.labels`. Labels
 * with a website link are clickable.
 */
export function RecordLabelsBlockRenderer({ title, config }: RecordLabelsBlockRendererProps) {
  const t = useTranslations('blocks.fields');
  const labels: RecordLabel[] = config.labels ?? [];

  if (labels.length === 0) return null;

  return (
    <section className="space-y-4 print:break-inside-avoid">
      <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
        {title?.trim() ? title : t('record_labels_default_title')}
      </h2>

      <div className="flex flex-wrap gap-3">
        {labels.map((label) => {
          const logoSrc = resolveRecordLabelLogoSrc(label);
          const inner = (
            <>
              <RecordLabelLogo
                logoSrc={logoSrc}
                alt={label.name}
                className="h-8 w-8 flex-shrink-0 rounded-md border border-white/10 bg-white object-contain p-0.5"
              />
              <span className="truncate text-sm font-medium text-white">{label.name}</span>
            </>
          );

          return label.websiteUrl ? (
            <a
              key={label.id}
              href={label.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 transition hover:border-white/20 hover:bg-white/10"
            >
              {inner}
            </a>
          ) : (
            <div
              key={label.id}
              className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3 py-2"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </section>
  );
}
