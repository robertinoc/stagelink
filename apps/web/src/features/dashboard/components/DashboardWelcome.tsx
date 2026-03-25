'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { Eye, Link2, Users } from 'lucide-react';

export function DashboardWelcome() {
  const t = useTranslations('dashboard');

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

      <EmptyState
        title={t('empty.title')}
        description={t('empty.description')}
        action={{ label: t('empty.cta'), onClick: () => {} }}
      />
    </div>
  );
}
