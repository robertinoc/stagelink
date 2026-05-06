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
  // IMPORTANT: redirect through the main domain (stagelink.art), not via a
  // relative URL. The reason: when this layout runs on behind.stagelink.art,
  // a relative redirect goes to behind.stagelink.art/api/auth/signin, which
  // sets the PKCE state cookie (wos-auth-verifier) on behind.stagelink.art.
  // WorkOS always redirects back to WORKOS_REDIRECT_URI (stagelink.art/api/
  // auth/callback), and without WORKOS_COOKIE_DOMAIN=.stagelink.art that
  // cookie is absent on the callback request, causing the auth to fail.
  // Routing through the main domain ensures the cookie is set on the same
  // origin as the callback, with no extra env-var requirement.
  if (!session) {
    const redirectUri = process.env.WORKOS_REDIRECT_URI;
    const mainOrigin = redirectUri ? new URL(redirectUri).origin : '';
    redirect(`${mainOrigin}/api/auth/signin?returnTo=${encodeURIComponent('/behind')}`);
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
