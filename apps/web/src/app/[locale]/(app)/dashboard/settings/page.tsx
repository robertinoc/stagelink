import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { FeatureLockCta } from '@/components/billing/FeatureLockCta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getBillingSummary } from '@/lib/api/billing';
import { getAuthMe, getCurrentArtistId } from '@/lib/api/me';
import { getSession } from '@/lib/auth';
import { FEATURE_KEYS, getMinimumPlanForFeature, type FeatureKey } from '@stagelink/types';

const FEATURE_ORDER: FeatureKey[] = [...FEATURE_KEYS];

function resolvePlanLabel(plan: 'free' | 'pro' | 'pro_plus') {
  switch (plan) {
    case 'pro':
      return 'Pro';
    case 'pro_plus':
      return 'Pro+';
    default:
      return 'Free';
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard.settings');
  return { title: t('title') };
}

export default async function DashboardSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('dashboard.settings');
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const me = await getAuthMe(session.accessToken);
  const artistId = getCurrentArtistId(me);

  if (!artistId) {
    redirect(`/${locale}/onboarding`);
  }

  const summary = await getBillingSummary(artistId, session.accessToken);
  const lockedCount = summary.featureHighlights.filter((feature) => !feature.included).length;
  const syncing = summary.billingState === 'syncing';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{resolvePlanLabel(summary.effectivePlan)}</Badge>
          <Badge variant="outline">{t('summary.locked_count', { count: lockedCount })}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('summary.title')}</CardTitle>
          <CardDescription>
            {t('summary.description', {
              plan: resolvePlanLabel(summary.effectivePlan),
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>{t('summary.backend_source')}</p>
            <p>{syncing ? t('summary.syncing_note') : t('summary.webhook_note')}</p>
          </div>
          <Button asChild>
            <Link href={`/${locale}/dashboard/billing`}>{t('summary.cta')}</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {FEATURE_ORDER.map((feature) => {
          const enabled = summary.entitlements[feature];
          const requiredPlan = getMinimumPlanForFeature(feature);

          return (
            <Card key={feature} className={enabled ? 'border-emerald-200' : 'border-muted'}>
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">{t(`features.${feature}.title`)}</CardTitle>
                  <Badge variant={enabled ? 'secondary' : 'outline'}>
                    {enabled ? t('badges.included') : resolvePlanLabel(requiredPlan)}
                  </Badge>
                </div>
                <CardDescription>{t(`features.${feature}.description`)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {enabled
                    ? t('feature_state.included')
                    : t('feature_state.locked', { plan: resolvePlanLabel(requiredPlan) })}
                </p>
                <p className="text-xs text-muted-foreground">{t(`features.${feature}.note`)}</p>
                {enabled ? (
                  <Button asChild variant="outline">
                    <Link href={`/${locale}/dashboard/billing`}>{t('actions.manage_plan')}</Link>
                  </Button>
                ) : (
                  <FeatureLockCta
                    compact
                    title={t('actions.upgrade')}
                    description={t('feature_state.locked', {
                      plan: resolvePlanLabel(requiredPlan),
                    })}
                    currentPlanLabel={resolvePlanLabel(summary.effectivePlan)}
                    requiredPlanLabel={resolvePlanLabel(requiredPlan)}
                    href={`/${locale}/dashboard/billing`}
                    ctaLabel={t('actions.upgrade')}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
