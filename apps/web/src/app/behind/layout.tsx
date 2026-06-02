import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { hasBehindAccess } from '@/lib/behind-redis';
import { AdminShell } from './AdminShell';

interface BehindLayoutProps {
  children: React.ReactNode;
}

export default async function BehindLayout({ children }: BehindLayoutProps) {
  const session = await getSession();

  // Not authenticated → dedicated sign-in route (no query params → avoids Vercel WAF).
  // Redirect to the main domain so the PKCE cookie and callback share the same origin.
  if (!session) {
    const redirectUri = process.env.WORKOS_REDIRECT_URI;
    const mainOrigin = redirectUri ? new URL(redirectUri).origin : '';
    redirect(`${mainOrigin}/api/auth/behind-signin`);
  }

  // Authenticated but no behind access → silent redirect (avoids confirming this path exists).
  if (!(await hasBehindAccess(session.user.email))) {
    redirect('/');
  }

  return <AdminShell email={session.user.email}>{children}</AdminShell>;
}
