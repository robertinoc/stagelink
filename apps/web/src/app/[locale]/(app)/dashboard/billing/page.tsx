import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { BillingMessageCode, BillingUiState, FeatureKey, PlanCode } from '@stagelink/types';
import { ClearBillingFeedbackParams } from '@/components/billing/ClearBillingFeedbackParams';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getArtist } from '@/lib/api/artists';
import { getBillingSummary, type BillingSummaryResponse } from '@/lib/api/billing';
import { getAuthMe } from '@/lib/api/me';
import { getSession } from '@/lib/auth';
import { refreshBillingStatusAction, startCheckoutAction, startPortalAction } from './actions';

interface DashboardBillingPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<BillingPageQueryParams>;
}

interface BillingPageQueryParams {
  checkout?: string;
  error?: string;
  portal?: string;
  refresh?: string;
}

const PLAN_BADGE_VARIANTS = {
  free: 'secondary',
  pro: 'default',
  pro_plus: 'default',
  enterprise: 'outline',
} as const;

const STATE_BADGE_VARIANTS: Record<
  BillingUiState,
  'secondary' | 'default' | 'destructive' | 'outline'
> = {
  free: 'secondary',
  active: 'default',
  trialing: 'default',
  payment_issue: 'destructive',
  canceling: 'outline',
  canceled: 'outline',
  pending_checkout: 'outline',
  syncing: 'outline',
};

function resolvePlanLabel(plan: PlanCode | 'enterprise') {
  switch (plan) {
    case 'pro':
      return 'Pro';
    case 'pro_plus':
      return 'Pro+';
    case 'enterprise':
      return 'Enterprise';
    default:
      return 'Free';
  }
}

function resolveFeatureKey(
  feature: BillingSummaryResponse['featureHighlights'][number]['feature'],
) {
  return feature as FeatureKey;
}

function resolveStateLabel(state: BillingUiState, t: Awaited<ReturnType<typeof getTranslations>>) {
  return t(`dashboard.billing.states.${state}`);
}

function resolveBillingMessage(
  code: BillingSummaryResponse['billingMessages'][number]['code'],
  t: Awaited<ReturnType<typeof getTranslations>>,
  renewalDisplay: string,
) {
  switch (code) {
    case 'CHECKOUT_PENDING_CONFIRMATION':
      return t('dashboard.billing.messages.checkout_syncing');
    case 'CANCELS_AT_PERIOD_END':
      return t('dashboard.billing.messages.cancels_at_period_end', { date: renewalDisplay });
    case 'ACCESS_UNTIL_PERIOD_END':
      return t('dashboard.billing.messages.access_until_period_end', { date: renewalDisplay });
    case 'PAYMENT_ISSUE_ACCESS_RETAINED':
      return t('dashboard.billing.messages.payment_issue_access_retained', {
        date: renewalDisplay,
      });
    case 'PAYMENT_ISSUE_ACCESS_REVOKED':
      return t('dashboard.billing.messages.payment_issue_access_revoked');
    case 'SUBSCRIPTION_CANCELED':
      return t('dashboard.billing.messages.subscription_canceled');
    default:
      return t('dashboard.billing.messages.no_active_subscription');
  }
}

function getPrimaryBillingMessage(
  summary: BillingSummaryResponse,
  query: BillingPageQueryParams,
): BillingSummaryResponse['billingMessages'][number] | null {
  if (
    summary.notes.isWebhookSyncPending ||
    query.checkout === 'success' ||
    query.checkout === 'canceled' ||
    query.error
  ) {
    return null;
  }

  if (query.portal !== 'returned' && query.refresh !== 'done') {
    return null;
  }

  const priority: BillingMessageCode[] = [
    'PAYMENT_ISSUE_ACCESS_REVOKED',
    'PAYMENT_ISSUE_ACCESS_RETAINED',
    'ACCESS_UNTIL_PERIOD_END',
    'SUBSCRIPTION_CANCELED',
    'CANCELS_AT_PERIOD_END',
  ];

  for (const code of priority) {
    const match = summary.billingMessages.find((message) => message.code === code);
    if (match) {
      return match;
    }
  }

  return null;
}

