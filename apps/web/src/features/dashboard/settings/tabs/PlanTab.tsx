'use client';

import { useTranslations } from 'next-intl';
import { useFormStatus } from 'react-dom';
import type { ReactNode } from 'react';
import { Bento, BentoLabel } from '@/components/sl/Bento';
import { Btn } from '@/components/sl/Btn';
import { SubmitBtn } from '@/components/sl/SubmitBtn';
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

const PLAN_RANK: Record<'free' | 'pro' | 'pro_plus', number> = {
  free: 0,
  pro: 1,
  pro_plus: 2,
};

// Fallback prices only used if the billing API doesn't return a plan's
// priceDisplay. Real prices come from data.summary.availablePlans.
const FALLBACK_PRICE: Record<'free' | 'pro' | 'pro_plus', string> = {
  free: '$0',
  pro: '$9',
  pro_plus: '$19',
};

export function PlanTab({ data, locale }: PlanTabProps) {
  const t = useTranslations('dashboard.settings.plan');
  const tu = useTranslations('dashboard.settings.usage');
  const ti = useTranslations('dashboard.settings.invoices');
  const td = useTranslations('dashboard.settings.danger.plan');
  const ttiers = useTranslations('dashboard.settings.tiers');

  const summary = data.summary;
  const planLabel = resolvePlanLabel(summary.effectivePlan);
  const nextBilling = formatNextBilling(summary.currentPeriodEnd, locale);
  // The Stripe Customer Portal only exists once the artist has a Stripe
  // customer (i.e. has gone through checkout at least once). Gating the
  // portal buttons on this flag prevents the "no pudimos abrir el portal"
  // error for Free / never-subscribed artists — matching the old
  // PlansBillingSection behaviour.
  const portalAvailable = summary.portalAvailable;
  const recommendedPlan = summary.upgradeOptions.recommendedPlan;

  // Real prices come from Stripe via the billing summary — never hardcode,
  // so plan prices can't drift from what the user is actually charged.
  const priceByPlan: Record<string, string> = {};
  for (const p of summary.availablePlans) {
    if (p.priceDisplay) priceByPlan[p.planCode] = p.priceDisplay;
  }
  const priceFor = (id: 'free' | 'pro' | 'pro_plus') => priceByPlan[id] ?? FALLBACK_PRICE[id];

  // Checkout is only valid for an UPGRADE (a higher-ranked plan). Downgrades
  // and cancellations go through the Stripe portal — checking out a plan you
  // already have / a lower tier makes Stripe reject the session, which was
  // surfacing as ?error=checkout.
  const canUpgradeTo = (id: 'free' | 'pro' | 'pro_plus') =>
    summary.upgradeOptions.canUpgrade && PLAN_RANK[id] > PLAN_RANK[summary.billingPlan];

  const tiers: TierCardData[] = [
    {
      id: 'free',
      name: 'Free',
      price: priceFor('free'),
      sub: ttiers('free.sub'),
      features: ttiers.raw('free.features') as string[],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: priceFor('pro'),
      sub: ttiers('pro.sub'),
      features: ttiers.raw('pro.features') as string[],
    },
    {
      id: 'pro_plus',
      name: 'Pro+',
      price: priceFor('pro_plus'),
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
                {t('hero.price', { price: priceFor(summary.effectivePlan) })}
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
              {recommendedPlan ? (
                // There's a higher tier to move up to → checkout to it.
                <form action={startCheckoutAction}>
                  <input type="hidden" name="artistId" value={data.artistId} />
                  <input type="hidden" name="plan" value={recommendedPlan} />
                  <input type="hidden" name="locale" value={locale} />
                  <SubmitBtn variant="primary">
                    {t('hero.cta_upgrade_to', { plan: resolvePlanLabel(recommendedPlan) })}
                  </SubmitBtn>
                </form>
              ) : (
                // Already on the top tier (or upgrades disabled) → manage via
                // portal instead of a checkout that Stripe would reject.
                portalAvailable && (
                  <form action={startPortalAction}>
                    <input type="hidden" name="artistId" value={data.artistId} />
                    <input type="hidden" name="locale" value={locale} />
                    <SubmitBtn variant="primary">{t('hero.cta_manage')}</SubmitBtn>
                  </form>
                )
              )}
              {portalAvailable && (
                <>
                  <form action={startPortalAction}>
                    <input type="hidden" name="artistId" value={data.artistId} />
                    <input type="hidden" name="locale" value={locale} />
                    <SubmitBtn variant="ghost">{t('hero.cta_portal')}</SubmitBtn>
                  </form>
                  <form action={startPortalAction}>
                    <input type="hidden" name="artistId" value={data.artistId} />
                    <input type="hidden" name="locale" value={locale} />
                    <SubmitBtn variant="ghost">{t('hero.cta_invoices')}</SubmitBtn>
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
              ctaAction={tierCtaAction({
                tier,
                artistId: data.artistId,
                locale,
                isCurrent: tier.id === summary.effectivePlan,
                canUpgrade: canUpgradeTo(tier.id),
                isPopular: Boolean(tier.popular),
                upgradeLabel: t('tiers.cta_upgrade', { plan: tier.name }),
                managedLabel: t(`tiers.cta.${tier.id}`),
                currentLabel: t('tiers.current'),
              })}
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
              <SubmitBtn variant="outline">{ti('portal_cta')}</SubmitBtn>
            </form>
          ) : undefined
        }
      />

      {/* DANGER ZONE */}
      <PlanDangerZone
        title={td('title')}
        body={td('body')}
        downgradeCta={
          // Downgrades go through the Stripe portal (a checkout to a lower
          // tier is rejected). Only meaningful once a Stripe customer exists.
          portalAvailable ? (
            <form action={startPortalAction}>
              <input type="hidden" name="artistId" value={data.artistId} />
              <input type="hidden" name="locale" value={locale} />
              <SubmitBtn variant="ghost">{td('downgrade')}</SubmitBtn>
            </form>
          ) : null
        }
        cancelCta={
          portalAvailable ? (
            <form action={startPortalAction}>
              <input type="hidden" name="artistId" value={data.artistId} />
              <input type="hidden" name="locale" value={locale} />
              <CancelPortalButton className={RED_BUTTON_CLASS}>{td('cancel')}</CancelPortalButton>
            </form>
          ) : null
        }
      />
    </div>
  );
}

/**
 * Submit button for the danger-zone cancel form. Uses RED_BUTTON_CLASS
 * styling instead of the Btn primitive, so we need a tiny standalone
 * wrapper rather than the generic SubmitBtn.
 */
function CancelPortalButton({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}): React.ReactNode {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending || undefined}>
      {children}
    </button>
  );
}

