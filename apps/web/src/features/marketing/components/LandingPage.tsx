'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Feature {
  title: string;
  description: string;
}

interface Plan {
  name: string;
  price: string;
  description: string;
  items: string[];
  cta: string;
  featured?: boolean;
}

export function LandingPage() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale ?? 'en';

  const features: Feature[] = [
    {
      title: 'Built for artists',
      description:
        'Musicians, DJs, painters, actors, photographers and creators can build a professional page in minutes.',
    },
    {
      title: 'All your platforms in one place',
      description:
        'Connect Spotify, SoundCloud, YouTube, TikTok, Instagram and more with a simple setup.',
    },
    {
      title: 'Sell merch easily',
      description:
        'Connect Shopify to showcase products, drops and limited editions directly from your page.',
    },
    {
      title: 'Grow your audience',
      description:
        'Capture emails, promote events, launch releases and understand fan behavior with analytics.',
    },
  ];

  const blocks: string[] = [
    'Music embeds',
    'Video embeds',
    'Event dates',
    'Portfolio gallery',
    'Mailing list',
    'Shopify store',
    'Electronic press kit',
    'Smart links',
  ];

  const plans: Plan[] = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect to get started',
      items: ['1 artist page', 'Core links and embeds', 'Basic analytics', 'Google Ads enabled'],
      cta: 'Start free',
    },
    {
      name: 'Pro',
      price: '$5/mo',
      description: 'For growing artists',
      items: ['No ads', 'Advanced analytics', 'Custom domain', 'Shopify integration'],
      cta: 'Go Pro',
      featured: true,
    },
    {
      name: 'Pro+',
      price: '$9/mo',
      description: 'For serious creator brands',
      items: ['EPK builder', 'Fan email capture', 'Multi-language pages', 'Priority features'],
      cta: 'Get Pro+',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-white">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pb-28 md:pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(155,48,208,0.25),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(232,121,249,0.12),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Your Digital Stage
            </div>
            <h1 className="max-w-2xl text-5xl font-semibold tracking-tight md:text-7xl">
              One page for every song, show, drop and link.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">
              StageLink helps artists create a professional landing page in minutes. Connect music,
              videos, merch, events and fan signups in one beautiful place.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/api/auth/signin"
                className="rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Create your page
              </Link>
              <button className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white">
                See examples
              </button>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-white/30">
              <span>Spotify</span>
              <span>SoundCloud</span>
              <span>YouTube</span>
              <span>Shopify</span>
              <span>TikTok</span>
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
                  {['Listen on Spotify', 'Watch on YouTube', 'Buy merch', 'Join my fan list'].map(
                    (item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
                      >
                        {item}
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Features</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              Everything artists need in one page.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
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

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/50">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              Launch your page in under 5 minutes.
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {[
                {
                  step: '01',
                  title: 'Create your profile',
                  text: 'Choose your artist type, upload your image, add your bio and claim your username.',
                },
                {
                  step: '02',
                  title: 'Connect your platforms',
                  text: 'Paste your Spotify, SoundCloud, YouTube, TikTok, Instagram and Shopify links.',
                },
                {
                  step: '03',
                  title: 'Publish and share',
                  text: 'Go live instantly and use your StageLink page everywhere fans discover you.',
                },
              ].map((item) => (
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
              Content blocks
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">
              Mix and match your stage.
            </h3>
            <div className="mt-6 flex flex-wrap gap-3">
              {blocks.map((block) => (
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

      {/* ── Why it wins ──────────────────────────────────────────────── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/5 p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/50">
                Why it wins
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                Generic bio tools were not built for artists.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/60">
                StageLink focuses on the workflows that matter most to creative professionals:
                releases, shows, visual portfolio, merch, fan relationships and press materials.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                'Smart links route fans to their preferred platform.',
                'Artist-friendly templates feel premium from day one.',
                'EPK support helps creators pitch themselves professionally.',
                'Shopify unlocks direct monetization without complexity.',
              ].map((point) => (
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

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/50">Pricing</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              Affordable plans for every stage of growth.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => (
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
                      Most popular
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

      {/* ── CTA final ────────────────────────────────────────────────── */}
      <section className="px-6 pb-24 pt-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-primary/20 bg-primary/5 p-10 text-center md:p-14">
          <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
            Stop using generic link pages.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/60">
            Build a beautiful home for your music, art, events and products. Launch free and grow
            into the platform designed for creators.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/api/auth/signin"
              className="rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Start free
            </Link>
            <button className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white">
              Book a demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
