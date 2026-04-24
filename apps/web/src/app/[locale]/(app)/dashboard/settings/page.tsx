import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getBillingSummary } from '@/lib/api/billing';
import { getArtist } from '@/lib/api/artists';
import { getStageLinkInsightsDashboard } from '@/lib/api/insights';
import { getAuthMe, getCurrentArtistId } from '@/lib/api/me';
import { getMerchConnection } from '@/lib/api/merch';
import { getShopifyConnection } from '@/lib/api/shopify';
import { getSession } from '@/lib/auth';
import { startCheckoutAction, startPortalAction } from '../billing/actions';
import { InsightsConnectionsSettingsCard } from '@/features/dashboard/components/InsightsConnectionsSettingsCard';
import { MerchProviderSettingsCard } from '@/features/dashboard/components/MerchProviderSettingsCard';
import { ShopifySettingsCard } from '@/features/dashboard/components/ShopifySettingsCard';

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

function canUpgradeToPlan(
  currentPlan: 'free' | 'pro' | 'pro_plus',
  nextPlan: 'free' | 'pro' | 'pro_plus',
) {
  const rank = { free: 0, pro: 1, pro_plus: 2 };
  return rank[nextPlan] > rank[currentPlan];
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

  const [summary, artist] = await Promise.all([
    getBillingSummary(artistId, session.accessToken),
    getArtist(artistId, session.accessToken).catch(() => null),
  ]);

  const [shopifyConnection, merchConnection, insightsResult] = await Promise.all([
    summary.entitlements.shopify_integration
      ? getShopifyConnection(artistId, session.accessToken).catch(() => null)
      : Promise.resolve(null),
    summary.entitlements.smart_merch
      ? getMerchConnection(artistId, session.accessToken).catch(() => null)
      : Promise.resolve(null),
    summary.entitlements.stage_link_insights
      ? getStageLinkInsightsDashboard(artistId, session.accessToken, '30d').catch(() => ({
          kind: 'error' as const,
          message: 'Failed to load StageLink Insights connections',
        }))
      : Promise.resolve(null),
  ]);

  const syncing = summary.billingState === 'syncing';
  const plans = summary.availablePlans.filter(
    (
      plan,
    ): plan is (typeof summary.availablePlans)[number] & {
      planCode: 'free' | 'pro' | 'pro_plus';
    } => plan.planCode !== 'enterprise',
  );
  const settingsSections = [
    {
      id: 'plans-billing',
      label: t('navigation.plans_billing'),
      description: t('overview.plans_billing'),
      badge: resolvePlanLabel(summary.effectivePlan),
      href: '#plans-billing',
    },
    {
      id: 'insights-connections',
      label: t('navigation.insights_connections'),
      description: t('overview.insights_connections'),
      badge: summary.entitlements.stage_link_insights
        ? t('overview.badges.enabled')
        : t('overview.badges.locked'),
      href: '#insights-connections',
      muted: !summary.entitlements.stage_link_insights,
    },
    {
      id: 'shopify-store',
      label: t('navigation.shopify_store'),
      description: t('overview.shopify_store'),
      badge:
        summary.entitlements.shopify_integration && shopifyConnection
          ? t('overview.badges.connected')
          : summary.entitlements.shopify_integration
            ? t('overview.badges.ready')
            : t('overview.badges.locked'),
      href: '#shopify-store',
      muted: !summary.entitlements.shopify_integration,
    },
    {
      id: 'smart-merch',
      label: t('navigation.smart_merch'),
      description: t('overview.smart_merch'),
      badge:
        summary.entitlements.smart_merch && merchConnection
          ? t('overview.badges.connected')
          : summary.entitlements.smart_merch
            ? t('overview.badges.ready')
            : t('overview.badges.locked'),
      href: '#smart-merch',
      muted: !summary.entitlements.smart_merch,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{resolvePlanLabel(summary.effectivePlan)}</Badge>
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
          <div className="flex flex-wrap gap-2">
            {summary.portalAvailable ? (
              <form action={startPortalAction}>
                <input type="hidden" name="artistId" value={artistId} />
                <input type="hidden" name="locale" value={locale} />
                <Button type="submit" variant="outline">
                  {t('summary.portal_cta')}
                </Button>
              </form>
            ) : null}
            <Button asChild>
              <Link href={`/${locale}/dashboard/billing`}>{t('summary.cta')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{t('navigation.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('navigation.description')}</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {settingsSections.map((section) => (
            <a
              key={section.id}
              href={section.href}
              className={cn(
                'group rounded-[1.6rem] border border-border/70 bg-card/70 p-6 transition hover:border-primary/35 hover:bg-primary/[0.05] hover:shadow-[0_16px_40px_rgba(155,48,208,0.12)]',
                section.muted && 'opacity-90',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-foreground">{section.label}</p>
                  <p className="mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
                    {section.description}
                  </p>
                </div>
                <Badge variant="secondary">{section.badge}</Badge>
              </div>
              <div className="mt-5 inline-flex text-sm font-medium text-primary transition group-hover:text-primary/85">
                {t('overview.open_section')}
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="plans-billing" className="space-y-4 scroll-mt-24">
        <div>
          <h2 className="text-lg font-semibold">{t('plans.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('plans.description')}</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.planCode === summary.billingPlan;
            const isEffective = plan.planCode === summary.effectivePlan;
            const canUpgrade = canUpgradeToPlan(summary.billingPlan, plan.planCode);

            return (
              <Card
                key={plan.planCode}
                className={isCurrent ? 'border-primary shadow-sm shadow-primary/10' : undefined}
              >
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>{plan.displayName}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {isCurrent ? (
                        <Badge variant="secondary">{t('plans.badges.current')}</Badge>
                      ) : null}
                      {isEffective && !isCurrent ? (
                        <Badge variant="outline">{t('plans.badges.access')}</Badge>
                      ) : null}
                    </div>
                  </div>
                  <CardDescription>
                    {isCurrent
                      ? t('plans.current_description')
                      : isEffective
                        ? t('plans.access_description')
                        : t('plans.available_description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-2xl font-semibold">
                      {plan.priceDisplay}
                      {plan.interval ? (
                        <span className="ml-1 text-sm font-normal text-muted-foreground">
                          /{plan.interval}
                        </span>
                      ) : null}
                    </p>
                  </div>

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {plan.features.slice(0, 5).map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="mt-0.5 text-foreground">•</span>
                        <span>{t(`features.${feature}.title`)}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {canUpgrade ? (
                      <form action={startCheckoutAction}>
                        <input type="hidden" name="artistId" value={artistId} />
                        <input type="hidden" name="plan" value={plan.planCode} />
                        <input type="hidden" name="locale" value={locale} />
                        <Button type="submit">
                          {t('plans.upgrade_cta', {
                            plan: resolvePlanLabel(plan.planCode),
                          })}
                        </Button>
                      </form>
                    ) : (
                      <Button type="button" variant="outline" disabled>
                        {isCurrent ? t('plans.current_cta') : t('plans.included_cta')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('plans.manage_title')}</CardTitle>
            <CardDescription>{t('plans.manage_description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            {summary.portalAvailable ? (
              <form action={startPortalAction}>
                <input type="hidden" name="artistId" value={artistId} />
                <input type="hidden" name="locale" value={locale} />
                <Button type="submit">{t('plans.manage_cta')}</Button>
              </form>
            ) : null}
            <Button asChild variant="outline">
              <Link href={`/${locale}/dashboard/billing`}>{t('plans.legacy_cta')}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section id="insights-connections" className="scroll-mt-24">
        <InsightsConnectionsSettingsCard
          artistId={artistId}
          artist={artist}
          currentPlanLabel={resolvePlanLabel(summary.effectivePlan)}
          hasFeatureAccess={summary.entitlements.stage_link_insights}
          data={insightsResult?.kind === 'ok' ? insightsResult.data : null}
          errorMessage={insightsResult?.kind === 'error' ? insightsResult.message : null}
        />
      </section>

      <section id="shopify-store" className="scroll-mt-24">
        <ShopifySettingsCard
          artistId={artistId}
          currentPlanLabel={resolvePlanLabel(summary.effectivePlan)}
          hasFeatureAccess={summary.entitlements.shopify_integration}
          initialConnection={shopifyConnection}
        />
      </section>

      <section id="smart-merch" className="scroll-mt-24">
        <MerchProviderSettingsCard
          artistId={artistId}
          currentPlanLabel={resolvePlanLabel(summary.effectivePlan)}
          hasFeatureAccess={summary.entitlements.smart_merch}
          initialConnection={merchConnection}
        />
      </section>
    </div>
  );
}
