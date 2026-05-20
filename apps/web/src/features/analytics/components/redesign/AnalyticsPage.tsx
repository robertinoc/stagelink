'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type {
  AnalyticsFanInsights,
  AnalyticsFeatureLockPayload,
  AnalyticsOverview,
  AnalyticsProTrends,
  AnalyticsRange,
} from '@/lib/api/analytics';
import type { StageLinkInsightsDashboard } from '@stagelink/types';
import { SectionHeader } from '@/components/sl/SlPrimitives';
import { FeatureLockCta } from '@/components/billing/FeatureLockCta';
import { Bento } from '@/components/sl/Bento';
import { PeriodPicker } from './PeriodPicker';
import { AnalyticsTabs, type AnalyticsTabId } from './AnalyticsTabs';
import { PageTab } from './PageTab';
import { PlatformsTab } from './PlatformsTab';

interface AnalyticsPageProps {
  overview: AnalyticsOverview | null;
  proTrends: AnalyticsProTrends | null;
  fanInsights: AnalyticsFanInsights | null;
  insights: StageLinkInsightsDashboard | null;
  range: AnalyticsRange;
  hasOneYearAccess: boolean;
  rangeLockedPayload: AnalyticsFeatureLockPayload | null;
  errorMessage: string | null;
  artistId: string;
  artistYouTubeUrl: string | null;
}

export function AnalyticsPage({
  overview,
  proTrends,
  fanInsights,
  insights,
  range,
  hasOneYearAccess,
  rangeLockedPayload,
  errorMessage,
  artistId,
  artistYouTubeUrl,
}: AnalyticsPageProps) {
  const t = useTranslations('analytics.v2');
  const rawLocale = useLocale();
  const locale: 'es' | 'en' = rawLocale === 'es' ? 'es' : 'en';
  const [activeTab, setActiveTab] = useState<AnalyticsTabId>('page');

  return (
    <section className="sl-analytics">
      <SectionHeader
        eyebrow={t('eyebrow')}
        title={t('titlePart1')}
        gradient={t('titlePart2')}
        subtitle={t('subtitle')}
        right={
          <PeriodPicker
            range={range}
            hasOneYearAccess={hasOneYearAccess}
            labels={{
              d7: t('period.d7'),
              d30: t('period.d30'),
              d90: t('period.d90'),
              y1: t('period.y1'),
              proBadge: t('period.proBadge'),
            }}
          />
        }
      />

      <AnalyticsTabs
        activeId={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'page', label: t('tabs.page'), hint: t('tabs.pageHint') },
          { id: 'platforms', label: t('tabs.platforms'), hint: t('tabs.platformsHint') },
        ]}
      />

      <div className="px-8 py-6">
        {rangeLockedPayload ? (
          <FeatureLockCta
            title={t('lock.title')}
            description={rangeLockedPayload.message}
            currentPlanLabel={String(rangeLockedPayload.effectivePlan)}
            requiredPlanLabel={String(rangeLockedPayload.requiredPlan)}
            href="/dashboard/settings/billing"
            ctaLabel={t('lock.cta')}
          />
        ) : errorMessage ? (
          <Bento pad={22}>
            <p className="text-[13.5px] text-white/70">{errorMessage}</p>
          </Bento>
        ) : activeTab === 'page' ? (
          <PageTab
            overview={overview}
            proTrends={proTrends}
            fanInsights={fanInsights}
            locale={locale}
          />
        ) : (
          <PlatformsTab
            insights={insights}
            artistYouTubeUrl={artistYouTubeUrl}
            artistId={artistId}
            locale={locale}
          />
        )}
      </div>

      <style jsx global>{`
        @keyframes sl-progress {
          0% {
            transform: translateX(-100%);
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0.4;
          }
        }
      `}</style>
    </section>
  );
}
