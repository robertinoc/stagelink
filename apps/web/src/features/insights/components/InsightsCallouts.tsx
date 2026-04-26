'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, Sparkles, Star, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { StageLinkInsightsDashboard } from '@stagelink/types';
import { computeInsights, type InsightCallout, type InsightCalloutKind } from '../computeInsights';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatNumber(value: number | undefined, locale: string): string {
  if (value === undefined) return '';
  return new Intl.NumberFormat(locale, {
    notation: value >= 1_000_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

function signedNumber(value: number): string {
  return value >= 0 ? `+${value.toLocaleString()}` : value.toLocaleString();
}

function signedPct(pct: number): string {
  const rounded = Math.abs(pct) < 0.1 ? '< 0.1' : Math.abs(pct).toFixed(1);
  return pct >= 0 ? `+${rounded}%` : `-${rounded}%`;
}

// ---------------------------------------------------------------------------
// Visual config per callout kind
// ---------------------------------------------------------------------------

interface KindConfig {
  Icon: React.ElementType;
  iconClass: string;
  borderClass: string;
  badgeClass: string;
}

const KIND_CONFIG: Record<InsightCalloutKind, KindConfig> = {
  fastest_growing: {
    Icon: TrendingUp,
    iconClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/20 bg-emerald-500/5',
    badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  },
  top_content: {
    Icon: Star,
    iconClass: 'text-amber-400',
    borderClass: 'border-amber-500/20 bg-amber-500/5',
    badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
  momentum_building: {
    Icon: Zap,
    iconClass: 'text-blue-400',
    borderClass: 'border-blue-500/20 bg-blue-500/5',
    badgeClass: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  },
  growth_flattening: {
    Icon: TrendingDown,
    iconClass: 'text-muted-foreground',
    borderClass: 'border-border/50 bg-muted/20',
    badgeClass: 'border-muted/30 bg-muted/10 text-muted-foreground',
  },
  newly_connected: {
    Icon: Sparkles,
    iconClass: 'text-violet-400',
    borderClass: 'border-violet-500/20 bg-violet-500/5',
    badgeClass: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
  },
};

// ---------------------------------------------------------------------------
// Single callout card
// ---------------------------------------------------------------------------

function CalloutCard({ callout, locale }: { callout: InsightCallout; locale: string }) {
  const t = useTranslations('dashboard.insights.callouts');
  const config = KIND_CONFIG[callout.kind];
  const Icon = config.Icon;

  function renderBody() {
    switch (callout.kind) {
      case 'fastest_growing':
        return (
          <p className="text-sm text-muted-foreground">
            {t('fastest_growing.body', {
              platform: callout.platformLabel,
              delta: formatNumber(callout.absoluteDelta, locale),
              pct: callout.pctChange !== undefined ? signedPct(callout.pctChange) : '',
            })}
          </p>
        );

      case 'top_content':
        return (
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground line-clamp-1">
              {callout.contentTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              {callout.contentMetricLabel}: {callout.contentMetricValue}
            </p>
            {callout.contentUrl ? (
              <a
                href={callout.contentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {t('top_content.view_link')}
                <ArrowUpRight className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        );

      case 'momentum_building':
        return (
          <p className="text-sm text-muted-foreground">
            {t('momentum_building.body', {
              platform: callout.platformLabel,
              delta: signedNumber(callout.absoluteDelta ?? 0),
            })}
          </p>
        );

      case 'growth_flattening':
        return (
          <p className="text-sm text-muted-foreground">
            {t('growth_flattening.body', {
              platform: callout.platformLabel,
            })}
          </p>
        );

      case 'newly_connected':
        return (
          <p className="text-sm text-muted-foreground">
            {t('newly_connected.body', {
              platform: callout.platformLabel,
              days:
                callout.connectedDaysAgo === 0
                  ? t('newly_connected.today')
                  : String(callout.connectedDaysAgo),
            })}
          </p>
        );
    }
  }

  function renderTitle() {
    switch (callout.kind) {
      case 'fastest_growing':
        return t('fastest_growing.title');
      case 'top_content':
        return t('top_content.title', { platform: callout.platformLabel });
      case 'momentum_building':
        return t('momentum_building.title');
      case 'growth_flattening':
        return t('growth_flattening.title');
      case 'newly_connected':
        return t('newly_connected.title');
    }
  }

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-3 ${config.borderClass}`}>
      <div className="mt-0.5 shrink-0">
        <Icon className={`h-4 w-4 ${config.iconClass}`} />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-foreground">{renderTitle()}</p>
          <Badge variant="outline" className={`shrink-0 text-xs ${config.badgeClass}`}>
            {callout.platformLabel}
          </Badge>
        </div>
        {renderBody()}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

interface InsightsCalloutsProps {
  data: StageLinkInsightsDashboard;
}

export function InsightsCallouts({ data }: InsightsCalloutsProps) {
  const t = useTranslations('dashboard.insights.callouts');
  const locale = useLocale();

  const callouts = computeInsights(data);

  if (callouts.length === 0) return null;

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">{t('section_title')}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {callouts.map((callout) => (
            <CalloutCard key={callout.id} callout={callout} locale={locale} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
