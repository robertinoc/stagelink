import Link from 'next/link';
import { getLandingT } from '@/lib/landing-translations';

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0" fill="none" aria-hidden="true">
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

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] shrink-0"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3.24 8.5h3.5V21h-3.5V8.5Zm5.84 0h3.36v1.7h.05c.47-.89 1.62-1.82 3.33-1.82 3.56 0 4.22 2.34 4.22 5.39V21h-3.5v-6.39c0-1.52-.03-3.48-2.12-3.48-2.12 0-2.45 1.66-2.45 3.37V21h-3.5V8.5h.61Z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] shrink-0"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.36-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.02.03.05.03.07.02 1.72-.53 3.45-1.33 5.24-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02ZM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.84 2.12-1.89 2.12Zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12 0 1.17-.83 2.12-1.89 2.12Z" />
    </svg>
  );
}

export function Footer({ locale }: { locale: string }) {
  const t = getLandingT(locale);
  const year = new Date().getFullYear();
  const copyright = t.footer.copyright.replace('{year}', String(year));
  const homePath = `/${locale}`;

  return (
    <footer className="border-t border-white/12 bg-[#0b0b0f] py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand */}
          <div className="max-w-xs">
            <Link
              href={`/${locale}`}
              className="flex items-center gap-1 text-lg font-bold tracking-tight font-[family-name:var(--font-heading)]"
            >
              <span className="text-white">Stage</span>
              <span className="text-gradient-brand">Link</span>
            </Link>
            <p className="mt-3 max-w-sm text-[1.02rem] leading-7 text-white/84">
              {t.footer.description}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-16">
            {/* Product */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                Product
              </p>
              <nav className="flex flex-col gap-2 text-[1.02rem]">
                <Link
                  href={`${homePath}#product`}
                  className="font-medium text-white/72 transition-colors hover:text-white"
                >
                  {t.footer.links.product}
                </Link>
                <Link
                  href={`${homePath}#features`}
                  className="font-medium text-white/72 transition-colors hover:text-white"
                >
                  {t.footer.links.features}
                </Link>
                <Link
                  href={`${homePath}#how-it-works`}
                  className="font-medium text-white/72 transition-colors hover:text-white"
                >
                  {t.footer.links.howItWorks}
                </Link>
                <Link
                  href={`/${locale}/pricing`}
                  className="font-medium text-white/72 transition-colors hover:text-white"
                >
                  {t.footer.links.pricing}
                </Link>
                <Link
                  href={`${homePath}#contact`}
                  className="font-medium text-white/72 transition-colors hover:text-white"
                >
                  {t.footer.links.contact}
                </Link>
              </nav>
            </div>

            {/* Resources */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                Resources
              </p>
              <nav className="flex flex-col gap-2 text-[1.02rem]">
                <Link
                  href={`/${locale}/blog`}
                  className="font-medium text-white/72 transition-colors hover:text-white"
                >
                  {t.footer.links.blog}
                </Link>
                <Link
                  href={`/${locale}/docs`}
                  className="font-medium text-white/72 transition-colors hover:text-white"
                >
                  {t.footer.links.docs}
                </Link>
                <Link
                  href={`/${locale}/install`}
                  className="font-medium text-white/72 transition-colors hover:text-white"
                >
                  {t.footer.links.install}
                </Link>
              </nav>
            </div>

            {/* Legal */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                {t.footer.legal.heading}
              </p>
              <nav className="flex flex-col gap-2 text-[1.02rem]">
                <Link
                  href={`/${locale}/privacy`}
                  className="font-medium text-white/72 transition-colors hover:text-white"
                >
                  {t.footer.legal.privacy}
                </Link>
                <Link
                  href={`/${locale}/terms`}
                  className="font-medium text-white/72 transition-colors hover:text-white"
                >
                  {t.footer.legal.terms}
                </Link>
                <Link
                  href={`/${locale}/cookie-policy`}
                  className="font-medium text-white/72 transition-colors hover:text-white"
                >
                  {t.footer.legal.cookies}
                </Link>
              </nav>
            </div>

            {/* Community */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                {t.footer.community.heading}
              </p>
              <nav className="flex flex-col gap-2 text-[1.02rem]">
                <a
                  href="https://www.instagram.com/stagelink.art/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 font-medium text-white/72 transition-colors hover:text-[#e879f9]"
                >
                  <span className="text-[#c084fc] transition-colors group-hover:text-[#e879f9]">
                    <InstagramIcon />
                  </span>
                  {t.footer.community.instagram}
                </a>
                <a
                  href="https://www.linkedin.com/company/stagelink-art/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 font-medium text-white/72 transition-colors hover:text-[#e879f9]"
                >
                  <span className="text-[#c084fc] transition-colors group-hover:text-[#e879f9]">
                    <LinkedInIcon />
                  </span>
                  {t.footer.community.linkedin}
                </a>
                <a
                  href="https://discord.gg/76dFVydHH"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 font-medium text-white/72 transition-colors hover:text-[#e879f9]"
                >
                  <span className="text-[#c084fc] transition-colors group-hover:text-[#e879f9]">
                    <DiscordIcon />
                  </span>
                  {t.footer.community.discord}
                </a>
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/8 pt-6 text-sm text-white/68">{copyright}</div>
      </div>
    </footer>
  );
}
