import Link from 'next/link';

export function Footer({ locale }: { locale: string }) {
  return (
    <footer className="border-t border-white/10 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-white/40 sm:flex-row">
        <p>© {new Date().getFullYear()} StageLink. All rights reserved.</p>
        <nav className="flex gap-4">
          <Link href={`/${locale}/pricing`} className="transition-colors hover:text-white/70">
            Pricing
          </Link>
        </nav>
      </div>
    </footer>
  );
}
