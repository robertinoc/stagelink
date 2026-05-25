'use client';

import { useTranslations } from 'next-intl';
import { Bento, BentoLabel } from '@/components/sl/Bento';
import { Btn } from '@/components/sl/Btn';
import { Glow } from '@/components/sl/SlPrimitives';
import { SubHead } from '@/components/sl/SubHead';
import {
  startCheckoutAction,
  startPortalAction,
} from '@/app/[locale]/(app)/dashboard/billing/actions';
import type {
  DashboardSettingsData,
  SettingsUsage,
} from '@/features/dashboard/settings/settings-data';
import { resolvePlanLabel } from '@/features/dashboard/settings/settings-data';
import { TierCard, type TierCardData } from './plan/TierCard';
import { UsageRow } from './plan/UsageRow';
import { InvoicesTable } from './plan/InvoicesTable';
import { PlanDangerZone, RED_BUTTON_CLASS } from './plan/PlanDangerZone';

interface PlanTabProps {
  data: DashboardSettingsData;
  locale: string;
}

const PRICE_BY_PLAN: Record<'free' | 'pro' | 'pro_plus', string> = {
  free: '$0',
  pro: '$5',
  pro_plus: '$9',
};

export function PlanTab({ data, locale }: PlanTabProps) {
  const t = useTranslations('dashboard.settings.plan');
  const tu = useTranslations('dashboard.settings.usage');
  const ti = useTranslations('dashboard.settings.invoices');
  const td = useTranslations('dashboard.settings.danger.plan');
  const ttiers = useTranslations('dashboard.settings.tiers');

  const planLabel = resolvePlanLabel(data.summary.effectivePlan);
  const nextBilling = formatNextBilling(data.summary.currentPeriodEnd, locale);
  // The Stripe Customer Portal only exists once the artist has a Stripe
  // customer (i.e. has gone through checkout at least once). Gating the
  // portal buttons on this flag prevents the "no pudimos abrir el portal"
  // error for Free / never-subscribed artists — matching the old
  // PlansBillingSection behaviour.
  const portalAvailable = data.summary.portalAvailable;

  const tiers: TierCardData[] = [
    {
      id: 'free',
      name: 'Free',
      price: PRICE_BY_PLAN.free,
      sub: ttiers('free.sub'),
      features: ttiers.raw('free.features') as string[],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: PRICE_BY_PLAN.pro,
      sub: ttiers('pro.sub'),
      features: ttiers.raw('pro.features') as string[],
    },
    {
      id: 'pro_plus',
      name: 'Pro+',
      price: PRICE_BY_PLAN.pro_plus,
      sub: ttiers('pro_plus.sub'),
      features: ttiers.raw('pro_plus.features') as string[],
      popular: true,
    },
  ];

  return (
    <div className="space-y-5">
      {/* HERO */}
      <Bento tone="accent" pad={28} className="@container">
        <Glow x="100%" y="0%" size={400} />
        <div className="relative z-[1] grid gap-7 lg:grid-cols-[1.4fr_1fr]">
          <div className="min-w-0">
            <BentoLabel tint="#E040FB">{t('hero.label')}</BentoLabel>
            <h2 className="m-0 mt-2.5 flex flex-wrap items-baseline gap-3.5 font-[family-name:var(--font-heading)] text-[clamp(36px,5cqw,52px)] font-bold leading-none tracking-[-0.025em]">
              <span className="text-sl-grad">{planLabel}</span>
              <span className="text-[17px] font-normal leading-[1.4] text-white/50">
                {t('hero.price', { price: PRICE_BY_PLAN[data.summary.effectivePlan] })}
              </span>
            </h2>
            <p className="mt-4 max-w-[640px] text-[14px] leading-[1.55] text-white/70">
              {nextBilling
                ? t.rich('hero.next_billing_known', {
                    date: nextBilling,
                    strong: (chunks) => <strong className="text-white">{chunks}</strong>,
                  })
                : t('hero.next_billing_unknown')}
            </p>
            <div className="mt-[18px] flex flex-wrap items-center gap-2.5">
              <form action={startCheckoutAction}>
                <input type="hidden" name="artistId" value={data.artistId} />
                <input type="hidden" name="plan" value="pro_plus" />
                <input type="hidden" name="locale" value={locale} />
                <Btn variant="primary" type="submit">
                  {t('hero.cta_change_plan')}
                </Btn>
              </form>
              {portalAvailable && (
                <>
                  <form action={startPortalAction}>
                    <input type="hidden" name="artistId" value={data.artistId} />
                    <input type="hidden" name="locale" value={locale} />
                    <Btn variant="ghost" type="submit">
                      {t('hero.cta_portal')}
                    </Btn>
                  </form>
                  <form action={startPortalAction}>
                    <input type="hidden" name="artistId" value={data.artistId} />
                    <input type="hidden" name="locale" value={locale} />
                    <Btn variant="ghost" type="submit">
                      {t('hero.cta_invoices')}
                    </Btn>
                  </form>
                </>
              )}
            </div>
          </div>

          <UsagePanel
            usage={data.usage}
            labels={{
              heading: tu('heading'),
              reset: tu('reset'),
              smart_links: tu('smart_links'),
              languages: tu('languages'),
              pages: tu('pages'),
              storage: tu('storage'),
              mb: tu('mb'),
              gb: tu('gb'),
            }}
          />
        </div>
      </Bento>

      {/* TIER COMPARISON */}
      <Bento pad={22}>
        <SubHead title={t('compare.title')} hint={t('compare.hint')} />
        <div className="grid grid-cols-1 gap-3.5 @[720px]:grid-cols-3">
          {tiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              isCurrent={tier.id === data.summary.effectivePlan}
              currentLabel={t('tiers.current')}
              popularLabel={t('tiers.popular')}
              ctaLabel={t(`tiers.cta.${tier.id}`)}
              ctaAction={
                tier.id === data.summary.effectivePlan
                  ? undefined
                  : tierCtaAction({
                      tier,
                      artistId: data.artistId,
                      locale,
                      isPopular: Boolean(tier.popular),
                      label: t(`tiers.cta.${tier.id}`),
                    })
              }
            />
          ))}
        </div>
      </Bento>

      {/* INVOICES */}
      <InvoicesTable
        invoices={data.invoices}
        title={ti('title')}
        hint={ti('hint')}
        emptyMessage={ti('empty')}
        paidLabel={ti('paid')}
        pendingLabel={ti('pending')}
        dateHeader={ti('headers.date')}
        statusHeader={ti('headers.status')}
        amountHeader={ti('headers.amount')}
        pdfHeader={ti('headers.pdf')}
        pdfAriaLabel={ti('pdf_aria')}
        portalAction={
          portalAvailable ? (
            <form action={startPortalAction}>
              <input type="hidden" name="artistId" value={data.artistId} />
              <input type="hidden" name="locale" value={locale} />
              <Btn variant="outline" type="submit">
                {ti('portal_cta')}
              </Btn>
            </form>
          ) : undefined
        }
      />

      {/* DANGER ZONE */}
      <PlanDangerZone
        title={td('title')}
        body={td('body')}
        downgradeCta={
          <form action={startCheckoutAction}>
            <input type="hidden" name="artistId" value={data.artistId} />
            <input type="hidden" name="plan" value="pro" />
            <input type="hidden" name="locale" value={locale} />
            <Btn variant="ghost" type="submit">
              {td('downgrade')}
            </Btn>
          </form>
        }
        cancelCta={
          portalAvailable ? (
            <form action={startPortalAction}>
              <input type="hidden" name="artistId" value={data.artistId} />
              <input type="hidden" name="locale" value={locale} />
              <button type="submit" className={RED_BUTTON_CLASS}>
                {td('cancel')}
              </button>
            </form>
          ) : null
        }
      />
    </div>
  );
}

