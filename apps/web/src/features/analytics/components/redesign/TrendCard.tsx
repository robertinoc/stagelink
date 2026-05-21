'use client';

import { useId, useState } from 'react';
import { cn } from '@/lib/utils';
import { Bento } from '@/components/sl/Bento';
import { BigSparkline, type BigSparklinePoint } from './BigSparkline';

export interface TrendSeries {
  id: string;
  label: string;
  color: string;
  data: BigSparklinePoint[];
  /** When true the button renders disabled with a "próximamente" tooltip. */
  disabled?: boolean;
  disabledHint?: string;
}

interface TrendCardProps {
  title: string;
  hint: string;
  series: TrendSeries[];
  /** Optional initial active series id. Defaults to the first enabled one. */
  initialSeriesId?: string;
  locale?: 'es' | 'en';
}

export function TrendCard({ title, hint, series, initialSeriesId, locale = 'es' }: TrendCardProps) {
  const firstEnabled = series.find((s) => !s.disabled)?.id ?? series[0]?.id ?? '';
  const [activeId, setActiveId] = useState<string>(initialSeriesId ?? firstEnabled);
  const active = series.find((s) => s.id === activeId) ?? series[0];
  const liveRegionId = useId();

  return (
    <Bento pad={22}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="font-[family-name:var(--font-heading)] text-[16px] font-bold text-white">
            {title}
          </div>
          <p className="mt-1 text-[12px] text-white/50">{hint}</p>
        </div>
        <div
          role="tablist"
          aria-label={title}
          className="inline-flex rounded-full border border-white/10 bg-black/30 p-1"
        >
          {series.map((s) => {
            const isActive = s.id === activeId;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-disabled={s.disabled}
                title={s.disabled ? s.disabledHint : undefined}
                disabled={s.disabled}
                onClick={() => !s.disabled && setActiveId(s.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E040FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0A1A]',
                  s.disabled && 'cursor-not-allowed opacity-40',
                )}
                style={
                  isActive
                    ? {
                        background: s.color,
                        color: '#0a0612',
                        boxShadow: `0 0 14px ${s.color}66`,
                      }
                    : { color: 'rgba(255,255,255,0.72)' }
                }
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: isActive ? '#0a0612' : s.color }}
                />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
      <div aria-live="polite" aria-atomic="true" id={liveRegionId} className="sr-only">
        {active?.label}
      </div>
      {active ? (
        <BigSparkline
          data={active.data}
          color={active.color}
          height={200}
          showAxis
          locale={locale}
          ariaLabel={active.label}
        />
      ) : (
        <div className="flex h-[200px] items-center justify-center text-[12px] text-white/40">
          {locale === 'es' ? 'Sin datos' : 'No data'}
        </div>
      )}
    </Bento>
  );
}
