'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Eye, Link2, TrendingUp, Zap, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { FeatureLockCta } from '@/components/billing/FeatureLockCta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type {
  AnalyticsFeatureLockPayload,
  AnalyticsOverview,
  AnalyticsRange,
} from '@/lib/api/analytics';
import type { BillingEntitlementsResponse } from '@/lib/api/billing';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsDashboardProps {
  /** Null when data could not be loaded (error state). */
  data: AnalyticsOverview | null;
  /** Currently active range preset. */
  range: AnalyticsRange;
  entitlements: BillingEntitlementsResponse | null;
  rangeLocked: boolean;
  rangeLockedPayload?: AnalyticsFeatureLockPayload | null;
  errorMessage?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RANGES: AnalyticsRange[] = ['7d', '30d', '90d', '365d'];

/** Format numbers with locale-appropriate thousands separators. */
function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n);
}

/** Format CTR as percentage with one decimal place. */
function formatCtr(ctr: number): string {
  return `${(ctr * 100).toFixed(1)}%`;
}

// ─── Range selector ───────────────────────────────────────────────────────────

function RangeSelector({
  current,
  analyticsProEnabled,
}: {
  current: AnalyticsRange;
  analyticsProEnabled: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('dashboard.analytics.range');

  function selectRange(range: AnalyticsRange) {
    if (range === '365d' && !analyticsProEnabled) {
      return;
    }

    const params = new URLSearchParams();
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

// ─── Summary cards ─────────────────────────────────────────────────────────────

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
            {card.hint && <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Top links table ──────────────────────────────────────────────────────────

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
                      {link.isSmartLink && (
                        <Badge variant="secondary" className="text-xs">
                          {t('smart_link_badge')}
                        </Badge>
                      )}
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

// ─── Empty state (no traffic yet) ────────────────────────────────────────────

function EmptyState() {
  const t = useTranslations('dashboard.analytics.empty');
  const locale = useLocale();

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed gap-3 px-6 py-12 text-center">
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

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message }: { message?: string | null }) {
  const t = useTranslations('dashboard.analytics.error');
  const router = useRouter();

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 gap-3 px-6 py-12 text-center">
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

function LockedState({
  currentPlan,
  requiredPlan,
}: {
  currentPlan: BillingEntitlementsResponse['effectivePlan'] | 'free';
  requiredPlan?: BillingEntitlementsResponse['effectivePlan'] | 'free';
}) {
  const locale = useLocale();
  const t = useTranslations('dashboard.analytics.locked');

  return (
    <FeatureLockCta
      title={t('title')}
      description={t('description', {
        currentPlan: resolvePlanLabel(currentPlan),
        requiredPlan: resolvePlanLabel(requiredPlan ?? 'pro_plus'),
      })}
      currentPlanLabel={resolvePlanLabel(currentPlan)}
      requiredPlanLabel={resolvePlanLabel(requiredPlan ?? 'pro_plus')}
      href={`/${locale}/dashboard/billing`}
      ctaLabel={t('cta')}
      secondaryHref={`/${locale}/dashboard/page`}
      secondaryLabel={t('secondary_cta')}
    />
  );
}

// ─── Data quality note ────────────────────────────────────────────────────────

function DataQualityNote({ notes }: { notes: AnalyticsOverview['notes'] }) {
  const t = useTranslations('dashboard.analytics.notes');

  // T4-4 'standard' quality: quality flags are applied — show a positive note.
  if (notes.dataQuality === 'standard') {
    return (
      <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        <span>{t('standard_quality')}</span>
      </div>
    );
  }

  // Legacy 'basic' quality: raw counts, basic filtering only.
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

// ─── Main dashboard ───────────────────────────────────────────────────────────

/** Determines if an overview has any meaningful data to show. */
function hasActivity(data: AnalyticsOverview): boolean {
  return data.summary.pageViews > 0 || data.summary.linkClicks > 0;
}

export function AnalyticsDashboard({
  data,
  range,
  entitlements,
  rangeLocked,
  rangeLockedPayload,
  errorMessage,
}: AnalyticsDashboardProps) {
  const t = useTranslations('dashboard.analytics');
  const analyticsProEnabled = entitlements?.features.analytics_pro ?? false;
  const effectivePlan = entitlements?.effectivePlan ?? 'free';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <RangeSelector current={range} analyticsProEnabled={analyticsProEnabled} />
      </div>

      {rangeLocked && (
        <LockedState
          currentPlan={rangeLockedPayload?.effectivePlan ?? effectivePlan}
          requiredPlan={rangeLockedPayload?.requiredPlan}
        />
      )}

      {/* Error state */}
      {data === null && !rangeLocked && <ErrorState message={errorMessage} />}

      {/* Has data */}
      {data !== null && !rangeLocked && (
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
        </>
      )}
    </div>
  );
}
