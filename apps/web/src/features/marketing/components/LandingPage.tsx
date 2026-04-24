'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import type { SupportedLocale } from '@/lib/landing-translations';
import { getLandingT } from '@/lib/landing-translations';

interface LandingPageProps {
  locale: string;
}

const featureNumbers = ['01', '02', '03', '04', '05', '06'] as const;
const pillarNumbers = ['A', 'B', 'C'] as const;

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M5 9.8c4.2-1.3 9.8-.9 13.9 1.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 13.2c3.4-1 7.5-.7 10.5 1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8.1 16.3c2.5-.7 5.2-.4 7.2.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M9 7.5v9l7-4.5-7-4.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect
        x="4.5"
        y="6.5"
        width="15"
        height="11"
        rx="3.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M10 9.5v5l4-2.5-4-2.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path d="M7 9h10l-.8 9H7.8L7 9Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function FanIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M12 6v12M6 12h12M8.5 8.5l7 7M15.5 8.5l-7 7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <rect
        x="5.2"
        y="5.2"
        width="13.6"
        height="13.6"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16.4" cy="7.7" r="0.9" fill="currentColor" />
    </svg>
  );
}

function SoundwaveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M6 14v2M9 11v5M12 8v8M15 10v6M18 12v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M14 5.5c.6 1.7 1.8 3 3.5 3.7V12c-1.5-.1-2.7-.6-3.8-1.4v4.2a4.2 4.2 0 1 1-4.2-4.2c.3 0 .6 0 .9.1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3.5 12h17M12 3.5c2.2 2.4 3.4 5.4 3.4 8.5s-1.2 6.1-3.4 8.5c-2.2-2.4-3.4-5.4-3.4-8.5S9.8 5.9 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

const mockActionIcons = [SpotifyIcon, PlayIcon, BagIcon, FanIcon] as const;
const socialIcons = [InstagramIcon, PlayIcon, TikTokIcon, SoundwaveIcon, GlobeIcon] as const;
const platformIcons = [
  SpotifyIcon,
  SoundwaveIcon,
  YouTubeIcon,
  BagIcon,
  TikTokIcon,
  InstagramIcon,
] as const;
const platformToneClasses = [
  'text-emerald-300/90 bg-emerald-400/10 border-emerald-400/20',
  'text-orange-200/90 bg-orange-400/10 border-orange-400/20',
  'text-rose-200/90 bg-rose-400/10 border-rose-400/20',
  'text-cyan-200/90 bg-cyan-400/10 border-cyan-400/20',
  'text-pink-200/90 bg-pink-400/10 border-pink-400/20',
  'text-fuchsia-200/90 bg-fuchsia-400/10 border-fuchsia-400/20',
] as const;

// TODO: Replace these local placeholder assets with final AI-generated artist images
// once image generation is available in the repo workflow.
const demoCoverImageSrc = '/landing/artist-demo-cover.svg';
const demoAvatarImageSrc = '/landing/artist-demo-avatar.svg';

