import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { isBehindOwner } from '@/lib/behind-config';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getSession();

  // Not authenticated → trigger WorkOS sign-in.
  //
  // returnTo lands the user back on /behind after auth — without it
  // the callback falls back to /en/dashboard (the artist app), bouncing admins
  // away from the panel they were trying to reach.
  //
  // After auth WorkOS returns to WORKOS_REDIRECT_URI (stagelink.art).
  // With WORKOS_COOKIE_DOMAIN=.stagelink.art that session cookie is
  // automatically valid on behind.stagelink.art on the next visit.
  if (!session) {
    redirect(`/api/auth/signin?returnTo=${encodeURIComponent('/behind')}`);
  }

  // Authenticated but not the owner → silent redirect to main site.
  // We redirect rather than 403 to avoid confirming that this path exists.
  if (!isBehindOwner(session.user.email)) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar — matches AppTopbar/AppSidebar height and border treatment */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-white/10 bg-sidebar px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Logo — same text treatment as AppSidebar */}
          <span className="font-[family-name:var(--font-heading)] text-lg font-semibold tracking-tight">
            <span className="text-white">Stage</span>
            <span className="bg-gradient-to-r from-fuchsia-400 to-purple-500 bg-clip-text text-transparent">
              Link
            </span>
          </span>
          <span className="text-white/20">·</span>
          <span className="font-[family-name:var(--font-heading)] text-sm font-medium text-white/50">
            Behind the Stage
          </span>
        </div>
        <p className="hidden text-xs text-white/40 sm:block">{session.user.email}</p>
      </header>

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        {/* Section nav */}
        <nav className="flex gap-1 border-b border-white/10 py-2">
          <Link
            href="/behind"
            className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-sm font-semibold text-white shadow-[0_0_12px_rgba(155,48,208,0.15)] transition-colors font-[family-name:var(--font-heading)]"
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
