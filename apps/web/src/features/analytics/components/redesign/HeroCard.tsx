'use client';

import { Bento, BentoLabel } from '@/components/sl/Bento';
import { Glow } from '@/components/sl/SlPrimitives';
import { formatNumber, formatShortDate } from '../../lib/format';
import { TrendPill } from './TrendPill';
import { BigSparkline, type BigSparklinePoint } from './BigSparkline';

interface HeroCardProps {
  eyebrow: string;
  value: number;
  prev: number;
  /** Up to 3 segments — each rendered separately, with bold values in white. */
  narrative: Array<{ text: string; bold?: boolean }>;
  vsLabel: string;
  sparkData: BigSparklinePoint[];
  sparkColor?: string;
  axisLabels?: string[];
  children?: React.ReactNode;
  locale?: 'es' | 'en';
}

export function HeroCard({
  eyebrow,
  value,
  prev,
  narrative,
  vsLabel,
  sparkData,
  sparkColor = '#E040FB',
  axisLabels,
  children,
  locale = 'es',
}: HeroCardProps) {
  const computedAxis = axisLabels ?? (sparkData.length ? buildAxisLabels(sparkData, locale) : []);

  return (
    <Bento pad={0}>
      <Glow x="95%" y="-30%" />
      <div className="sl-analytics-hero relative z-[1] grid grid-cols-[1.1fr_1fr]">
        <div className="px-7 py-6 border-r border-white/[0.06]">
          <BentoLabel tint="#E040FB">{eyebrow}</BentoLabel>
          <div
            className="mt-3 font-[family-name:var(--font-heading)] font-bold leading-[0.95] tracking-[-0.035em]"
            style={{
              fontSize: 'clamp(48px, 7cqw, 76px)',
              background: 'linear-gradient(135deg, #fff 0%, #E040FB 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {formatNumber(value, locale)}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            <TrendPill value={value} prev={prev} />
            <span className="text-[13px] text-white/50">
              {vsLabel} · {formatNumber(prev, locale)}
            </span>
          </div>
          <p className="mt-4 border-t border-white/[0.08] pt-4 text-[13.5px] leading-[1.55] text-white/70">
            {narrative.map((seg, i) => (
              <span key={i} className={seg.bold ? 'font-semibold text-white' : undefined}>
                {seg.text}
              </span>
            ))}
          </p>
        </div>
        <div className="px-6 py-6">
          <BigSparkline data={sparkData} color={sparkColor} height={180} locale={locale} />
          {computedAxis.length > 0 && (
            <div className="mt-3 flex justify-between font-[family-name:var(--font-heading)] text-[10px] uppercase tracking-[1px] text-white/30">
              {computedAxis.map((l, i) => (
                <span key={i}>{l}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      {children}
    </Bento>
  );
}

function buildAxisLabels(data: BigSparklinePoint[], locale: 'es' | 'en'): string[] {
  if (data.length < 5) return data.map((p) => formatShortDate(p.date, locale));
  const stops = [
    0,
    Math.floor(data.length * 0.25),
    Math.floor(data.length * 0.5),
    Math.floor(data.length * 0.75),
    data.length - 1,
  ];
  const labels = stops.map((i) => {
    const p = data[i];
    return p ? formatShortDate(p.date, locale) : '';
  });
  labels[labels.length - 1] = locale === 'es' ? 'Hoy' : 'Today';
  return labels;
}
