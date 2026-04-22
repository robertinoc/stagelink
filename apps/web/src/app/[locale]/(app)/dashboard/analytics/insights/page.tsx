import { redirect } from 'next/navigation';
import type { StageLinkInsightsDateRange } from '@stagelink/types';

export default async function DashboardInsightsRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ range?: StageLinkInsightsDateRange }>;
}) {
  const { locale } = await params;
  const { range } = await searchParams;
  const query = range ? `?insightsRange=${encodeURIComponent(range)}` : '';

  redirect(`/${locale}/dashboard/analytics${query}#stage-link-insights`);
}