function tierCtaAction({
  tier,
  artistId,
  locale,
  isCurrent,
  canUpgrade,
  isPopular,
  upgradeLabel,
  managedLabel,
  currentLabel,
}: {
  tier: TierCardData;
  artistId: string;
  locale: string;
  isCurrent: boolean;
  canUpgrade: boolean;
  isPopular: boolean;
  upgradeLabel: string;
  managedLabel: string;
  currentLabel: string;
}): React.ReactNode {
  // Current plan: let TierCard render its built-in disabled "Plan actual".
  if (isCurrent) return undefined;

  // Upgrade path: the only case where Stripe checkout is valid. Sends the
  // real plan code (not a hardcoded one), so a Pro+ user never tries to
  // check out Pro+ again (the cause of ?error=checkout).
  if (canUpgrade) {
    return (
      <form action={startCheckoutAction}>
        <input type="hidden" name="artistId" value={artistId} />
        <input type="hidden" name="plan" value={tier.id} />
        <input type="hidden" name="locale" value={locale} />
        <SubmitBtn variant={isPopular ? 'primary' : 'ghost'} full>
          {upgradeLabel}
        </SubmitBtn>
      </form>
    );
  }

  // Lower tier than the current plan (or upgrades disabled): no checkout —
  // downgrades happen through the portal. Render a disabled, informative CTA.
  return (
    <Btn variant="ghost" full disabled style={{ cursor: 'default' }} aria-disabled>
      {managedLabel || currentLabel}
    </Btn>
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
