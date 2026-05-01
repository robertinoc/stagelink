'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { getLandingT } from '@/lib/landing-translations';

interface NavbarProps {
  locale: string;
}

export function Navbar({ locale }: NavbarProps) {
  const t = getLandingT(locale);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const otherLocale = locale === 'en' ? 'es' : 'en';
  const currentPath = pathname || `/${locale}`;
  const switchPath = currentPath.replace(`/${locale}`, `/${otherLocale}`);
  const homePath = `/${locale}`;
  const navHref = (hash: string) => (currentPath === homePath ? hash : `${homePath}${hash}`);

  const navLinks = [
    { label: t.nav.product, href: navHref('#product') },
    { label: t.nav.features, href: navHref('#features') },
    { label: t.nav.howItWorks, href: navHref('#how-it-works') },
    { label: t.nav.forArtists, href: navHref('#for-artists') },
    { label: t.nav.contact, href: navHref('#contact') },
  ];

  const resourceLinks = [{ label: t.nav.blog, href: `/${locale}/blog` }];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/12 bg-[#0b0b0f]/88 shadow-[0_18px_50px_rgba(8,8,12,0.34)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#0b0b0f]/76">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex shrink-0 items-center gap-1 text-lg font-bold tracking-tight font-[family-name:var(--font-heading)]"
        >
          <span className="text-white">Stage</span>
          <span className="text-gradient-brand">Link</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-[0.95rem] md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-white/84 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <span className="h-4 w-px bg-white/16" aria-hidden />
          {resourceLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-white/60 transition-colors hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <Link
            href={switchPath}
            className="hidden min-h-11 items-center rounded-full border border-white/16 bg-white/6 px-4 py-2 text-sm font-medium text-white/84 transition-colors hover:border-white/24 hover:text-white sm:flex"
            aria-label={`${t.nav.languageLabel}: ${otherLocale.toUpperCase()}`}
          >
            {otherLocale.toUpperCase()}
          </Link>

          <Link
            href={`/${locale}/login`}
            className="hidden min-h-11 items-center rounded-full px-4 py-2 text-sm font-medium text-white/84 transition-colors hover:text-white sm:inline-flex"
          >
            {t.nav.login}
          </Link>

          <Link
            href={`/${locale}/login`}
            className="landing-button-primary rounded-full bg-brand-gradient px-5 text-center text-white transition-opacity hover:opacity-95"
          >
            <span className="hidden sm:inline">{t.nav.cta}</span>
            <span className="sm:hidden">Get started</span>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="ml-1 flex h-12 w-12 items-center justify-center rounded-full border border-white/14 bg-white/5 text-white/76 hover:text-white md:hidden"
          >
            {mobileOpen ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 2L14 14M14 2L2 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 4H14M2 8H14M2 12H14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-nav"
          className="border-t border-white/12 bg-[#0b0b0f]/96 px-4 py-4 md:hidden"
        >
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-white/88 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-1 border-t border-white/8" />
            {resourceLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-medium text-white/64 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3">
              <Link
                href={`/${locale}/login`}
                className="text-base font-medium text-white/84 hover:text-white"
              >
                {t.nav.login}
              </Link>
              <Link
                href={switchPath}
                className="ml-auto inline-flex min-h-11 items-center rounded-full border border-white/16 px-4 py-2 text-sm font-medium text-white/84 hover:text-white"
              >
                {otherLocale.toUpperCase()}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
