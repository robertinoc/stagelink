import Link from 'next/link';
import { getTranslations, getLocale } from 'next-intl/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Link2, Users } from 'lucide-react';

/**
 * Server component — no client bundle weight.
 * Reads locale via getLocale() so callers don't need to thread it as a prop.
 */
export async function DashboardWelcome() {
  const t = await getTranslations('dashboard');
  const locale = await getLocale();

  const stats = [
    { label: t('stats.page_views'), value: '—', icon: Eye },
    { label: t('stats.link_clicks'), value: '—', icon: Link2 },
    { label: t('stats.subscribers'), value: '—', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state — prompts user to start building their page */}
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed gap-3 px-6 py-12 text-center">
        <h3 className="text-base font-semibold">{t('empty.title')}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{t('empty.description')}</p>
        <Button asChild className="mt-2">
          <Link href={`/${locale}/dashboard/page`}>{t('empty.cta')}</Link>
        </Button>
      </div>
    </div>
  );
}
