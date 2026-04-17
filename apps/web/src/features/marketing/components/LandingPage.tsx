'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { SupportedLocale } from '@/lib/landing-translations';
import { getLandingT } from '@/lib/landing-translations';

interface LandingPageProps {
  locale: string;
}

const featureNumbers = ['01', '02', '03', '04', '05', '06'] as const;
const pillarNumbers = ['A', 'B', 'C'] as const;

export function LandingPage({ locale }: LandingPageProps) {
  const resolvedLocale: SupportedLocale = locale === 'es' ? 'es' : 'en';
  const t = getLandingT(resolvedLocale);

  const [contactState, setContactState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [form, setForm] = useState({
    name: '',
    email: '',
    artistType: '',
    message: '',
  });

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setContactState('submitting');
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setContactState('success');
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <section id="product" className="relative overflow-hidden px-6 pb-16 pt-14 md:pb-24 md:pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(155,48,208,0.22),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(232,121,249,0.14),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-primary">
              {t.badge}
            </div>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl xl:text-7xl">
              {t.hero.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">{t.hero.subheadline}</p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/45">{t.hero.supportingText}</p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/api/auth/signin"
                className="rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t.hero.ctaPrimary}
              </Link>
              <a
                href="#preview"
                className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
              >
                {t.hero.ctaSecondary}
              </a>
            </div>
          </div>

          <div id="preview" className="relative">
            <div className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_30px_80px_rgba(155,48,208,0.18)] backdrop-blur">
              <div className="rounded-[1.6rem] border border-white/10 bg-sidebar p-5">
                <div className="h-44 rounded-[1.25rem] bg-brand-gradient opacity-65" />
                <div className="mx-auto -mt-12 h-24 w-24 rounded-full border-4 border-sidebar bg-white/10" />
                <div className="mt-4 text-center">
                  <div className="text-xs font-medium uppercase tracking-[0.22em] text-primary/80">
                    {t.hero.previewLabel}
                  </div>
                  <h2 className="mt-3 text-2xl font-semibold">Robertino</h2>
                  <p className="mt-1 text-sm text-white/50">DJ · Producer · Creator</p>
                </div>

                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                  <h3 className="text-lg font-semibold">{t.hero.previewTitle}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/60">
                    {t.hero.previewDescription}
                  </p>

                  <div className="mt-5 grid gap-3">
                    {t.hero.mockLinks.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-white/[0.02] px-6 py-5">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/30">
              {t.strip.label}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {t.strip.items.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/30">
              {t.strip.platformsLabel}
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              {t.strip.platforms.map((platform) => (
                <span key={platform} className="text-sm font-medium text-white/45">
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/5 p-8 md:p-14">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {t.problem.eyebrow}
          </p>
          <h2 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight md:text-5xl">
            {t.problem.headline}
          </h2>
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/60">{t.problem.intro}</p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[1.8rem] border border-white/10 bg-sidebar/70 p-6">
              <h3 className="text-lg font-semibold">{t.problem.painLabel}</h3>
              <div className="mt-5 space-y-3">
                {t.problem.painPoints.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-white/70"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-primary/20 bg-primary/5 p-6">
              <h3 className="text-lg font-semibold">{t.problem.solutionLabel}</h3>
              <div className="mt-5 space-y-3">
                {t.problem.solutionPoints.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-primary/20 bg-white/5 px-4 py-3 text-sm leading-7 text-white/80"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              {t.features.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              {t.features.headline}
            </h2>
            <p className="mt-5 text-base leading-8 text-white/60">{t.features.intro}</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {t.features.items.map((feature, index) => (
              <div
                key={feature.title}
                className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/85">
                  {featureNumbers[index] ?? '00'}
                </div>
                <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-6 py-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/5 p-8 md:p-12">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/50">
              {t.howItWorks.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              {t.howItWorks.headline}
            </h2>
            <p className="mt-5 text-base leading-8 text-white/60">{t.howItWorks.intro}</p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {t.howItWorks.steps.map((item) => (
              <div
                key={item.step}
                className="rounded-[1.8rem] border border-white/10 bg-sidebar/80 p-6"
              >
                <div className="text-sm font-semibold text-primary">{item.step}</div>
                <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="for-artists" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              {t.forArtists.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              {t.forArtists.headline}
            </h2>
            <p className="mt-5 text-base leading-8 text-white/60">{t.forArtists.body}</p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.forArtists.segments.map((segment) => (
              <div
                key={segment.label}
                className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <h3 className="text-xl font-semibold">{segment.label}</h3>
                <p className="mt-3 text-sm leading-7 text-white/55">{segment.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/5 p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/50">
                {t.monetization.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                {t.monetization.headline}
              </h2>
              <p className="mt-5 text-base leading-8 text-white/60">{t.monetization.body}</p>

              <div className="mt-8 space-y-3">
                {t.monetization.points.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-white/10 bg-sidebar/60 px-4 py-3 text-sm text-white/80"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {t.monetization.pillars.map((pillar, index) => (
                <div
                  key={pillar.title}
                  className="rounded-[1.7rem] border border-white/10 bg-sidebar/75 p-6"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/85">
                    {pillarNumbers[index] ?? 'A'}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/60">{pillar.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-8 pt-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-primary/20 bg-primary/5 p-10 text-center md:p-14">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {t.cta.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
            {t.cta.headline}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/60">{t.cta.body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/api/auth/signin"
              className="rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t.cta.primary}
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white"
            >
              {t.cta.secondary}
            </a>
          </div>
        </div>
      </section>

      <section id="contact" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              {t.contact.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              {t.contact.headline}
            </h2>
            <p className="mt-4 text-base leading-8 text-white/60">{t.contact.body}</p>

            {contactState === 'success' ? (
              <div className="mt-10 rounded-[2rem] border border-primary/30 bg-primary/10 p-10 text-center">
                <div className="text-4xl">✓</div>
                <p className="mt-4 text-lg font-semibold text-white">{t.contact.success}</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="mt-10 grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      {t.contact.name}
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleFormChange}
                      placeholder={t.contact.namePlaceholder}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                      {t.contact.email}
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleFormChange}
                      placeholder={t.contact.emailPlaceholder}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    {t.contact.artistType}
                  </label>
                  <select
                    name="artistType"
                    required
                    value={form.artistType}
                    onChange={handleFormChange}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  >
                    <option value="" disabled className="bg-sidebar text-white/50">
                      {t.contact.artistTypePlaceholder}
                    </option>
                    {t.contact.artistTypeOptions.map((option) => (
                      <option key={option} value={option} className="bg-sidebar text-white">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    {t.contact.message}
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={handleFormChange}
                    placeholder={t.contact.messagePlaceholder}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={contactState === 'submitting'}
                    className="rounded-full bg-brand-gradient px-8 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {contactState === 'submitting' ? t.contact.submitting : t.contact.submit}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
