'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link2, Zap, Share2, Heart } from 'lucide-react';
import type {
  AnalyticsFanInsights,
  AnalyticsOverview,
  AnalyticsProTrends,
  AnalyticsTrendPoint,
} from '@/lib/api/analytics';
import type { BigSparklinePoint } from './BigSparkline';
import { HeroCard } from './HeroCard';
import { KpiRow } from './KpiRow';
import { KpiTile } from './KpiTile';
import { TrendCard, type TrendSeries } from './TrendCard';
import { TopLinksCard } from './TopLinksCard';
import { TopLinksModal } from './TopLinksModal';
import { SourcesCard } from './SourcesCard';
import { FanCaptureCard } from './FanCaptureCard';
import { InfoStrip } from './InfoStrip';

interface PageTabProps {
  overview: AnalyticsOverview | null;
  proTrends: AnalyticsProTrends | null;
  fanInsights: AnalyticsFanInsights | null;
  locale: 'es' | 'en';
}

function toPoints(series: AnalyticsTrendPoint[] | undefined): BigSparklinePoint[] {
  if (!series) return [];
  return series.map((p) => ({ date: p.date, value: p.value }));
}

function halfSum(series: AnalyticsTrendPoint[] | undefined): { current: number; prev: number } {
  if (!series || series.length === 0) return { current: 0, prev: 0 };
  const half = Math.floor(series.length / 2);
  const prev = series.slice(0, half).reduce((s, p) => s + p.value, 0);
  const current = series.slice(half).reduce((s, p) => s + p.value, 0);
  return { current, prev };
}

