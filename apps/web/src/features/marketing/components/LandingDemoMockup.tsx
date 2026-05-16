/**
 * Pure visual component for the landing hero demo mockup.
 *
 * Receives a DemoProfile and a locale, renders the artist page preview
 * with profile-specific data (name, handle, roles, tags, links, media, bio, merch).
 * The visual design is unchanged from the original static mockup.
 *
 * Labels and UI copy still come from the landing translation system.
 */
import Image from 'next/image';
import type { DemoProfile } from '@/features/marketing/data/demo-profiles';
import type { SupportedLocale } from '@/lib/landing-translations';
import { getLandingT } from '@/lib/landing-translations';

// TODO: Replace these local placeholder assets with final AI-generated artist images
// once image generation is available in the repo workflow.
const demoCoverImageSrc = '/landing/artist-demo-cover.svg';
const demoAvatarImageSrc = '/landing/artist-demo-avatar.svg';

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

interface LandingDemoMockupProps {
  profile: DemoProfile;
  locale: string;
}

export function LandingDemoMockup({ profile, locale }: LandingDemoMockupProps) {
  const resolvedLocale: SupportedLocale = locale === 'es' ? 'es' : 'en';
  const t = getLandingT(resolvedLocale);
  const isEs = resolvedLocale === 'es';

  const links = profile.sampleLinks.map((l) => (isEs ? l.labelEs : l.label));
  const mediaItems = profile.mediaItems.map((m) => (isEs ? m.labelEs : m.label));
  const mediaMeta = profile.mediaItems.map((m) => (isEs ? m.metaEs : m.meta));
  const aboutText = isEs ? profile.aboutTextEs : profile.aboutText;
  const merchName = isEs ? profile.merchNameEs : profile.merchName;

  return (
    <div className="landing-surface mx-auto max-w-[22rem] rounded-[1.65rem] p-3 shadow-[0_30px_80px_rgba(155,48,208,0.18)] sm:max-w-xl sm:rounded-[2rem] sm:p-4">
      <div className="rounded-[1.35rem] border border-white/10 bg-sidebar p-3 sm:rounded-[1.6rem] sm:p-4">
        <div
          tabIndex={0}
          aria-label={t.hero.previewLabel}
          className="max-h-[31rem] overflow-y-auto rounded-[1.15rem] border border-white/10 bg-[#140a22] p-2.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 sm:max-h-[40rem] sm:rounded-[1.35rem] sm:p-3"
        >
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
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-100">
              {t.hero.previewLabel}
            </div>
            <h2 className="mt-2 text-[1.375rem] leading-[1.3] font-semibold sm:mt-3 sm:text-[1.625rem]">
              {profile.name}
            </h2>
            <p className="mt-1 text-sm text-white/82">{profile.handle}</p>
            <p className="mt-2 text-base text-white/90">{profile.roles}</p>
          </div>

          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:mt-4">
            {profile.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/84"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 sm:mt-4">
            {socialIcons.map((Icon, index) => (
              <span
                key={index}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white/84 sm:h-9 sm:w-9"
              >
                <Icon />
              </span>
            ))}
          </div>

          <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 sm:mt-5 sm:rounded-[1.5rem] sm:p-5">
            <h3 className="text-[1.375rem] leading-[1.3] font-semibold sm:text-[1.5rem]">
              {t.hero.previewTitle}
            </h3>
            <p className="mt-3 text-base leading-7 text-white/82">{t.hero.previewDescription}</p>

            <div className="mt-4 grid gap-2.5 sm:mt-5 sm:gap-3">
              {links.map((item, index) => {
                const Icon = mockActionIcons[index] ?? PlayIcon;

                return (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3 text-base text-white/90 sm:px-4"
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
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-white/78">
              <span>{t.hero.previewMediaLabel}</span>
              <span className="text-primary/80">{t.hero.previewMediaBadge}</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {mediaItems.map((item, index) => (
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
                    <div className="text-base font-medium text-white/92">{item}</div>
                    <div className="mt-1 text-sm text-white/80">{mediaMeta[index]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 sm:rounded-[1.45rem]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/76">
              {t.hero.previewAboutLabel}
            </div>
            <p className="mt-3 text-[1.0625rem] leading-7 text-white/90">{aboutText}</p>
          </div>

          <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 sm:rounded-[1.45rem]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/78">
              {t.hero.previewMerchLabel}
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-[1.05rem] border border-white/10 bg-sidebar/75 p-3 sm:gap-4 sm:rounded-[1.2rem]">
              <div className="h-16 w-16 rounded-[0.85rem] bg-[linear-gradient(135deg,rgba(94,214,255,0.22),rgba(89,35,156,0.9))] sm:h-20 sm:w-20 sm:rounded-[1rem]" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-white/92">{merchName}</div>
                <div className="mt-1 text-sm text-white/82">{t.hero.previewMerchPrice}</div>
                <div className="mt-3 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  {t.hero.previewMerchStatus}
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-white/75">
                {links[2] ?? t.hero.mockLinks[2]}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-[1.25rem] border border-primary/20 bg-primary/5 p-4 sm:rounded-[1.45rem]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/85">
              {t.hero.previewAudienceLabel}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 rounded-[1.05rem] border border-primary/20 bg-white/5 px-3.5 py-3 sm:gap-4 sm:rounded-[1.2rem] sm:px-4">
              <div>
                <div className="text-base font-semibold text-white">{t.hero.previewFanLabel}</div>
                <div className="mt-1 text-sm text-white/84">{t.hero.previewAudienceText}</div>
              </div>
              <span className="shrink-0 rounded-full bg-brand-gradient px-3 py-2 text-sm font-semibold text-white">
                {t.hero.previewAudienceCta}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
