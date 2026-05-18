import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { hasBehindAccess } from '@/lib/behind-redis';
import { UmamiProvider } from '@/lib/analytics/UmamiProvider';
import { BehindNav } from './BehindNav';

export const metadata: Metadata = {
  title: {
    template: '%s | Behind the Stage',
    default: 'Behind the Stage — StageLink',
  },
  description: 'StageLink admin panel.',
  // Explicit icon set so behind.stagelink.art shows the correct favicon
  // regardless of how metadataBase is resolved for the subdomain.
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

const DEFAULT_MAIN_AUTH_ORIGIN = 'https://stagelink.art';

function getMainAuthOrigin(): string {
  const candidates = [process.env.WORKOS_REDIRECT_URI, process.env.NEXT_PUBLIC_APP_URL];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.origin;
    } catch {
      // Try the next candidate; auth redirect should not render a stack trace.
    }
  }

  return DEFAULT_MAIN_AUTH_ORIGIN;
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
    redirect(`${getMainAuthOrigin()}/api/auth/behind-signin`);
  }

  // Authenticated but no behind access (not owner or admin) → silent redirect.
  // We redirect rather than 403 to avoid confirming that this path exists.
  if (!(await hasBehindAccess(session.user.email))) {
    redirect('/');
  }

  return (
    <UmamiProvider>
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
          <div className="flex items-center gap-3">
            <p className="hidden text-xs text-white/40 sm:block">{session.user.email}</p>
            <a
              href="/api/auth/signout"
              data-umami-event="behind_logout_clicked"
              className="rounded-md border border-white/[0.12] px-2.5 py-1 text-xs font-medium text-white/40 transition-colors hover:border-white/25 hover:text-white/75"
            >
              Log out
            </a>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="grid gap-6 py-6 lg:grid-cols-[9.5rem_minmax(0,1fr)]">
            <BehindNav />

            {/* Page content */}
            <main className="min-w-0">{children}</main>
          </div>
        </div>
      </div>
    </UmamiProvider>
  );
}