function tierCtaAction({
  tier,
  artistId,
  locale,
  isPopular,
  label,
}: {
  tier: TierCardData;
  artistId: string;
  locale: string;
  isPopular: boolean;
  label: string;
}) {
  if (tier.id === 'free') {
    return (
      <form action={startPortalAction}>
        <input type="hidden" name="artistId" value={artistId} />
        <input type="hidden" name="locale" value={locale} />
        <Btn variant="ghost" full type="submit">
          {label}
        </Btn>
      </form>
    );
  }
  return (
    <form action={startCheckoutAction}>
      <input type="hidden" name="artistId" value={artistId} />
      <input type="hidden" name="plan" value={tier.id} />
      <input type="hidden" name="locale" value={locale} />
      <Btn variant={isPopular ? 'primary' : 'ghost'} full type="submit">
        {label}
      </Btn>
    </form>
  );
}

function UsagePanel({
  usage,
  labels,
}: {
  usage: SettingsUsage;
  labels: {
    heading: string;
    reset: string;
    smart_links: string;
    languages: string;
    pages: string;
    storage: string;
    mb: string;
    gb: string;
  };
}) {
  const storageMaxLabel =
    usage.storageMb.max !== null
      ? usage.storageMb.max >= 1024
        ? `${(usage.storageMb.max / 1024).toFixed(0)} ${labels.gb}`
        : `${usage.storageMb.max} ${labels.mb}`
      : undefined;

  return (
    <div className="flex flex-col gap-3.5 rounded-[14px] border border-white/10 bg-black/30 p-4 sm:p-[18px]">
      <div className="flex items-center justify-between">
        <BentoLabel>{labels.heading}</BentoLabel>
        <span className="text-[10px] tracking-[0.5px] text-white/30">{labels.reset}</span>
      </div>
      <UsageRow
        label={labels.smart_links}
        value={usage.smartLinkResolutions.value}
        max={usage.smartLinkResolutions.max}
      />
      <UsageRow
        label={labels.languages}
        value={usage.activeLanguages.value}
        max={usage.activeLanguages.max}
      />
      <UsageRow label={labels.pages} value={usage.artistPages.value} max={usage.artistPages.max} />
      <UsageRow
        label={labels.storage}
        value={usage.storageMb.value}
        max={usage.storageMb.max}
        unit={labels.mb}
        maxLabel={storageMaxLabel}
      />
    </div>
  );
}

function formatNextBilling(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}
