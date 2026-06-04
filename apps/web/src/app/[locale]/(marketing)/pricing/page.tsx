import type { Metadata } from 'next';
import Link from 'next/link';
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
import { Check } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { buildLocalizedAlternates } from '@/lib/seo-localization';
import { fetchPublicPlanPrices } from '@/lib/pricing-catalog';
import type { SupportedLocale } from '@stagelink/types';

interface PricingPageProps {
  params: Promise<{ locale: SupportedLocale }>;
}

export async function generateMetadata({ params }: PricingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'marketing.pricing' });
  return {
    title: t('title'),
    description: t('subtitle'),
    alternates: {
      canonical: `/${locale}/pricing`,
      languages: buildLocalizedAlternates('/pricing'),
    },
  };
}

const plans = [
  {
    key: 'free' as const,
    features: [
      'artist_page_one',
      'social_links_five',
      'link_blocks_five',
      'basic_analytics',
      'basic_epk',
      'stagelink_subdomain',
    ],
    popular: false,
  },
  {
    key: 'pro' as const,
    features: [
      'artist_page_one',
      'social_links_eight',
      'link_blocks_ten',
      'advanced_analytics',
      'advanced_epk',
      'epk_templates',
      'stagelink_subdomain',
    ],
    popular: true,
  },
  {
    key: 'pro_plus' as const,
    features: [
      'artist_page_one',
      'social_links_thirteen',
      'unlimited_blocks',
      'advanced_analytics',
      'spotify_analytics',
      'youtube_analytics',
      'soundcloud_analytics',
      'multi_language_pages',
      'shopify_merch',
      'smart_merch',
      'epk_multiple_templates',
      'epk_custom_templates',
      'stagelink_subdomain',
      'priority_support',
    ],
    popular: false,
  },
];

export default async function PricingPage({ params }: PricingPageProps) {
  const { locale } = await params;
  const [t, catalogPrices] = await Promise.all([
    getTranslations({ locale, namespace: 'marketing.pricing' }),
    // Live prices from the billing catalog (source of truth); falls back to the
    // static i18n price copy per-plan when unavailable.
    fetchPublicPlanPrices(),
  ]);

  return (
    <PageContainer>
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.key} className={plan.popular ? 'border-foreground shadow-lg' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t(`${plan.key}.name`)}</CardTitle>
                  {plan.popular && <Badge variant="default">{t('popular_badge')}</Badge>}
                </div>
                <div className="text-3xl font-bold">
                  {catalogPrices[plan.key] ?? t(`${plan.key}.price`)}
                </div>
                <CardDescription>{t(`${plan.key}.description`)}</CardDescription>
                <p className="pt-2 text-sm leading-6 text-muted-foreground">
                  {t(`${plan.key}.best_for`)}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {t(`features.${feature}`)}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild variant={plan.popular ? 'default' : 'outline'} className="w-full">
                  <Link href={`/${locale}/signup`}>{t(`${plan.key}.cta`)}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('positioning_title')}</CardTitle>
              <CardDescription>{t('positioning_body')}</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('scope_title')}</CardTitle>
              <CardDescription>{t('scope_note')}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <p className="mx-auto mt-6 max-w-4xl text-center text-sm leading-6 text-muted-foreground">
          {t('note')}
        </p>
      </div>
    </PageContainer>
  );
}
