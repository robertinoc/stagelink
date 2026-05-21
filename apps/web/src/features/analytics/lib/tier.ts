// Derive a human-readable tier label for a platform from its capabilities.
// Backend doesn't expose `tier` yet (see plan §gaps); this is the temporary
// client-side derivation. Replace with a server-provided field once the
// `insights.platforms.tier` ticket lands.

import type { StageLinkInsightsPlatformSummary } from '@stagelink/types';

export type PlatformTier = 'full' | 'partial' | 'metrics_only';

export function derivePlatformTier(
  summary: StageLinkInsightsPlatformSummary | undefined,
): PlatformTier {
  if (!summary) return 'metrics_only';
  const caps = summary.capabilities;
  const fullSignals = [caps.topContent === 'full', caps.historicalSnapshots === 'full'].filter(
    Boolean,
  ).length;
  if (fullSignals >= 2) return 'full';
  const partialSignals = [caps.audienceMetrics, caps.topContent, caps.historicalSnapshots].filter(
    (s) => s === 'full' || s === 'partial',
  ).length;
  if (partialSignals >= 2) return 'partial';
  return 'metrics_only';
}

export function tierLabel(tier: PlatformTier, locale = 'es'): string {
  const map: Record<PlatformTier, { es: string; en: string }> = {
    full: { es: 'Completa', en: 'Full' },
    partial: { es: 'Parcial', en: 'Partial' },
    metrics_only: { es: 'Sólo métricas', en: 'Metrics only' },
  };
  return locale === 'es' ? map[tier].es : map[tier].en;
}
