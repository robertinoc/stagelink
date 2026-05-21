'use client';

import { Bento, BentoLabel } from '@/components/sl/Bento';
import { formatFullDateTime } from '../../lib/format';
import { FreshnessRow, type FreshnessState } from './FreshnessRow';

export interface FreshnessEntry {
  platformName: string;
  iso: string | null;
  state: FreshnessState;
  label: string;
}

interface DataFreshnessCardProps {
  title: string;
  hint: string;
  lastUpdatedLabel: string;
  lastUpdatedIso: string | null;
  entries: FreshnessEntry[];
  locale?: 'es' | 'en';
}

export function DataFreshnessCard({
  title,
  hint,
  lastUpdatedLabel,
  lastUpdatedIso,
  entries,
  locale = 'es',
}: DataFreshnessCardProps) {
  return (
    <Bento pad={22}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <BentoLabel>{title}</BentoLabel>
          <p className="mt-1 text-[12px] text-white/50">{hint}</p>
        </div>
        {lastUpdatedIso && (
          <div className="font-[family-name:var(--font-heading)] text-[11px] text-white/50">
            {lastUpdatedLabel} · {formatFullDateTime(lastUpdatedIso, locale)}
          </div>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {entries.map((e) => (
          <FreshnessRow
            key={e.platformName}
            platformName={e.platformName}
            iso={e.iso}
            state={e.state}
            label={e.label}
            locale={locale}
          />
        ))}
      </div>
    </Bento>
  );
}
