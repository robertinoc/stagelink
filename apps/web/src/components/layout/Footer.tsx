import Link from 'next/link';

export function Footer({ locale }: { locale: string }) {
  return (
    <footer className="border-t py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} StageLink. All rights reserved.</p>
        <nav className="flex gap-4">
          <Link href={`/${locale}/pricing`} className="hover:text-foreground transition-colors">
            Pricing
          </Link>
        </nav>
      </div>
    </footer>
  );
}
