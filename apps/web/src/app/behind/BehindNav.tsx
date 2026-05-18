'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/behind', label: 'Users', section: 'users' },
  { href: '/behind/analytics', label: 'Analytics', section: 'analytics' },
] as const;

export function BehindNav() {
  const pathname = usePathname();

  return (
    <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
      <p className="mb-2 hidden px-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/25 lg:block">
        Dashboard
      </p>
      <nav className="flex gap-1 overflow-x-auto border-b border-white/10 pb-3 lg:flex-col lg:overflow-visible lg:border-b-0 lg:pb-0">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === '/behind' ? pathname === '/behind' : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              data-umami-event="behind_nav_clicked"
              data-umami-event-section={item.section}
              className={cn(
                'whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold transition-colors font-[family-name:var(--font-heading)] lg:w-full',
                active
                  ? 'border-primary/30 bg-primary/10 text-white shadow-[0_0_12px_rgba(155,48,208,0.15)]'
                  : 'border-transparent text-white/45 hover:border-white/12 hover:bg-white/5 hover:text-white/75',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
