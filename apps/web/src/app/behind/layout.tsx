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
  // Redirect to /api/auth/behind-signin on stagelink.art (main domain), not
  // a relative URL. Two reasons:
  //
  // 1. Cookie domain: when running on behind.stagelink.art, a relative redirect
  //    sets the PKCE cookie on behind.stagelink.art. WorkOS always returns to
  //    WORKOS_REDIRECT_URI (stagelink.art/api/auth/callback), so the cookie
  //    would be absent and auth fails. Using the main domain ensures the PKCE
  //    cookie and the callback are on the same origin.
  //
  // 2. Vercel WAF: passing returnTo as a query parameter (?returnTo=/behind or
  //    ?returnTo=%2Fbehind) triggers path-traversal false positives and gets
  //    blocked with 403 before the route handler runs. The dedicated endpoint
  //    has no query parameters and hardcodes the return path server-side.
  if (!session) {
    const redirectUri = process.env.WORKOS_REDIRECT_URI;
    const mainOrigin = redirectUri ? new URL(redirectUri).origin : '';
    redirect(`${mainOrigin}/api/auth/behind-signin`);
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
