import type { Metadata } from 'next';
import Link from 'next/link';
import { Chrome, Share, Smartphone } from 'lucide-react';
import { getLandingT } from '@/lib/landing-translations';

interface InstallPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: InstallPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = getLandingT(locale);

  return {
    title: `${t.install.eyebrow} — StageLink`,
    description: t.install.description,
    alternates: {
      canonical: `/${locale}/install`,
      languages: {
        en: '/en/install',
        es: '/es/install',
      },
    },
  };
}

export default async function InstallPage({ params }: InstallPageProps) {
  const { locale } = await params;
  const t = getLandingT(locale);

  const guides = [
    {
      title: t.install.androidTitle,
      icon: Chrome,
      steps: t.install.androidSteps,
    },
    {
      title: t.install.iosTitle,
      icon: Share,
      steps: t.install.iosSteps,
    },
  ];

  return (
    <div className="landing-shell min-h-screen text-white">
      <section className="landing-section relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(155,48,208,0.18),transparent_30%),radial-gradient(circle_at_82%_14%,rgba(232,121,249,0.1),transparent_26%)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="landing-eyebrow text-primary">{t.install.eyebrow}</p>
            <h1 className="landing-h1 mt-4 max-w-3xl">{t.install.title}</h1>
            <p className="landing-body mt-6 max-w-2xl text-white/92">{t.install.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={`/${locale}`}
                className="landing-button-primary w-full rounded-full bg-brand-gradient px-6 text-center text-white transition-opacity hover:opacity-95 sm:w-auto"
              >
                {t.install.primaryCta}
              </Link>
              <Link
                href={`/${locale}/login`}
                className="landing-button-secondary w-full rounded-full px-6 text-center sm:w-auto"
              >
                {t.install.secondaryCta}
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {guides.map((guide) => {
              const Icon = guide.icon;

              return (
                <section
                  key={guide.title}
                  className="landing-surface landing-surface-glow rounded-[2rem] p-6 md:p-8"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h2 className="landing-h3">{guide.title}</h2>
                  </div>
                  <ol className="mt-6 grid gap-3">
                    {guide.steps.map((step, index) => (
                      <li
                        key={step}
                        className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-[1.0625rem] leading-7 text-white/90"
                      >
                        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>

          <section className="mt-6 rounded-[2rem] border border-white/10 bg-sidebar/70 p-6 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white/84">
                <Smartphone className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="landing-h3">{t.install.noteTitle}</h2>
                <p className="mt-3 text-[1.0625rem] leading-7 text-white/84">{t.install.note}</p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
