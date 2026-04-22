'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { StageLinkInsightsDashboard as StageLinkInsightsDashboardData } from '@stagelink/types';
import { AlertCircle, Eye, Info, Link2, RefreshCw, TrendingUp, UserPlus, Zap } from 'lucide-react';
import { FeatureLockCta } from '@/components/billing/FeatureLockCta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  AnalyticsFanInsights,
  AnalyticsFeatureLockPayload,
  AnalyticsOverview,
  AnalyticsProTrends,
  AnalyticsRange,
  AnalyticsSmartLinkPerformance,
  AnalyticsTrendPoint,
} from '@/lib/api/analytics';
import type { BillingEntitlementsResponse } from '@/lib/api/billing';
import type { StageLinkInsightsLockPayload } from '@/lib/api/insights';
import { InsightsDashboard } from '@/features/insights/components/InsightsDashboard';

interface AnalyticsDashboardProps {
  artistId: string;
  artistYouTubeUrl: string | null;
  data: AnalyticsOverview | null;
  proTrends: AnalyticsProTrends | null;
  smartLinkPerformance: AnalyticsSmartLinkPerformance | null;
  fanInsights: AnalyticsFanInsights | null;
  range: AnalyticsRange;
  entitlements: BillingEntitlementsResponse | null;
  insightsData: StageLinkInsightsDashboardData | null;
  insightsLockPayload?: StageLinkInsightsLockPayload | null;
  insightsErrorMessage?: string | null;
  rangeLocked: boolean;
  rangeLockedPayload?: AnalyticsFeatureLockPayload | null;
  analyticsProLockPayload?: AnalyticsFeatureLockPayload | null;
  fanInsightsLockPayload?: AnalyticsFeatureLockPayload | null;
  errorMessage?: string | null;
  analyticsProErrorMessage?: string | null;
  fanInsightsErrorMessage?: string | null;
}

const RANGES: AnalyticsRange[] = ['7d', '30d', '90d', '365d'];

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatCtr(ctr: number): string {
  return `${(ctr * 100).toFixed(1)}%`;
}

function resolvePlanLabel(plan: BillingEntitlementsResponse['effectivePlan'] | 'free') {
  switch (plan) {
    case 'pro':
      return 'Pro';
    case 'pro_plus':
      return 'Pro+';
    default:
      return 'Free';
  }
}