export function LandingPage({ locale }: LandingPageProps) {
  const resolvedLocale: SupportedLocale = locale === 'es' ? 'es' : 'en';
  const t = getLandingT(resolvedLocale);

  const [contactState, setContactState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [contactError, setContactError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [form, setForm] = useState({
    name: '',
    email: '',
    artistType: '',
    message: '',
  });

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    if (contactError) setContactError(null);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (contactState === 'submitting') return;

    setContactError(null);
    setContactState('submitting');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...form,
          website: honeypot,
          startedAt,
        }),
      });

      if (!response.ok) {
        setContactState('idle');
        setContactError(t.contact.error);
        return;
      }

      setContactState('success');
      setForm({
        name: '',
        email: '',
        artistType: '',
        message: '',
      });
      setHoneypot('');
      setStartedAt(Date.now());
    } catch {
      setContactState('idle');
      setContactError(t.contact.error);
    }
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <section
        id="product"
        className="relative overflow-hidden px-5 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 md:pb-24 md:pt-20"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(155,48,208,0.22),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(232,121,249,0.14),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 sm:gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div>
            <div className="mb-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-primary sm:mb-5 sm:text-xs">
              {t.badge}
            </div>
            <h1 className="max-w-3xl text-[2.55rem] leading-[0.96] font-semibold tracking-tight sm:text-5xl md:text-6xl xl:text-7xl">
              {t.hero.headline}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:mt-6 sm:text-lg sm:leading-8">
              {t.hero.subheadline}
            </p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/52 sm:leading-7">
              {t.hero.supportingText}
            </p>
            <p className="mt-4 text-sm text-white/64">{t.hero.socialProof}</p>

            <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link
                href="/api/auth/signin"
                className="rounded-full bg-brand-gradient px-6 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
              >
                {t.hero.ctaPrimary}
              </Link>
              <a
                href="#preview"
                className="rounded-full border border-white/15 px-6 py-3 text-center text-sm font-medium text-white/80 transition hover:border-white/30 hover:text-white sm:w-auto"
              >
                {t.hero.ctaSecondary}
              </a>
            </div>
            <p className="mt-3 text-sm text-white/55">{t.hero.ctaNote}</p>
          </div>

          <div id="preview" className="relative">
            <div className="mx-auto max-w-[22rem] rounded-[1.65rem] border border-white/10 bg-white/5 p-3 shadow-[0_30px_80px_rgba(155,48,208,0.18)] backdrop-blur sm:max-w-xl sm:rounded-[2rem] sm:p-4">
              <div className="rounded-[1.35rem] border border-white/10 bg-sidebar p-3 sm:rounded-[1.6rem] sm:p-4">
                <div className="max-h-[31rem] overflow-y-auto rounded-[1.15rem] border border-white/10 bg-[#140a22] p-2.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 sm:max-h-[40rem] sm:rounded-[1.35rem] sm:p-3">
                  <div className="relative h-32 overflow-hidden rounded-[1rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(155,48,208,0.4),rgba(64,18,108,0.86)_58%,rgba(18,11,28,0.98)_100%)] sm:h-40 sm:rounded-[1.2rem]">
                    <Image
                      src={demoCoverImageSrc}
                      alt="Demo artist cover"
                      fill
                      sizes="(max-width: 640px) 320px, 480px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,3,16,0.08),rgba(7,3,16,0.18)_42%,rgba(7,3,16,0.46)_100%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_35%,rgba(255,255,255,0.03)_65%,transparent)]" />
                  </div>

                  <div className="relative z-10 mx-auto -mt-10 flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-[#140a22] bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.92),rgba(187,132,255,0.95)_28%,rgba(55,22,92,0.98)_74%,rgba(17,9,31,1)_100%)] shadow-[0_18px_35px_rgba(0,0,0,0.45)] sm:-mt-12 sm:h-24 sm:w-24 sm:border-4">
                    <div className="relative h-14 w-14 overflow-hidden rounded-full sm:h-16 sm:w-16">
                      <Image
                        src={demoAvatarImageSrc}
                        alt="Demo artist portrait"
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <div className="mt-3 text-center sm:mt-4">
                    <div className="text-xs font-medium uppercase tracking-[0.22em] text-primary/80">
                      {t.hero.previewLabel}
                    </div>
                    <h2 className="mt-2 text-xl font-semibold sm:mt-3 sm:text-2xl">Robertino</h2>
                    <p className="mt-1 text-sm text-white/58">{t.hero.previewHandle}</p>
                    <p className="mt-2 text-sm text-white/66">{t.hero.previewRoles}</p>
                  </div>

                  <div className="mt-3 flex flex-wrap justify-center gap-2 sm:mt-4">
                    {t.hero.previewTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white/74"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-center gap-2 sm:mt-4">
                    {socialIcons.map((Icon, index) => (
                      <span
                        key={index}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/75 sm:h-9 sm:w-9"
                      >
                        <Icon />
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 sm:mt-5 sm:rounded-[1.5rem] sm:p-5">
                    <h3 className="text-base font-semibold sm:text-lg">{t.hero.previewTitle}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/68 sm:leading-7">
                      {t.hero.previewDescription}
                    </p>

                    <div className="mt-4 grid gap-2.5 sm:mt-5 sm:gap-3">
                      {t.hero.mockLinks.map((item, index) => {
                        const Icon = mockActionIcons[index] ?? PlayIcon;

                        return (
                          <div
                            key={item}
                            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white/86 sm:px-4"
                          >
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">
                              <Icon />
                            </span>
                            <span>{item}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 sm:rounded-[1.45rem]">
                    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
                      <span>{t.hero.previewMediaLabel}</span>
                      <span className="text-primary/80">{t.hero.previewMediaBadge}</span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {t.hero.previewMediaItems.map((item, index) => (
                        <div
                          key={item}
                          className="overflow-hidden rounded-[1.2rem] border border-white/10 bg-sidebar/75"
                        >
                          <div
                            className={`h-20 sm:h-24 ${
                              index === 0
                                ? 'bg-[linear-gradient(135deg,rgba(240,98,146,0.38),rgba(70,19,122,0.95))]'
                                : 'bg-[linear-gradient(135deg,rgba(83,204,255,0.28),rgba(76,24,129,0.95))]'
                            }`}
                          />
                          <div className="p-3">
                            <div className="text-sm font-medium text-white/90">{item}</div>
                            <div className="mt-1 text-xs text-white/56">
                              {t.hero.previewMediaMeta[index]}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 sm:rounded-[1.45rem]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
                      {t.hero.previewAboutLabel}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white/72 sm:leading-7">
                      {t.hero.previewAboutText}
                    </p>
                  </div>

                  <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 sm:rounded-[1.45rem]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/52">
                      {t.hero.previewMerchLabel}
                    </div>
                    <div className="mt-3 flex items-center gap-3 rounded-[1.05rem] border border-white/10 bg-sidebar/75 p-3 sm:gap-4 sm:rounded-[1.2rem]">
                      <div className="h-16 w-16 rounded-[0.85rem] bg-[linear-gradient(135deg,rgba(94,214,255,0.22),rgba(89,35,156,0.9))] sm:h-20 sm:w-20 sm:rounded-[1rem]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white/90">
                          {t.hero.previewMerchName}
                        </div>
                        <div className="mt-1 text-xs text-white/56">{t.hero.previewMerchPrice}</div>
                        <div className="mt-3 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                          {t.hero.previewMerchStatus}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-white/75">
                        {t.hero.mockLinks[2]}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.25rem] border border-primary/20 bg-primary/5 p-4 sm:rounded-[1.45rem]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/85">
                      {t.hero.previewAudienceLabel}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 rounded-[1.05rem] border border-primary/20 bg-white/5 px-3.5 py-3 sm:gap-4 sm:rounded-[1.2rem] sm:px-4">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {t.hero.previewFanLabel}
                        </div>
                        <div className="mt-1 text-xs text-white/62">
                          {t.hero.previewAudienceText}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-brand-gradient px-3 py-2 text-xs font-semibold text-white">
                        {t.hero.previewAudienceCta}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-white/[0.02] px-6 py-5">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/8 bg-white/[0.03] p-6 md:p-8">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/44">
                {t.strip.label}
              </p>
              <p className="max-w-3xl text-sm leading-7 text-white/72">{t.strip.socialProof}</p>
              <div className="flex flex-wrap gap-3">
                {t.strip.items.map((item) => (
                  <span
                    key={item}
                    className="landing-hover-card rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/82"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/44">
                {t.strip.platformsLabel}
              </p>
              <p className="max-w-3xl text-sm leading-7 text-white/60">
                {t.strip.platformsDescription}
              </p>
            </div>

            <div className="landing-platform-marquee">
              <div className="landing-platform-track gap-3 pr-3">
                {[...t.strip.platforms, ...t.strip.platforms].map((platform, index) => {
                  const Icon = platformIcons[index % platformIcons.length] ?? GlobeIcon;
                  const toneClass =
                    platformToneClasses[index % platformToneClasses.length] ??
                    'text-white/80 bg-white/5 border-white/10';

                  return (
                    <span
                      key={`${platform}-${index}`}
                      className={`landing-hover-card inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap ${toneClass}`}
                    >
                      <Icon />
                      <span>{platform}</span>
                    </span>
                  );
                })}
              </div>
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
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/68">{t.problem.intro}</p>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="landing-hover-card rounded-[1.8rem] border border-rose-900/55 bg-[linear-gradient(180deg,rgba(62,18,31,0.5),rgba(26,10,18,0.82))] p-6 shadow-[0_22px_48px_rgba(34,8,16,0.24)]">
              <h3 className="text-lg font-semibold">{t.problem.painLabel}</h3>
              <div className="mt-5 space-y-3">
                {t.problem.painPoints.map((item) => (
                  <div
                    key={item}
                    className="landing-hover-card rounded-2xl border border-rose-900/45 bg-rose-950/25 px-4 py-3 text-sm leading-7 text-white/80"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="landing-hover-card rounded-[1.8rem] border border-emerald-900/50 bg-[linear-gradient(180deg,rgba(10,48,33,0.36),rgba(9,24,17,0.82))] p-6 shadow-[0_22px_48px_rgba(5,26,17,0.22)]">
              <h3 className="text-lg font-semibold">{t.problem.solutionLabel}</h3>
              <div className="mt-5 space-y-3">
                {t.problem.solutionPoints.map((item) => (
                  <div
                    key={item}
                    className="landing-hover-card rounded-2xl border border-emerald-900/35 bg-emerald-950/20 px-4 py-3 text-sm leading-7 text-white/86"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative overflow-hidden px-6 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(155,48,208,0.16),transparent_28%),radial-gradient(circle_at_82%_75%,rgba(232,121,249,0.12),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              {t.features.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
              {t.features.headline}
            </h2>
            <p className="mt-5 text-base leading-8 text-white/68">{t.features.intro}</p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {t.features.items.map((feature, index) => (
              <div
                key={feature.title}
                className="landing-surface-glow rounded-[1.8rem] border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/85">
                  {featureNumbers[index] ?? '00'}
                </div>
                <h3 className="mt-4 text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/68">{feature.description}</p>
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
            <p className="mt-5 text-base leading-8 text-white/68">{t.howItWorks.intro}</p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {t.howItWorks.steps.map((item) => (
              <div
                key={item.step}
                className="rounded-[1.8rem] border border-white/10 bg-sidebar/80 p-6"
              >
                <div className="text-sm font-semibold text-primary">{item.step}</div>
                <h3 className="mt-3 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/68">{item.text}</p>
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
            <p className="mt-5 text-base leading-8 text-white/68">{t.forArtists.body}</p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.forArtists.segments.map((segment) => (
              <div
                key={segment.label}
                className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <h3 className="text-xl font-semibold">{segment.label}</h3>
                <p className="mt-3 text-sm leading-7 text-white/66">{segment.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(155,48,208,0.16),transparent_28%),radial-gradient(circle_at_14%_84%,rgba(110,56,210,0.14),transparent_30%)]" />
        <div className="relative mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/5 p-8 md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/60">
                {t.monetization.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                {t.monetization.headline}
              </h2>
              <p className="mt-5 text-base leading-8 text-white/68">{t.monetization.body}</p>

              <div className="mt-8 space-y-3">
                {t.monetization.points.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-white/10 bg-sidebar/60 px-4 py-3 text-sm text-white/86"
                  >
                    {point}
                  </div>
                ))}
              </div>

              <blockquote className="mt-8 rounded-[1.7rem] border border-primary/20 bg-primary/8 px-5 py-5">
                <p className="text-sm text-primary/80">{t.monetization.founderSupport}</p>
                <p className="mt-3 text-lg leading-8 text-white/90">{t.monetization.founderQuote}</p>
                <footer className="mt-4 block text-sm text-white/66">
                  {t.monetization.founderCredit}
                </footer>
              </blockquote>
            </div>

            <div className="grid gap-4">
              {t.monetization.pillars.map((pillar, index) => (
                <div
                  key={pillar.title}
                  className="landing-surface-glow rounded-[1.7rem] border border-white/10 bg-sidebar/75 p-6"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/85">
                    {pillarNumbers[index] ?? 'A'}
                  </div>
                  <h3 className="mt-4 text-xl font-semibold">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/68">{pillar.description}</p>
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
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/68">{t.cta.body}</p>
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
          <p className="mt-3 text-sm text-white/55">{t.cta.note}</p>
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
            <p className="mt-4 text-base leading-8 text-white/68">{t.contact.body}</p>

            {contactState === 'success' ? (
              <div className="mt-10 rounded-[2rem] border border-primary/30 bg-primary/10 p-10 text-center">
                <div className="text-4xl">✓</div>
                <p className="mt-4 text-lg font-semibold text-white">{t.contact.success}</p>
              </div>
            ) : (
              <form
                onSubmit={handleContactSubmit}
                className="landing-surface-glow mt-10 grid gap-5 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-primary/25 hover:bg-white/[0.05]"
              >
                <div aria-hidden="true" className="absolute -left-[9999px] -top-[9999px] opacity-0">
                  <label htmlFor="landing-website">Website</label>
                  <input
                    id="landing-website"
                    name="website"
                    type="text"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
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
                {contactError && <p className="text-sm text-rose-300">{contactError}</p>}
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
