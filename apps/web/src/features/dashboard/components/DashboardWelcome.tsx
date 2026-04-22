import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import {
  ArrowUpRight,
  BarChart3,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Lock,
  Settings,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Artist } from '@/lib/api/artists';
import type { BillingSummaryResponse } from '@/lib/api/billing';
import { getMinimumPlanForFeature } from '@stagelink/types';

interface DashboardWelcomeProps {
  artist: Artist | null;
  billingSummary: BillingSummaryResponse | null;
}

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

interface ActionCardConfig {
  key: string;
  href: string;
  title: string;
  description: string;
  cta: string;
  icon: React.ElementType;
  tone: string;
  target?: '_blank';
  feature?: 'epk_builder';
  note?: string | null;
}

export async function DashboardWelcome({ artist, billingSummary }: DashboardWelcomeProps) {
  const t = await getTranslations('dashboard.home');
  const locale = await getLocale();
  const effectivePlan = billingSummary?.effectivePlan ?? 'free';
  const entitlements = billingSummary?.entitlements ?? {
    remove_stagelink_branding: false,
    custom_domain: false,
    shopify_integration: false,
    smart_merch: false,
    stage_link_insights: false,
    epk_builder: false,
    analytics_pro: false,
    multi_language_pages: false,
    advanced_fan_insights: false,
  };

  const publicProfileHref = artist?.username
    ? `/p/${artist.username}`
    : `/${locale}/dashboard/profile`;

  const cards: ActionCardConfig[] = [
    {
      key: 'public_profile',
      href: publicProfileHref,
      title: t('cards.public_profile.title'),
      description: t('cards.public_profile.description'),
      cta: t('cards.public_profile.cta'),
      icon: ExternalLink,
      tone: 'from-violet-500/20 via-fuchsia-500/10 to-transparent',
      target: '_blank',
    },
    {
      key: 'profile',
      href: `/${locale}/dashboard/profile`,
      title: t('cards.profile.title'),
      description: t('cards.profile.description'),
      cta: t('cards.profile.cta'),
      icon: UserRound,
      tone: 'from-amber-500/20 via-orange-500/10 to-transparent',
    },
    {
      key: 'epk',
      href: entitlements.epk_builder ? `/${locale}/dashboard/epk` : `/${locale}/dashboard/billing`,
      title: t('cards.epk.title'),
      description: t('cards.epk.description'),
      cta: entitlements.epk_builder ? t('cards.epk.cta') : t('cards.upgrade_cta'),
      icon: FileText,
      tone: 'from-sky-500/20 via-cyan-500/10 to-transparent',
      feature: 'epk_builder',
    },
    {
      key: 'analytics',
      href: `/${locale}/dashboard/analytics`,
      title: t('cards.analytics.title'),
      description: t('cards.analytics.description'),
      cta: t('cards.analytics.cta'),
      icon: BarChart3,
      tone: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      note: entitlements.stage_link_insights
        ? t('cards.analytics.pro_plus_on')
        : t('cards.analytics.pro_plus_off'),
    },
    {
      key: 'settings',
      href: `/${locale}/dashboard/settings`,
      title: t('cards.settings.title'),
      description: t('cards.settings.description'),
      cta: t('cards.settings.cta'),
      icon: Settings,
      tone: 'from-white/10 via-white/5 to-transparent',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{resolvePlanLabel(effectivePlan)}</Badge>
              <Badge variant="secondary">{t('intro.badge')}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-white">{t('intro.title')}</h1>
            <p className="max-w-3xl text-sm text-white/60">{t('intro.description')}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-white/60">
              <LayoutDashboard className="h-4 w-4" />
              <span>{t('intro.workspace_label')}</span>
            </div>
            <p className="mt-1 font-medium text-white">
              {artist?.displayName ?? artist?.username ?? t('intro.workspace_fallback')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {cards.map((card) => {
          const requiredPlan = card.feature
            ? resolvePlanLabel(getMinimumPlanForFeature(card.feature))
            : null;
          const locked = card.feature ? !entitlements[card.feature] : false;

          return (
            <Card key={card.key} className="relative overflow-hidden border-white/10 bg-[#12091f]">
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.tone}`}
              />
              <CardHeader className="relative space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl border border-white/10 bg-white/10 p-2 text-white">
                        <card.icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-base text-white">{card.title}</CardTitle>
                    </div>
                    <CardDescription className="max-w-xl text-white/60">
                      {card.description}
                    </CardDescription>
                  </div>
                  {locked ? (
                    <Badge variant="outline" className="border-amber-500/30 text-amber-100">
                      <Lock className="mr-1 h-3 w-3" />
                      {t('locked_badge', { plan: requiredPlan! })}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{t('ready_badge')}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="relative space-y-4">
                {card.note ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                    <div className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-4 w-4 text-white/50" />
                      <span>{card.note}</span>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                    {locked ? t('upgrade_required') : t('available_now')}
                  </p>
                  <Button asChild variant={locked ? 'outline' : 'default'}>
                    <Link href={card.href} target={card.target}>
                      {card.cta}
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
