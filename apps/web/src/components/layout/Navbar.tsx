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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/75 shadow-[0_18px_50px_rgba(13,10,25,0.35)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="flex shrink-0 items-center gap-1 text-lg font-bold tracking-tight font-[family-name:var(--font-heading)]"
        >
          <span className="text-white">Stage</span>
          <span className="text-gradient-brand">Link</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white/60 transition-colors hover:text-white"
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
            className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/50 transition-colors hover:border-white/20 hover:text-white/80 sm:flex"
            aria-label={`${t.nav.languageLabel}: ${otherLocale.toUpperCase()}`}
          >
            {otherLocale.toUpperCase()}
          </Link>

          <Link
            href={`/${locale}/login`}
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white sm:block"
          >
            {t.nav.login}
          </Link>

          <Link
            href="/api/auth/signin"
            className="rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <span className="hidden sm:inline">{t.nav.cta}</span>
            <span className="sm:hidden">Get started</span>
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 hover:text-white md:hidden"
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
        <div className="border-t border-white/10 bg-background/95 px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-3">
              <Link href={`/${locale}/login`} className="text-sm text-white/60 hover:text-white">
                {t.nav.login}
              </Link>
              <Link
                href={switchPath}
                className="ml-auto rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-white/50 hover:text-white/80"
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
