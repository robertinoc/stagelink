import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
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
import { getAuthMe } from '@/lib/api/me';
import { getArtist } from '@/lib/api/artists';
import {
  getBillingProducts,
  getBillingSubscription,
  type BillingPlanCatalogItem,
} from '@/lib/api/billing';
import { getSession } from '@/lib/auth';
import { startCheckoutAction, startPortalAction } from './actions';

interface DashboardBillingPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ checkout?: string; error?: string }>;
}

const PLAN_BADGE_VARIANTS = {
  free: 'secondary',
  pro: 'default',
  pro_plus: 'default',
  enterprise: 'outline',
} as const;

function formatMoney(amount: number | null, currency: string | null) {
  if (amount === null || currency === null) return 'Custom';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100);
}

function resolvePlanLabel(plan: BillingPlanCatalogItem['plan']) {
  switch (plan) {
    case 'free':
      return 'Free';
    case 'pro':
      return 'Pro';
    case 'pro_plus':
      return 'Pro+';
    default:
      return 'Enterprise';
  }
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
  const t = await getTranslations('dashboard.billing');
  const session = await getSession();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const me = await getAuthMe(session.accessToken);
  const artistId = me?.artistIds[0];

  if (!artistId) {
    redirect(`/${locale}/onboarding`);
  }

  const [artist, subscription, products] = await Promise.all([
    getArtist(artistId, session.accessToken),
    getBillingSubscription(artistId, session.accessToken),
    getBillingProducts(session.accessToken),
  ]);

  const planCards = products.plans;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>

      {query.checkout === 'success' ? (
        <Card className="border-emerald-200 bg-emerald-50/70">
          <CardContent className="p-4 text-sm text-emerald-900">
            {t('messages.checkout_success')}
          </CardContent>
        </Card>
      ) : null}

      {query.checkout === 'canceled' ? (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardContent className="p-4 text-sm text-amber-900">
            {t('messages.checkout_canceled')}
          </CardContent>
        </Card>
      ) : null}

      {query.error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {query.error === 'portal' ? t('messages.portal_error') : t('messages.checkout_error')}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <CardTitle>{t('current_plan_title')}</CardTitle>
            <CardDescription>
              {t('current_plan_description', { artist: artist?.displayName ?? '—' })}
            </CardDescription>
          </div>
          <Badge variant={PLAN_BADGE_VARIANTS[subscription.plan]}>
            {resolvePlanLabel(subscription.plan)}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('fields.status')}
            </p>
            <p className="mt-1 text-sm font-medium">{subscription.status}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('fields.renewal')}
            </p>
            <p className="mt-1 text-sm font-medium">
              {subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString(locale)
                : t('fields.not_available')}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t('fields.cancellation')}
            </p>
            <p className="mt-1 text-sm font-medium">
              {subscription.cancelAtPeriodEnd ? t('fields.canceling') : t('fields.active')}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <form action={startPortalAction}>
            <input type="hidden" name="artistId" value={artistId} />
            <input type="hidden" name="locale" value={locale} />
            <Button type="submit" variant="outline" disabled={!subscription.portalAvailable}>
              {t('actions.manage_billing')}
            </Button>
          </form>
        </CardFooter>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {planCards.map((plan) => {
          const isCurrentPlan = plan.plan === subscription.plan;
          const isEnterprise = plan.plan === 'enterprise';
          const isPaidPlan = plan.plan === 'pro' || plan.plan === 'pro_plus';
          const disabled = isCurrentPlan || (!plan.available && !isEnterprise);

          return (
            <Card key={plan.plan} className={isCurrentPlan ? 'border-primary' : undefined}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{plan.productName}</CardTitle>
                  <Badge variant={PLAN_BADGE_VARIANTS[plan.plan]}>
                    {isCurrentPlan ? t('badges.current') : resolvePlanLabel(plan.plan)}
                  </Badge>
                </div>
                <CardDescription>
                  {plan.productDescription ?? t('product_fallback_description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-semibold">
                  {formatMoney(plan.amount, plan.currency)}
                  {plan.interval ? (
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      /{plan.interval}
                    </span>
                  ) : null}
                </p>
                {isPaidPlan && !plan.available ? (
                  <p className="text-sm text-muted-foreground">{t('unavailable')}</p>
                ) : null}
              </CardContent>
              <CardFooter>
                {isEnterprise ? (
                  <Button asChild variant="outline">
                    <a href="mailto:hello@stagelink.io">{t('actions.contact_sales')}</a>
                  </Button>
                ) : isPaidPlan ? (
                  <form action={startCheckoutAction}>
                    <input type="hidden" name="artistId" value={artistId} />
                    <input type="hidden" name="plan" value={plan.plan} />
                    <input type="hidden" name="locale" value={locale} />
                    <Button type="submit" disabled={disabled}>
                      {isCurrentPlan ? t('actions.current_plan') : t('actions.upgrade')}
                    </Button>
                  </form>
                ) : (
                  <Button type="button" variant="outline" disabled>
                    {t('actions.included')}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
