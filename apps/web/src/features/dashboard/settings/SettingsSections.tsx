import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { InsightsConnectionsSettingsCard } from '@/features/dashboard/components/InsightsConnectionsSettingsCard';
import { MerchProviderSettingsCard } from '@/features/dashboard/components/MerchProviderSettingsCard';
import { ShopifySettingsCard } from '@/features/dashboard/components/ShopifySettingsCard';
import type { Artist } from '@/lib/api/artists';
import type { BillingSummaryResponse } from '@/lib/api/billing';
import type { StageLinkInsightsResult } from '@/lib/api/insights';
import type { MerchProviderConnection } from '@stagelink/types';
import type { ShopifyConnection } from '@stagelink/types';

export interface SettingsSectionCardItem {
  slug: string;
  label: string;
  description: string;
  badge: string;
  href: string;
  muted?: boolean;
}

interface SettingsOverviewGridProps {
  title: string;
  description: string;
  items: SettingsSectionCardItem[];
  openLabel: string;
}

export function SettingsOverviewGrid({
  title,
  description,
  items,
  openLabel,
}: SettingsOverviewGridProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {items.map((section) => (
          <Link
            key={section.slug}
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
              {openLabel}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

interface SettingsSectionShellProps {
  eyebrow: string;
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
  children: React.ReactNode;
}

export function SettingsSectionShell({
  eyebrow,
  title,
  description,
  backHref,
  backLabel,
  children,
}: SettingsSectionShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[1.8rem] border border-white/10 bg-card/70 p-6 shadow-[0_18px_50px_rgba(12,8,24,0.18)] backdrop-blur sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </p>
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={backHref}>{backLabel}</Link>
        </Button>
      </div>

      {children}
    </div>
  );
}

interface PlansBillingSectionProps {
  locale: string;
  artistId: string;
  summary: BillingSummaryResponse;
  t: (key: string, values?: Record<string, string | number>) => string;
  startCheckoutAction: (formData: FormData) => Promise<void>;
  startPortalAction: (formData: FormData) => Promise<void>;
  resolvePlanLabel: (plan: 'free' | 'pro' | 'pro_plus') => string;
  canUpgradeToPlan: (
    currentPlan: 'free' | 'pro' | 'pro_plus',
    nextPlan: 'free' | 'pro' | 'pro_plus',
  ) => boolean;
}

export function PlansBillingSection({
  locale,
  artistId,
  summary,
  t,
  startCheckoutAction,
  startPortalAction,
  resolvePlanLabel,
  canUpgradeToPlan,
}: PlansBillingSectionProps) {
  const syncing = summary.billingState === 'syncing';
  const plans = summary.availablePlans.filter(
    (
      plan,
    ): plan is (typeof summary.availablePlans)[number] & {
      planCode: 'free' | 'pro' | 'pro_plus';
    } => plan.planCode !== 'enterprise',
  );

  return (
    <div className="space-y-6">
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
    </div>
  );
}

interface InsightsConnectionsSectionProps {
  artistId: string;
  artist: Artist | null;
  currentPlanLabel: string;
  hasFeatureAccess: boolean;
  data: StageLinkInsightsResult | null;
}

export function InsightsConnectionsSection({
  artistId,
  artist,
  currentPlanLabel,
  hasFeatureAccess,
  data,
}: InsightsConnectionsSectionProps) {
  return (
    <InsightsConnectionsSettingsCard
      artistId={artistId}
      artist={artist}
      currentPlanLabel={currentPlanLabel}
      hasFeatureAccess={hasFeatureAccess}
      data={data?.kind === 'ok' ? data.data : null}
      errorMessage={data?.kind === 'error' ? data.message : null}
    />
  );
}

interface ShopifyStoreSectionProps {
  artistId: string;
  currentPlanLabel: string;
  hasFeatureAccess: boolean;
  initialConnection: ShopifyConnection | null;
}

export function ShopifyStoreSection({
  artistId,
  currentPlanLabel,
  hasFeatureAccess,
  initialConnection,
}: ShopifyStoreSectionProps) {
  return (
    <ShopifySettingsCard
      artistId={artistId}
      currentPlanLabel={currentPlanLabel}
      hasFeatureAccess={hasFeatureAccess}
      initialConnection={initialConnection}
    />
  );
}

interface SmartMerchSectionProps {
  artistId: string;
  currentPlanLabel: string;
  hasFeatureAccess: boolean;
  initialConnection: MerchProviderConnection | null;
}

export function SmartMerchSection({
  artistId,
  currentPlanLabel,
  hasFeatureAccess,
  initialConnection,
}: SmartMerchSectionProps) {
  return (
    <MerchProviderSettingsCard
      artistId={artistId}
      currentPlanLabel={currentPlanLabel}
      hasFeatureAccess={hasFeatureAccess}
      initialConnection={initialConnection}
    />
  );
}
