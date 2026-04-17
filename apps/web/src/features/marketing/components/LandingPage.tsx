'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { getLandingT } from '@/lib/landing-translations';

export function LandingPage() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale ?? 'en';
  const t = getLandingT(locale);

  const [contactState, setContactState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [form, setForm] = useState({
    name: '',
    email: '',
    artistType: '',
    message: '',
  });

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setContactState('submitting');
    // TODO: wire up to a real contact API endpoint (e.g. POST /api/contact)
    await new Promise((r) => setTimeout(r, 1200));
    setContactState('success');
  }

  return (
    <div className="min-h-screen bg-background text-white">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section id="product" className="relative overflow-hidden px-6 pb-20 pt-16 md:pb-28 md:pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(155,48,208,0.25),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(232,121,249,0.12),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {t.badge}
            </div>
            <h1 className="max-w-2xl text-5xl font-semibold tracking-tight md:text-7xl">
              {t.hero.headline}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">{t.hero.subheadline}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/api/auth/signin"
                className="rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t.hero.ctaPrimary}
              </Link>
              <button className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white">
                {t.hero.ctaSecondary}
              </button>
            </div>
          </div>

          {/* Mock artist page preview */}
          <div className="relative">
            <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-primary/20 backdrop-blur">
              <div className="rounded-[1.5rem] border border-white/10 bg-sidebar p-5">
                <div className="h-44 rounded-[1.25rem] bg-brand-gradient opacity-60" />
                <div className="mx-auto -mt-12 h-24 w-24 rounded-full border-4 border-sidebar bg-white/10" />
                <div className="mt-4 text-center">
                  <h3 className="text-2xl font-semibold">Robertino</h3>
                  <p className="mt-1 text-sm text-white/50">DJ · Producer · Creator</p>
                </div>
                <div className="mt-6 grid gap-3">
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
      </section>

      {/* ── Social proof strip ────────────────────────────────────────────── */}
      <div className="border-y border-white/5 bg-white/[0.02] px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-3 md:justify-between">
          <p className="text-xs font-medium uppercase tracking-widest text-white/30">
            {t.strip.label}
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {t.strip.platforms.map((platform) => (
              <span key={platform} className="text-sm font-medium text-white/40">
                {platform}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Problem / Solution ────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/5 p-8 md:p-14">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            {t.problem.eyebrow}
          </p>
          <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-5xl">
            {t.problem.headline}
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">{t.problem.body}</p>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              {t.features.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              {t.features.headline}
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {t.features.items.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/50">
              {t.howItWorks.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              {t.howItWorks.headline}
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {t.howItWorks.steps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-3xl border border-white/10 bg-sidebar/80 p-5"
                >
                  <div className="text-sm font-semibold text-primary">{item.step}</div>
                  <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/60">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/50">
              {t.howItWorks.blocksLabel}
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">
              {t.howItWorks.blocksHeadline}
            </h3>
            <div className="mt-6 flex flex-wrap gap-3">
              {t.howItWorks.blocks.map((block) => (
                <span
                  key={block}
                  className="rounded-full border border-white/10 bg-sidebar/70 px-4 py-2 text-sm text-white/70"
                >
                  {block}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Who it's for ──────────────────────────────────────────────────── */}
      <section id="for-artists" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
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
                className="rounded-3xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <h3 className="text-xl font-semibold">{segment.label}</h3>
                <p className="mt-2 text-sm text-white/50">{segment.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Differentiation ───────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/5 p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/50">
                {t.differentiation.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                {t.differentiation.headline}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/60">
                {t.differentiation.body}
              </p>
            </div>
            <div className="grid gap-4">
              {t.differentiation.points.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/10 bg-sidebar/70 px-5 py-4 text-sm text-white/80"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/50">
              {t.pricing.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              {t.pricing.headline}
            </h2>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {t.pricing.plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[2rem] border p-8 ${
                  plan.featured
                    ? 'border-primary/40 bg-primary/10 shadow-2xl shadow-primary/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold">{plan.name}</h3>
                    <p className="mt-2 text-sm text-white/60">{plan.description}</p>
                  </div>
                  {plan.featured && (
                    <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
                      {t.pricing.popular}
                    </span>
                  )}
                </div>
                <div className="mt-8 text-4xl font-semibold">{plan.price}</div>
                <div className="mt-8 space-y-3 text-sm text-white/80">
                  {plan.items.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-sidebar/60 px-4 py-3"
                    >
                      {item}
                    </div>
                  ))}
                </div>
                <Link
                  href="/api/auth/signin"
                  className={`mt-8 block w-full rounded-full px-5 py-3 text-center text-sm font-semibold transition-opacity hover:opacity-90 ${
                    plan.featured
                      ? 'bg-brand-gradient text-white'
                      : 'border border-white/20 text-white hover:border-white/40'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="px-6 pb-8 pt-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-primary/20 bg-primary/5 p-10 text-center md:p-14">
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">{t.cta.headline}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/60">{t.cta.body}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/api/auth/signin"
              className="rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t.cta.primary}
            </Link>
            <button className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white">
              {t.cta.secondary}
            </button>
          </div>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────────────── */}
      <section id="contact" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl">
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
                  <input
                    type="text"
                    name="artistType"
                    value={form.artistType}
                    onChange={handleFormChange}
                    placeholder={t.contact.artistTypePlaceholder}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                  />
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
                    {contactState === 'submitting' ? '...' : t.contact.submit}
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