function getSecondaryBillingMessages(
  summary: BillingSummaryResponse,
  query: BillingPageQueryParams,
) {
  const suppressedCodes = new Set<BillingMessageCode>();
  const primaryMessage = getPrimaryBillingMessage(summary, query);

  if (
    query.checkout === 'success' ||
    query.portal === 'returned' ||
    query.refresh === 'done' ||
    summary.notes.isWebhookSyncPending
  ) {
    suppressedCodes.add('CHECKOUT_PENDING_CONFIRMATION');
  }

  if (query.checkout === 'canceled') {
    suppressedCodes.add('NO_ACTIVE_SUBSCRIPTION');
    suppressedCodes.add('CHECKOUT_PENDING_CONFIRMATION');
  }

  if (query.refresh === 'done' || query.portal === 'returned') {
    suppressedCodes.add('NO_ACTIVE_SUBSCRIPTION');
  }

  if (primaryMessage) {
    suppressedCodes.add(primaryMessage.code);
  }

  return summary.billingMessages.filter((message) => !suppressedCodes.has(message.code));
}
function resolveReturnBanner(
  summary: BillingSummaryResponse,
  query: BillingPageQueryParams,
  t: Awaited<ReturnType<typeof getTranslations>>,
) {
  if (query.error) {
    let messageKey = 'dashboard.billing.messages.checkout_error';
    if (query.error === 'portal') {
      messageKey = 'dashboard.billing.messages.portal_error';
    } else if (query.error === 'refresh') {
      messageKey = 'dashboard.billing.messages.refresh_error';
    }

    return {
      tone: 'destructive' as const,
      title: t('dashboard.billing.feedback.error_title'),
      description: t(messageKey),
    };
  }

  if (query.checkout === 'success') {
    return {
      tone: 'warning' as const,
      title: t('dashboard.billing.feedback.sync_title'),
      description: t('dashboard.billing.messages.checkout_syncing'),
    };
  }

  if (query.checkout === 'canceled') {
    return {
      tone: 'warning' as const,
      title: t('dashboard.billing.feedback.warning_title'),
      description: t('dashboard.billing.messages.checkout_canceled'),
    };
  }

  if (query.portal === 'returned') {
    const primaryMessage = getPrimaryBillingMessage(summary, query);
    return {
      tone: summary.notes.isWebhookSyncPending
        ? ('warning' as const)
        : primaryMessage?.type === 'error'
          ? ('destructive' as const)
          : primaryMessage?.type === 'warning'
            ? ('warning' as const)
            : ('info' as const),
      title: summary.notes.isWebhookSyncPending
        ? t('dashboard.billing.feedback.sync_title')
        : t('dashboard.billing.feedback.info_title'),
      description: summary.notes.isWebhookSyncPending
        ? t('dashboard.billing.messages.portal_syncing')
        : primaryMessage
          ? resolveBillingMessage(
              primaryMessage.code,
              t,
              summary.currentPeriodEnd
                ? new Date(summary.currentPeriodEnd).toLocaleDateString()
                : t('dashboard.billing.fields.not_available'),
            )
          : t('dashboard.billing.messages.portal_returned'),
    };
  }

  if (query.refresh === 'done') {
    const primaryMessage = getPrimaryBillingMessage(summary, query);
    return {
      tone: summary.notes.isWebhookSyncPending
        ? ('warning' as const)
        : primaryMessage?.type === 'error'
          ? ('destructive' as const)
          : primaryMessage?.type === 'warning'
            ? ('warning' as const)
            : ('info' as const),
      title: summary.notes.isWebhookSyncPending
        ? t('dashboard.billing.feedback.sync_title')
        : t('dashboard.billing.feedback.info_title'),
      description: summary.notes.isWebhookSyncPending
        ? t('dashboard.billing.messages.sync_pending')
        : primaryMessage
          ? resolveBillingMessage(
              primaryMessage.code,
              t,
              summary.currentPeriodEnd
                ? new Date(summary.currentPeriodEnd).toLocaleDateString()
                : t('dashboard.billing.fields.not_available'),
            )
          : t('dashboard.billing.messages.refresh_completed'),
    };
  }

  if (summary.notes.isWebhookSyncPending) {
    return {
      tone: 'warning' as const,
      title: t('dashboard.billing.feedback.sync_title'),
      description: t('dashboard.billing.messages.sync_pending'),
    };
  }

  return null;
}

