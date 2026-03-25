import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function Navbar({ locale }: { locale: string }) {
  const t = useTranslations('nav');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href={`/${locale}`} className="flex items-center gap-2 font-bold text-lg">
          StageLink
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link
            href={`/${locale}/pricing`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('pricing')}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}/login`}>{t('login')}</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={`/${locale}/signup`}>{t('signup')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
