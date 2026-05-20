'use client';

import { Bento, BentoLabel } from '@/components/sl/Bento';
import { formatNumber, formatPercent } from '../../lib/format';
import { BigSparkline, type BigSparklinePoint } from './BigSparkline';
import { MiniStat } from './MiniStat';
import { EmptyDataNote } from './EmptyDataNote';

export interface FanCaptureTopBlock {
  title: string;
  captures: number;
  conversionPercent: number | null;
}

interface FanCaptureCardProps {
  title: string;
  hint: string;
  successfulCaptures: number;
  successfulCapturesPrev: number;
  conversionRate: number;
  pageViews: number;
  capturesTimeline: BigSparklinePoint[];
  topBlocks: FanCaptureTopBlock[];
  emptyMessage: string;
  labels: {
    successful: string;
    successfulDesc: string;
    conversion: string;
    conversionDesc: string;
    visits: string;
    visitsDesc: string;
    capturesOverTime: string;
    topBlocks: string;
    conv: string;
  };
  locale?: 'es' | 'en';
}

export function FanCaptureCard({
  title,
  hint,
  successfulCaptures,
  successfulCapturesPrev,
  conversionRate,
  pageViews,
  capturesTimeline,
  topBlocks,
  emptyMessage,
  labels,
  locale = 'es',
}: FanCaptureCardProps) {
  const hasData = successfulCaptures > 0 || capturesTimeline.length > 0;
  return (
    <Bento pad={22}>
      <div className="mb-4">
        <div className="font-[family-name:var(--font-heading)] text-[16px] font-bold text-white">
          {title}
        </div>
        <p className="mt-1 text-[12px] text-white/50">{hint}</p>
      </div>
      {!hasData ? (
        <EmptyDataNote tone="info">{emptyMessage}</EmptyDataNote>
      ) : (
        <>
          <div className="grid gap-3.5 sm:grid-cols-3 mb-5">
            <MiniStat
              label={labels.successful}
              value={formatNumber(successfulCaptures, locale)}
              desc={labels.successfulDesc}
              accent="#FBBF24"
              trend={{ value: successfulCaptures, prev: successfulCapturesPrev }}
            />
            <MiniStat
              label={labels.conversion}
              value={formatPercent(conversionRate, 2, locale)}
              desc={labels.conversionDesc}
              accent="#4ADE80"
            />
            <MiniStat
              label={labels.visits}
              value={formatNumber(pageViews, locale)}
              desc={labels.visitsDesc}
              accent="#E040FB"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
            <div>
              <BentoLabel>{labels.capturesOverTime}</BentoLabel>
              <div className="mt-2">
                <BigSparkline
                  data={capturesTimeline}
                  color="#FBBF24"
                  height={140}
                  locale={locale}
                />
              </div>
            </div>
            <div>
              <BentoLabel>{labels.topBlocks}</BentoLabel>
              <div className="mt-2 space-y-2">
                {topBlocks.length === 0 ? (
                  <div className="rounded-[10px] border border-white/[0.08] bg-black/25 px-3 py-2.5 text-[12px] text-white/40">
                    —
                  </div>
                ) : (
                  topBlocks.slice(0, 3).map((b) => (
                    <div
                      key={b.title}
                      className="flex items-center justify-between gap-3 rounded-[10px] border border-white/[0.08] bg-black/25 px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-semibold text-white">
                          {b.title}
                        </div>
                        {b.conversionPercent != null && (
                          <div className="text-[11px] text-white/50">
                            {b.conversionPercent.toFixed(1)}% {labels.conv}
                          </div>
                        )}
                      </div>
                      <div className="font-[family-name:var(--font-heading)] text-[18px] font-bold text-[#FBBF24]">
                        {formatNumber(b.captures, locale)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Bento>
  );
}