function FeedbackBanner({
  tone,
  title,
  description,
}: {
  tone: 'success' | 'warning' | 'destructive' | 'info';
  title: string;
  description: string;
}) {
  const toneClasses = {
    success: 'border-emerald-200 bg-emerald-50/70 text-emerald-950',
    warning: 'border-amber-200 bg-amber-50/70 text-amber-950',
    destructive: 'border-destructive/30 bg-destructive/5 text-destructive',
    info: 'border-sky-200 bg-sky-50/70 text-sky-950',
  } as const;

  return (
    <Card className={toneClasses[tone]}>
      <CardContent className="space-y-1 p-4">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function SummaryErrorState({
  locale,
  title,
  description,
  retryLabel,
}: {
  locale: string;
  title: string;
  description: string;
  retryLabel: string;
}) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button asChild variant="outline">
          <Link href={`/${locale}/dashboard/billing`}>{retryLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function canUpgradeToPlan(summary: BillingSummaryResponse, planCode: PlanCode | 'enterprise') {
  if (planCode === 'enterprise') return false;
  if (!summary.upgradeOptions.canUpgrade) return false;

  const rank = { free: 0, pro: 1, pro_plus: 2 };
  return rank[planCode] > rank[summary.billingPlan];
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard.billing');
  return { title: t('title') };
}

export default async function DashboardBillingPage({
  params,
  searchParams,
}: DashboardBillingPageProps) {
  const { locale } = await params;
  const query = await searchParams;
  const t = await getTranslations();
  const billingT = await getTranslations('dashboard.billing');
  const settingsT = await getTranslations('dashboard.settings');
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const me = await getAuthMe(session.accessToken);
  const artistId = me?.artistIds[0];

  if (!artistId) {
    redirect(`/${locale}/onboarding`);
  }

  const [artist, summaryResult] = await Promise.all([
    getArtist(artistId, session.accessToken),
    getBillingSummary(artistId, session.accessToken)
      .then((summary) => ({ summary, error: null as string | null }))
      .catch((error: unknown) => ({
        summary: null as BillingSummaryResponse | null,
        error: error instanceof Error ? error.message : billingT('messages.summary_load_error'),
      })),
  ]);

  if (!summaryResult.summary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{billingT('title')}</h1>
          <p className="text-sm text-muted-foreground">{billingT('description')}</p>
        </div>
        <SummaryErrorState
          locale={locale}
          title={billingT('feedback.error_title')}
          description={summaryResult.error ?? billingT('messages.summary_load_error')}
          retryLabel={billingT('actions.retry')}
        />
      </div>
    );
  }

  const summary = summaryResult.summary;
  const banner = resolveReturnBanner(summary, query, t);
  const secondaryBillingMessages = getSecondaryBillingMessages(summary, query);
  const renewalDisplay = summary.currentPeriodEnd
    ? new Date(summary.currentPeriodEnd).toLocaleDateString(locale)
    : billingT('fields.not_available');
  const cancellationLabel =
    summary.billingState === 'canceling'
      ? billingT('fields.canceling')
      : summary.subscriptionStatus === 'canceled' || summary.billingState === 'canceled'
        ? t('dashboard.billing.states.canceled')
        : billingT('fields.active');

  return (
    <div className="space-y-6">
      <ClearBillingFeedbackParams />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{billingT('title')}</h1>
          <p className="text-sm text-muted-foreground">{billingT('description')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={PLAN_BADGE_VARIANTS[summary.effectivePlan]}>
            {resolvePlanLabel(summary.effectivePlan)}
          </Badge>
          <Badge variant={STATE_BADGE_VARIANTS[summary.billingState]}>
            {resolveStateLabel(summary.billingState, t)}
          </Badge>
        </div>
      </div>

      {banner ? (
        <FeedbackBanner tone={banner.tone} title={banner.title} description={banner.description} />
      ) : null}

      {secondaryBillingMessages.length > 0 ? (
        <div className="space-y-3">
          {secondaryBillingMessages.map((message, index) => (
            <FeedbackBanner
              key={`${message.code}-${index}`}
              tone={
                message.type === 'error'
                  ? 'destructive'
                  : message.type === 'warning'
                    ? 'warning'
                    : 'info'
              }
              title={billingT('feedback.info_title')}
              description={resolveBillingMessage(message.code, t, renewalDisplay)}
            />
          ))}
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>{billingT('current_plan_title')}</CardTitle>
            <CardDescription>
              {billingT('current_plan_description', { artist: artist?.displayName ?? '—' })}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant={PLAN_BADGE_VARIANTS[summary.billingPlan]}>
              {resolvePlanLabel(summary.billingPlan)}
            </Badge>
            <Badge variant={STATE_BADGE_VARIANTS[summary.billingState]}>
              {resolveStateLabel(summary.billingState, t)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {billingT('fields.billing_plan')}
            </p>
            <p className="mt-1 text-sm font-medium">{resolvePlanLabel(summary.billingPlan)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {billingT('fields.effective_access')}
            </p>
            <p className="mt-1 text-sm font-medium">{resolvePlanLabel(summary.effectivePlan)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {billingT('fields.status')}
            </p>
            <p className="mt-1 text-sm font-medium">
              {t(`dashboard.billing.status_descriptions.${summary.billingState}`)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {billingT('fields.renewal')}
            </p>
            <p className="mt-1 text-sm font-medium">{renewalDisplay}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {billingT('fields.cancellation')}
            </p>
            <p className="mt-1 text-sm font-medium">{cancellationLabel}</p>
          </div>
          {summary.billingPlan !== summary.effectivePlan ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950 sm:col-span-2 xl:col-span-5">
              {billingT('messages.access_differs', {
                billingPlan: resolvePlanLabel(summary.billingPlan),
                effectivePlan: resolvePlanLabel(summary.effectivePlan),
                status: t(`dashboard.billing.states.${summary.billingState}`),
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{billingT('sections.available_plans_title')}</h2>
          <p className="text-sm text-muted-foreground">
            {billingT('sections.available_plans_description')}
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {summary.availablePlans.map((plan) => {
            const canUpgrade = canUpgradeToPlan(summary, plan.planCode);
            const isEnterprise = plan.planCode === 'enterprise';
            const showManageBilling = plan.isCurrent && summary.upgradeOptions.canManageBilling;
            const showUpgrade = canUpgrade && !isEnterprise;
            const currentCard = plan.planCode === summary.billingPlan;

            return (
              <Card
                key={plan.planCode}
                className={currentCard ? 'border-primary shadow-sm' : undefined}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>{plan.displayName}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {plan.recommended ? (
                        <Badge variant="secondary">{billingT('badges.recommended')}</Badge>
                      ) : null}
                      <Badge variant={PLAN_BADGE_VARIANTS[plan.planCode]}>
                        {currentCard ? billingT('badges.current') : resolvePlanLabel(plan.planCode)}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    {currentCard
                      ? billingT('plan_card.current_description')
                      : billingT('plan_card.available_description')}
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
                    {plan.features.slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <span className="text-foreground">•</span>
                        <span>{settingsT(`features.${feature}.title`)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  {showUpgrade ? (
                    <form action={startCheckoutAction}>
                      <input type="hidden" name="artistId" value={artistId} />
                      <input type="hidden" name="plan" value={plan.planCode} />
                      <input type="hidden" name="locale" value={locale} />
                      <Button type="submit">
                        {billingT('actions.upgrade_to', {
                          plan: resolvePlanLabel(plan.planCode),
                        })}
                      </Button>
                    </form>
                  ) : null}

                  {showManageBilling ? (
                    <form action={startPortalAction}>
                      <input type="hidden" name="artistId" value={artistId} />
                      <input type="hidden" name="locale" value={locale} />
                      <Button type="submit" variant="outline">
                        {billingT('actions.manage_billing')}
                      </Button>
                    </form>
                  ) : null}

                  {isEnterprise ? (
                    <Button asChild variant="outline">
                      <a href="mailto:hello@stagelink.io">{billingT('actions.contact_sales')}</a>
                    </Button>
                  ) : null}

                  {!showUpgrade && !showManageBilling && !isEnterprise ? (
                    <Button type="button" variant="outline" disabled>
                      {currentCard
                        ? billingT('actions.current_plan')
                        : billingT('actions.included_in_higher_tier')}
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">{billingT('sections.features_title')}</h2>
          <p className="text-sm text-muted-foreground">
            {billingT('sections.features_description')}
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {summary.featureHighlights.map((item) => {
            const feature = resolveFeatureKey(item.feature);

            return (
              <Card key={feature}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base">
                      {settingsT(`features.${feature}.title`)}
                    </CardTitle>
                    <Badge variant={item.included ? 'secondary' : 'outline'}>
                      {item.included
                        ? billingT('badges.included')
                        : resolvePlanLabel(item.requiredPlan)}
                    </Badge>
                  </div>
                  <CardDescription>{settingsT(`features.${feature}.description`)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {item.included
                      ? billingT('feature_state.included')
                      : billingT('feature_state.locked', {
                          plan: resolvePlanLabel(item.requiredPlan),
                        })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {settingsT(`features.${feature}.note`)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{billingT('sections.actions_title')}</CardTitle>
          <CardDescription>{billingT('sections.actions_description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {summary.upgradeOptions.recommendedPlan ? (
            <form action={startCheckoutAction}>
              <input type="hidden" name="artistId" value={artistId} />
              <input type="hidden" name="plan" value={summary.upgradeOptions.recommendedPlan} />
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit">
                {billingT('actions.upgrade_to', {
                  plan: resolvePlanLabel(summary.upgradeOptions.recommendedPlan),
                })}
              </Button>
            </form>
          ) : null}

          <form action={startPortalAction}>
            <input type="hidden" name="artistId" value={artistId} />
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="outline" disabled={!summary.portalAvailable}>
              {billingT('actions.manage_billing')}
            </Button>
          </form>

          <form action={refreshBillingStatusAction}>
            <input type="hidden" name="artistId" value={artistId} />
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="ghost">
              {billingT('actions.refresh')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
