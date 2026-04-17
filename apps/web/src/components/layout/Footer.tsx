import Link from 'next/link';
import { getLandingT } from '@/lib/landing-translations';

export function Footer({ locale }: { locale: string }) {
  const t = getLandingT(locale);
  const year = new Date().getFullYear();
  const copyright = t.footer.copyright.replace('{year}', String(year));
  const homePath = `/${locale}`;

  return (
    <footer className="border-t border-white/10 py-12">
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
            <p className="mt-3 text-sm leading-6 text-white/40">{t.footer.description}</p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <Link
              href={`${homePath}#product`}
              className="text-white/40 transition-colors hover:text-white/70"
            >
              {t.footer.links.product}
            </Link>
            <Link
              href={`${homePath}#features`}
              className="text-white/40 transition-colors hover:text-white/70"
            >
              {t.footer.links.features}
            </Link>
            <Link
              href={`${homePath}#how-it-works`}
              className="text-white/40 transition-colors hover:text-white/70"
            >
              {t.footer.links.howItWorks}
            </Link>
            <Link
              href={`/${locale}/pricing`}
              className="text-white/40 transition-colors hover:text-white/70"
            >
              {t.footer.links.pricing}
            </Link>
            <Link
              href={`${homePath}#contact`}
              className="text-white/40 transition-colors hover:text-white/70"
            >
              {t.footer.links.contact}
            </Link>
          </nav>
        </div>

        <div className="mt-10 border-t border-white/5 pt-6 text-xs text-white/30">{copyright}</div>
      </div>
    </footer>
  );
}
