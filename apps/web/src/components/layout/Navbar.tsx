import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function Navbar({ locale }: { locale: string }) {
  const t = useTranslations('nav');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-lg font-bold font-[family-name:var(--font-heading)] tracking-tight"
        >
          <span className="text-white">Stage</span>
          <span className="text-gradient-brand">Link</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link
            href={`/${locale}/pricing`}
            className="text-white/60 transition-colors hover:text-white"
          >
            {t('pricing')}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/login`}
            className="rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            {t('login')}
          </Link>
          <Link
            href={`/${locale}/signup`}
            className="rounded-full bg-brand-gradient px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t('signup')}
          </Link>
        </div>
      </div>
    </header>
  );
}