function RangeSelector({
  current,
  analyticsProEnabled,
}: {
  current: AnalyticsRange;
  analyticsProEnabled: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('dashboard.analytics.range');

  function selectRange(range: AnalyticsRange) {
    if (range === '365d' && !analyticsProEnabled) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set('range', range);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 rounded-lg border p-1">
      {RANGES.map((r) => (
        <div key={r} className="flex items-center gap-1">
          <button
            onClick={() => selectRange(r)}
            disabled={r === '365d' && !analyticsProEnabled}
            className={[
              'rounded px-3 py-1 text-xs font-medium transition-colors',
              r === current
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
              r === '365d' && !analyticsProEnabled ? 'cursor-not-allowed opacity-50' : '',
            ].join(' ')}
          >
            {t(r)}
          </button>
          {r === '365d' ? (
            <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
              Pro+
            </Badge>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SummaryCards({ data }: { data: AnalyticsOverview }) {
  const t = useTranslations('dashboard.analytics.stats');

  const cards = [
    {
      label: t('page_views'),
      value: formatNumber(data.summary.pageViews),
      icon: Eye,
    },
    {
      label: t('link_clicks'),
      value: formatNumber(data.summary.linkClicks),
      icon: Link2,
    },
    {
      label: t('ctr'),
      value: formatCtr(data.summary.ctr),
      icon: TrendingUp,
      hint: t('ctr_hint'),
    },
    {
      label: t('smart_link_resolutions'),
      value: formatNumber(data.summary.smartLinkResolutions),
      icon: Zap,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.label}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{card.value}</div>
            {card.hint ? <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TopLinksTable({ data }: { data: AnalyticsOverview }) {
  const t = useTranslations('dashboard.analytics.top_links');

  if (data.topLinks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('title')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-sm text-muted-foreground">{t('no_data')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="w-10 px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  {t('rank')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  {t('label')}
                </th>
                <th className="w-24 px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                  {t('clicks')}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.topLinks.map((link, idx) => (
                <tr key={link.linkItemId} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{link.label ?? link.linkItemId}</span>
                      {link.isSmartLink ? (
                        <Badge variant="secondary" className="text-xs">
                          {t('smart_link_badge')}
                        </Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatNumber(link.clicks)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  const t = useTranslations('dashboard.analytics.empty');
  const locale = useLocale();

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
      <TrendingUp className="h-10 w-10 text-muted-foreground/40" />
      <h3 className="text-base font-semibold">{t('title')}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{t('description')}</p>
      <div className="mt-2 flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/${locale}/dashboard/page`}>{t('cta_links')}</Link>
        </Button>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message?: string | null }) {
  const t = useTranslations('dashboard.analytics.error');
  const router = useRouter();

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-6 py-12 text-center">
      <AlertCircle className="h-8 w-8 text-destructive/60" />
      <h3 className="text-base font-semibold">{t('title')}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{t('description')}</p>
      {message ? <p className="max-w-sm text-xs text-destructive/80">{message}</p> : null}
      <Button variant="outline" size="sm" className="mt-2" onClick={() => router.refresh()}>
        <RefreshCw className="mr-2 h-4 w-4" />
        {t('retry')}
      </Button>
    </div>
  );
}

function SectionErrorCard({ title, message }: { title: string; message: string }) {
  const t = useTranslations('dashboard.analytics.error');

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertCircle className="h-4 w-4 text-destructive/70" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
        <p className="mt-2 text-xs text-destructive/80">{message}</p>
      </CardContent>
    </Card>
  );
}

function LockedState({
  currentPlan,
  requiredPlan,
  title,
  description,
}: {
  currentPlan: BillingEntitlementsResponse['effectivePlan'] | 'free';
  requiredPlan?: BillingEntitlementsResponse['effectivePlan'] | 'free';
  title: string;
  description: string;
}) {
  const locale = useLocale();
  const t = useTranslations('dashboard.analytics.locked');
  const isOneTierAway = currentPlan === 'pro' && (requiredPlan ?? 'pro_plus') === 'pro_plus';

  return (
    <div className="space-y-2">
      <FeatureLockCta
        title={title}
        description={description}
        currentPlanLabel={resolvePlanLabel(currentPlan)}
        requiredPlanLabel={resolvePlanLabel(requiredPlan ?? 'pro_plus')}
        href={`/${locale}/dashboard/billing`}
        ctaLabel={t('cta')}
        secondaryHref={`/${locale}/dashboard/page`}
        secondaryLabel={t('secondary_cta')}
        compact
      />
      {isOneTierAway ? <p className="text-xs text-muted-foreground">{t('one_tier_away')}</p> : null}
    </div>
  );
}

function DataQualityNote({ notes }: { notes: AnalyticsOverview['notes'] }) {
  const t = useTranslations('dashboard.analytics.notes');

  if (notes.dataQuality === 'standard') {
    return (
      <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        <span>{t('standard_quality')}</span>
      </div>
    );
  }

  if (notes.dataQuality === 'basic') {
    return (
      <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        <span>{t('basic_quality')}</span>
      </div>
    );
  }

  return null;
}

function SparkBars({
  data,
  colorClassName,
}: {
  data: AnalyticsTrendPoint[];
  colorClassName: string;
}) {
  const max = Math.max(...data.map((point) => point.value), 0);

  return (
    <div className="mt-4 flex h-24 items-end gap-1">
      {data.map((point) => {
        const height = max > 0 ? Math.max(8, Math.round((point.value / max) * 96)) : 8;
        return (
          <div
            key={point.date}
            className={`min-w-0 flex-1 rounded-t ${colorClassName}`}
            style={{ height }}
            title={`${point.date}: ${formatNumber(point.value)}`}
          />
        );
      })}
    </div>
  );
}

function TrendMetricCard({
  title,
  description,
  series,
  colorClassName,
}: {
  title: string;
  description: string;
  series: AnalyticsTrendPoint[];
  colorClassName: string;
}) {
  const total = series.reduce((sum, point) => sum + point.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums">{formatNumber(total)}</div>
        <SparkBars data={series} colorClassName={colorClassName} />
      </CardContent>
    </Card>
  );
}

function AdvancedTrendsSection({ data }: { data: AnalyticsProTrends }) {
  const t = useTranslations('dashboard.analytics.pro.trends');

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <TrendMetricCard
          title={t('page_views_title')}
          description={t('page_views_description')}
          series={data.series.pageViews}
          colorClassName="bg-primary/70"
        />
        <TrendMetricCard
          title={t('link_clicks_title')}
          description={t('link_clicks_description')}
          series={data.series.linkClicks}
          colorClassName="bg-sky-500/70"
        />
        <TrendMetricCard
          title={t('smart_link_title')}
          description={t('smart_link_description')}
          series={data.series.smartLinkResolutions}
          colorClassName="bg-emerald-500/70"
        />
      </div>
    </section>
  );
}

function SmartLinkPerformanceSection({ data }: { data: AnalyticsSmartLinkPerformance }) {
  const t = useTranslations('dashboard.analytics.pro.smart_links');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </CardHeader>
      <CardContent className="p-0">
        {data.items.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    {t('label')}
                  </th>
                  <th className="w-24 px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    {t('clicks')}
                  </th>
                  <th className="w-28 px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    {t('resolutions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.smartLinkId} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{item.label}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(item.clicks)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(item.resolutions)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FanInsightsSection({ data }: { data: AnalyticsFanInsights }) {
  const t = useTranslations('dashboard.analytics.fan_insights');

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('summary.captures')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-semibold tabular-nums">
              <UserPlus className="h-5 w-5 text-primary" />
              {formatNumber(data.summary.fanCaptures)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t('summary.captures_hint')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('summary.capture_rate')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">
              {formatCtr(data.summary.fanCaptureRate)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t('summary.capture_rate_hint')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('summary.page_views')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tabular-nums">
              {formatNumber(data.summary.pageViews)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{t('summary.page_views_hint')}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('captures_over_time_title')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('captures_over_time_description')}</p>
          </CardHeader>
          <CardContent>
            {data.capturesOverTime.some((point) => point.value > 0) ? (
              <SparkBars data={data.capturesOverTime} colorClassName="bg-fuchsia-500/70" />
            ) : (
              <p className="text-sm text-muted-foreground">{t('captures_empty')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('top_blocks_title')}</CardTitle>
            <p className="text-sm text-muted-foreground">{t('top_blocks_description')}</p>
          </CardHeader>
          <CardContent>
            {data.topCaptureBlocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('top_blocks_empty')}</p>
            ) : (
              <div className="space-y-3">
                {data.topCaptureBlocks.map((block) => (
                  <div
                    key={block.blockId}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{block.label}</p>
                      <p className="text-xs text-muted-foreground">{block.blockId}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">
                        {formatNumber(block.captures)}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('captures_label')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        <span>{t('formula_note')}</span>
      </div>
    </section>
  );
}

function hasActivity(data: AnalyticsOverview): boolean {
  return data.summary.pageViews > 0 || data.summary.linkClicks > 0;
}

export function AnalyticsDashboard({
  artistId,
  artistYouTubeUrl,
  data,
  proTrends,
  smartLinkPerformance,
  fanInsights,
  range,
  entitlements,
  insightsData,
  insightsLockPayload,
  insightsErrorMessage,
  rangeLocked,
  rangeLockedPayload,
  analyticsProLockPayload,
  fanInsightsLockPayload,
  errorMessage,
  analyticsProErrorMessage,
  fanInsightsErrorMessage,
}: AnalyticsDashboardProps) {
  const t = useTranslations('dashboard.analytics');
  const locale = useLocale();
  const analyticsProEnabled = entitlements?.features.analytics_pro ?? false;
  const effectivePlan = entitlements?.effectivePlan ?? 'free';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <RangeSelector current={range} analyticsProEnabled={analyticsProEnabled} />
      </div>

      {rangeLocked ? (
        <LockedState
          currentPlan={rangeLockedPayload?.effectivePlan ?? effectivePlan}
          requiredPlan={rangeLockedPayload?.requiredPlan}
          title={t('locked.title')}
          description={t('locked.description', {
            currentPlan: resolvePlanLabel(rangeLockedPayload?.effectivePlan ?? effectivePlan),
            requiredPlan: resolvePlanLabel(rangeLockedPayload?.requiredPlan ?? 'pro_plus'),
          })}
        />
      ) : null}

      {data === null && !rangeLocked ? <ErrorState message={errorMessage} /> : null}

      {data !== null && !rangeLocked ? (
        <>
          <SummaryCards data={data} />

          {hasActivity(data) ? (
            <>
              <TopLinksTable data={data} />
              <DataQualityNote notes={data.notes} />
            </>
          ) : (
            <EmptyState />
          )}

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{t('pro.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('pro.description')}</p>
            </div>

            {analyticsProLockPayload ? (
              <LockedState
                currentPlan={analyticsProLockPayload.effectivePlan}
                requiredPlan={analyticsProLockPayload.requiredPlan}
                title={t('pro.locked_title')}
                description={t('pro.locked_description', {
                  currentPlan: resolvePlanLabel(analyticsProLockPayload.effectivePlan),
                  requiredPlan: resolvePlanLabel(analyticsProLockPayload.requiredPlan),
                })}
              />
            ) : analyticsProErrorMessage ? (
              <SectionErrorCard title={t('pro.title')} message={analyticsProErrorMessage} />
            ) : proTrends && smartLinkPerformance ? (
              <>
                <AdvancedTrendsSection data={proTrends} />
                <SmartLinkPerformanceSection data={smartLinkPerformance} />
              </>
            ) : null}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{t('fan_insights.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('fan_insights.description')}</p>
            </div>

            {fanInsightsLockPayload ? (
              <LockedState
                currentPlan={fanInsightsLockPayload.effectivePlan}
                requiredPlan={fanInsightsLockPayload.requiredPlan}
                title={t('fan_insights.locked_title')}
                description={t('fan_insights.locked_description', {
                  currentPlan: resolvePlanLabel(fanInsightsLockPayload.effectivePlan),
                  requiredPlan: resolvePlanLabel(fanInsightsLockPayload.requiredPlan),
                })}
              />
            ) : fanInsightsErrorMessage ? (
              <SectionErrorCard title={t('fan_insights.title')} message={fanInsightsErrorMessage} />
            ) : fanInsights ? (
              <FanInsightsSection data={fanInsights} />
            ) : null}
          </section>
        </>
      ) : null}

      <section id="stage-link-insights" className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t('insights_section.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('insights_section.description')}</p>
        </div>

        <InsightsDashboard
          artistId={artistId}
          artistSpotifyUrl={null}
          artistYouTubeUrl={artistYouTubeUrl}
          data={insightsData}
          entitlements={entitlements}
          lockedPayload={insightsLockPayload}
          errorMessage={insightsErrorMessage}
          mode="embedded"
          rangeParamName="insightsRange"
          settingsHref={`/${locale}/dashboard/settings#insights-connections`}
        />
      </section>
    </div>
  );
}
