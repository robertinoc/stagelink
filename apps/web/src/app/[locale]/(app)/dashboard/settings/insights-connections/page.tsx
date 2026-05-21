import { redirect } from 'next/navigation';

/**
 * Legacy route preserved as a 301 redirect to /dashboard/settings?tab=connections.
 * The standalone settings sub-pages were collapsed into a single tabbed
 * page; we keep this stub so bookmarks, sidebar links, and email CTAs
 * continue to land on the right surface.
 */
export default async function LegacySettingsRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/settings?tab=connections`);
}
