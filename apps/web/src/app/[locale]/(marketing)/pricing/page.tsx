import type { Metadata } from 'next';
import { useTranslations } from 'next-intl';
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

interface PricingPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PricingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'marketing.pricing' });
  return {
    title: t('title'),
    alternates: {
      canonical: `/${locale}/pricing`,
      languages: {
        en: '/en/pricing',
        es: '/es/pricing',
      },
    },
  };
}

const plans = [
  {
    key: 'free' as const,
    features: ['1 artist page', '5 link blocks', 'Basic analytics', 'StageLink subdomain'],
    popular: false,
  },
  {
    key: 'pro' as const,
    features: [
      '1 artist page',
      'Unlimited blocks',
      'Advanced analytics',
      'Custom domain',
      'Email capture',
    ],
    popular: true,
  },
  {
    key: 'pro_plus' as const,
    features: [
      '3 artist pages',
      'Unlimited blocks',
      'Advanced analytics',
      'Custom domain',
      'Email capture',
      'Priority support',
    ],
    popular: false,
  },
];

export default function PricingPage() {
  const t = useTranslations('marketing.pricing');

  return (
    <PageContainer>
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-4xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.key} className={plan.popular ? 'border-foreground shadow-lg' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t(`${plan.key}.name`)}</CardTitle>
                  {plan.popular && <Badge variant="default">Popular</Badge>}
                </div>
                <div className="text-3xl font-bold">{t(`${plan.key}.price`)}</div>
                <CardDescription>{t(`${plan.key}.description`)}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant={plan.popular ? 'default' : 'outline'} className="w-full">
                  {t(`${plan.key}.cta`)}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
