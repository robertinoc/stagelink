import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { isBehindOwner } from '@/lib/behind-config';

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;

  const session = await getSession();

  // Not authenticated → send to the existing login flow.
  if (!session) {
    redirect(`/${locale}/login`);
  }

  // Authenticated but not the owner → silent redirect to main site.
  // We redirect rather than 403 to avoid confirming that this path exists.
  if (!isBehindOwner(session.user.email)) {
    redirect(`/${locale}`);
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
    >
      {/* Top bar */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 sm:px-6"
        style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--sidebar)' }}
      >
        <div>
          <p
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            StageLink
          </p>
          <h1
            className="text-base font-semibold leading-tight font-[family-name:var(--font-heading)]"
            style={{ color: 'var(--foreground)' }}
          >
            Behind the Stage
          </h1>
        </div>
        <p className="hidden text-xs sm:block" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Internal control panel · {session.user.email}
        </p>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        {/* Section nav */}
        <nav className="flex gap-1 border-b py-2" style={{ borderColor: 'var(--border)' }}>
          <Link
            href={`/${locale}/behind`}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
            style={{ color: 'var(--foreground)', backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            Users
          </Link>
        </nav>

        {/* Page content */}
        <main className="py-6">{children}</main>
      </div>
    </div>
  );
}
