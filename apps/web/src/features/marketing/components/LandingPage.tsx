'use client';

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
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="text-xl font-semibold tracking-tight">
            Stage<span className="text-fuchsia-400">Link</span>
          </div>
          <nav className="hidden gap-6 text-sm text-zinc-300 md:flex">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="transition hover:text-white">
              How it works
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/30 hover:text-white">
              Log in
            </button>
            <button className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:opacity-90">
              Start free
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pb-28 md:pt-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.22),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.16),transparent_30%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1 text-xs font-medium text-fuchsia-300">
                Your Digital Stage
              </div>
              <h1 className="max-w-2xl text-5xl font-semibold tracking-tight md:text-7xl">
                One page for every song, show, drop and link.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
                StageLink helps artists create a professional landing page in minutes. Connect
                music, videos, merch, events and fan signups in one beautiful place.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <button className="rounded-full bg-fuchsia-500 px-6 py-3 text-sm font-medium transition hover:opacity-90">
                  Create your page
                </button>
                <button className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-white/30 hover:text-white">
                  See examples
                </button>
              </div>
              <div className="mt-8 flex flex-wrap gap-6 text-sm text-zinc-400">
                <span>Spotify</span>
                <span>SoundCloud</span>
                <span>YouTube</span>
                <span>Shopify</span>
                <span>TikTok</span>
              </div>
            </div>

            <div className="relative">
              <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-2xl shadow-fuchsia-900/20 backdrop-blur">
                <div className="rounded-[1.5rem] border border-white/10 bg-zinc-900 p-5">
                  <div className="h-44 rounded-[1.25rem] bg-gradient-to-br from-fuchsia-500/40 via-violet-500/20 to-cyan-400/30" />
                  <div className="mx-auto -mt-12 h-24 w-24 rounded-full border-4 border-zinc-900 bg-zinc-700" />
                  <div className="mt-4 text-center">
                    <h3 className="text-2xl font-semibold">Robertino</h3>
                    <p className="mt-1 text-sm text-zinc-400">DJ · Producer · Creator</p>
                  </div>
                  <div className="mt-6 grid gap-3">
                    {['Listen on Spotify', 'Watch on YouTube', 'Buy merch', 'Join my fan list'].map(
                      (item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100"
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

        <section id="features" className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-fuchsia-300">
                Features
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                Everything artists need in one page.
              </h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
                >
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-6 py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
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
                    className="rounded-3xl border border-white/10 bg-zinc-900/80 p-5"
                  >
                    <div className="text-sm font-medium text-fuchsia-300">{item.step}</div>
                    <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-zinc-300">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-fuchsia-300">
                Content blocks
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                Mix and match your stage.
              </h3>
              <div className="mt-6 flex flex-wrap gap-3">
                {blocks.map((block) => (
                  <span
                    key={block}
                    className="rounded-full border border-white/10 bg-zinc-900/70 px-4 py-2 text-sm text-zinc-200"
                  >
                    {block}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/5 p-8 md:p-12">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-fuchsia-300">
                  Why it wins
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                  Generic bio tools were not built for artists.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-8 text-zinc-300">
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
                    className="rounded-2xl border border-white/10 bg-zinc-900/70 px-5 py-4 text-sm text-zinc-200"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
                Pricing
              </p>
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
                      ? 'border-fuchsia-400/40 bg-fuchsia-500/10 shadow-2xl shadow-fuchsia-900/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold">{plan.name}</h3>
                      <p className="mt-2 text-sm text-zinc-300">{plan.description}</p>
                    </div>
                    {plan.featured && (
                      <span className="rounded-full bg-fuchsia-400/20 px-3 py-1 text-xs font-medium text-fuchsia-200">
                        Most popular
                      </span>
                    )}
                  </div>
                  <div className="mt-8 text-4xl font-semibold">{plan.price}</div>
                  <div className="mt-8 space-y-3 text-sm text-zinc-200">
                    {plan.items.map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-3"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                  <button className="mt-8 w-full rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:opacity-90">
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-24 pt-8">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-gradient-to-br from-fuchsia-500/20 via-violet-500/10 to-cyan-400/10 p-10 text-center md:p-14">
            <h2 className="text-3xl font-semibold tracking-tight md:text-5xl">
              Stop using generic link pages.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-zinc-300">
              Build a beautiful home for your music, art, events and products. Launch free and grow
              into the platform designed for creators.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button className="rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-950 transition hover:opacity-90">
                Start free
              </button>
              <button className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white transition hover:border-white/30">
                Book a demo
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