export function PageTab({ overview, proTrends, fanInsights, locale }: PageTabProps) {
  const t = useTranslations('analytics.v2');
  const [topLinksModalOpen, setTopLinksModalOpen] = useState(false);

  const summary = overview?.summary;
  const visits = summary?.pageViews ?? 0;
  const linkClicks = summary?.linkClicks ?? 0;
  const ctr = summary?.ctr ?? 0;
  const smartRes = summary?.smartLinkResolutions ?? 0;

  const visitsSeries = proTrends?.series.pageViews;
  const clicksSeries = proTrends?.series.linkClicks;
  const smartSeries = proTrends?.series.smartLinkResolutions;
  const capturesSeries = fanInsights?.capturesOverTime;

  const visitsHalf = halfSum(visitsSeries);
  const clicksHalf = halfSum(clicksSeries);
  const smartHalf = halfSum(smartSeries);
  const capturesHalf = halfSum(capturesSeries);

  const heroPoints = useMemo(() => toPoints(visitsSeries), [visitsSeries]);

  const heroBest = useMemo(() => {
    if (!visitsSeries || visitsSeries.length === 0) return 0;
    return Math.max(...visitsSeries.map((p) => p.value));
  }, [visitsSeries]);
  const heroAvg = useMemo(() => {
    if (!visitsSeries || visitsSeries.length === 0) return 0;
    return Math.round(visitsSeries.reduce((s, p) => s + p.value, 0) / visitsSeries.length);
  }, [visitsSeries]);

  const series: TrendSeries[] = [
    {
      id: 'visits',
      label: t('series.visits'),
      color: '#E040FB',
      data: toPoints(visitsSeries),
      // DESIGN-DEVIATION: spec lists "visits" as its own series, but the API
      // returns it under `pageViews` — we use the same series and enable it.
    },
    {
      id: 'clicks',
      label: t('series.clicks'),
      color: '#00D4FF',
      data: toPoints(clicksSeries),
    },
    {
      id: 'smart',
      label: t('series.smart'),
      color: '#4ADE80',
      data: toPoints(smartSeries),
    },
    {
      id: 'captures',
      label: t('series.captures'),
      color: '#FBBF24',
      data: toPoints(capturesSeries),
      disabled: !capturesSeries || capturesSeries.length === 0,
      disabledHint: t('series.capturesComingSoon'),
    },
  ];

  // Top links
  const topLinks = (overview?.topLinks ?? []).slice(0, 5);
  const topClickTotal = (overview?.topLinks ?? []).reduce((s, l) => s + l.clicks, 0);
  const topLinkItems = topLinks.map((l, idx) => ({
    rank: idx + 1,
    title: l.label ?? t('topLinks.untitled'),
    type: l.isSmartLink ? t('topLinks.typeSmart') : t('topLinks.typeRegular'),
    clicks: l.clicks,
    share: topClickTotal > 0 ? Math.round((l.clicks / topClickTotal) * 100) : 0,
  }));

  const fanCaptureBlocks =
    fanInsights?.topCaptureBlocks.map((b) => ({
      title: b.label || t('fanCapture.unnamedBlock'),
      captures: b.captures,
      // DESIGN-DEVIATION: API doesn't return conversionRate per block. We
      // derive from total visits in the same period (rough proxy). Backend
      // ticket #fanInsights.conversionRate tracks the real number.
      conversionPercent: visits > 0 ? (b.captures / visits) * 100 : null,
    })) ?? [];

  const captureRate = fanInsights?.summary.fanCaptureRate ?? 0;
  const captureCount = fanInsights?.summary.fanCaptures ?? 0;
  const captureViews = fanInsights?.summary.pageViews ?? visits;

  return (
    <div className="space-y-4">
      <HeroCard
        eyebrow={t('hero.eyebrow')}
        value={visits}
        prev={visitsHalf.prev}
        narrative={[
          { text: t('hero.bestDay') + ' ' },
          { text: `${heroBest}`, bold: true },
          { text: ' ' + t('hero.visits') + '. ' + t('hero.avgDaily') + ' ' },
          { text: `${heroAvg}`, bold: true },
          { text: '. ' + t.rich('hero.ctrFragment', { value: () => '' }) + ' ' },
          { text: `${ctr.toFixed(1)}%`, bold: true },
          { text: ' ' + t('hero.didClick') + '.' },
        ]}
        vsLabel={t('hero.vsPrevious')}
        sparkData={heroPoints}
        sparkColor="#E040FB"
        locale={locale}
      >
        <KpiRow>
          <KpiTile
            position="first"
            label={t('kpi.linkClicks')}
            hint={t('kpi.linkClicksHint')}
            value={linkClicks}
            prev={clicksHalf.prev}
            icon={<Link2 size={14} />}
            sparkData={(clicksSeries ?? []).map((p) => p.value)}
            sparkColor="#E040FB"
            locale={locale}
          />
          <KpiTile
            label={t('kpi.ctr')}
            value={ctr}
            prev={clicksHalf.prev > 0 ? (clicksHalf.prev / Math.max(1, visitsHalf.prev)) * 100 : 0}
            unit="%"
            decimals={1}
            icon={<Zap size={14} />}
            sparkData={(clicksSeries ?? []).map((p) => p.value)}
            sparkColor="#4ADE80"
            locale={locale}
          />
          <KpiTile
            label={t('kpi.smartResolutions')}
            value={smartRes}
            prev={smartHalf.prev}
            icon={<Share2 size={14} />}
            sparkData={(smartSeries ?? []).map((p) => p.value)}
            sparkColor="#E040FB"
            locale={locale}
          />
          <KpiTile
            label={t('kpi.captures')}
            value={captureCount}
            prev={capturesHalf.prev}
            icon={<Heart size={14} />}
            sparkData={(capturesSeries ?? []).map((p) => p.value)}
            sparkColor="#E040FB"
            locale={locale}
          />
        </KpiRow>
      </HeroCard>

      <TrendCard
        title={t('trends.title')}
        hint={t('trends.hint')}
        series={series}
        locale={locale}
      />

      <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr]">
        <TopLinksCard
          title={t('topLinks.title')}
          hint={t('topLinks.hint')}
          activeLabel={t('topLinks.active')}
          emptyMessage={t('topLinks.empty')}
          items={topLinkItems}
          seeMoreLabel={
            (overview?.topLinks ?? []).length > topLinkItems.length
              ? t('topLinks.seeAll')
              : undefined
          }
          onSeeMore={() => setTopLinksModalOpen(true)}
          locale={locale}
        />
        <SourcesCard
          title={t('sources.title')}
          hint={t('sources.hint')}
          // DESIGN-DEVIATION: API doesn't return sources yet — render empty
          // state until backend ticket #analytics.sources ships.
          items={null}
          comingSoonMessage={t('sources.comingSoon')}
        />
      </div>

      <FanCaptureCard
        title={t('fanCapture.title')}
        hint={t('fanCapture.hint')}
        successfulCaptures={captureCount}
        successfulCapturesPrev={capturesHalf.prev}
        conversionRate={captureRate}
        pageViews={captureViews}
        capturesTimeline={toPoints(capturesSeries)}
        topBlocks={fanCaptureBlocks}
        emptyMessage={t('fanCapture.empty')}
        labels={{
          successful: t('fanCapture.successful'),
          successfulDesc: t('fanCapture.successfulDesc'),
          conversion: t('fanCapture.conversion'),
          conversionDesc: t('fanCapture.conversionDesc'),
          visits: t('fanCapture.visits'),
          visitsDesc: t('fanCapture.visitsDesc'),
          capturesOverTime: t('fanCapture.capturesOverTime'),
          topBlocks: t('fanCapture.topBlocks'),
          conv: t('fanCapture.conv'),
        }}
        locale={locale}
      />

      <InfoStrip>{t('infoStrip')}</InfoStrip>

      {/* Full breakdown modal — opens from "Ver todos →" in TopLinksCard. */}
      <TopLinksModal
        open={topLinksModalOpen}
        onClose={() => setTopLinksModalOpen(false)}
        links={overview?.topLinks ?? []}
        categories={{
          social: t('topLinks.typeSocial'),
          smart: t('topLinks.typeSmart'),
          block: t('topLinks.typeRegular'),
        }}
        labels={{
          title: t('topLinks.modalTitle'),
          empty: t('topLinks.empty'),
          closeLabel: t('topLinks.modalClose'),
          columnLabel: t('topLinks.columnLabel'),
          columnType: t('topLinks.columnType'),
          columnClicks: t('topLinks.columnClicks'),
          columnShare: t('topLinks.columnShare'),
          summaryTemplate: t('topLinks.summary'),
        }}
        locale={locale}
      />
    </div>
  );
}
