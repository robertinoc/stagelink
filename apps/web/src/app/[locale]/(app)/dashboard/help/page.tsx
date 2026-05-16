import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { HelpCircle } from 'lucide-react';
import { getAuthMe, getCurrentArtistId } from '@/lib/api/me';
import { getSession } from '@/lib/auth';
import { FaqItem } from '@/features/help/components/FaqItem';
import { SUPPORT_URL } from '@/lib/constants';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Help & FAQ',
  };
}

export default async function DashboardHelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const me = await getAuthMe(session.accessToken);
  const artistId = getCurrentArtistId(me);
  if (!artistId) redirect(`/${locale}/onboarding`);

  const t = await getTranslations('dashboard.help');

  const sectionKeys = ['getting_started', 'profile', 'plans', 'analytics'] as const;

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-white/50" />
          <h1 className="text-xl font-semibold text-white">{t('title')}</h1>
        </div>
        <p className="text-sm text-white/50">{t('subtitle')}</p>
      </div>

      <div className="space-y-6">
        {sectionKeys.map((sectionKey) => {
          const items = t.raw(`sections.${sectionKey}.items`) as Array<{
            question: string;
            answer: string;
          }>;

          return (
            <div
              key={sectionKey}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-2"
            >
              <h2 className="py-4 text-xs font-semibold uppercase tracking-widest text-white/40">
                {t(`sections.${sectionKey}.title`)}
              </h2>
              {items.map((item, i) => (
                <FaqItem key={i} question={item.question} answer={item.answer} />
              ))}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="text-base font-semibold text-white">{t('support_cta.title')}</h2>
        <p className="mt-2 text-sm text-white/50">{t('support_cta.description')}</p>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          aria-label={t('support_cta.button')}
        >
          {t('support_cta.button')}
        </a>
      </div>
    </div>
  );
}
