import { redirect } from 'next/navigation';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { getArtist } from '@/lib/api/artists';
import { getBillingEntitlements } from '@/lib/api/billing';
import { getAuthMe, getCurrentArtistId } from '@/lib/api/me';
import { AppShell } from '@/components/layout/AppShell';

interface AppLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Layout de la app protegida (dashboard, settings, onboarding, etc.).
 *
 * Responsabilidades:
 *   1. Auth guard — redirige a /login si no hay sesión válida.
 *   2. Carga datos del artista (el primero de artistIds) para el shell:
 *      - Si el usuario aún no tiene artista (primera vez / en onboarding)
 *        se pasa artist=null y el shell muestra el estado vacío.
 *      - Fallos de red degradan gracefully (artist=null), sin romper la página.
 *   3. Renderiza AppShell con sidebar + topbar responsivos.
 *
 * La redirección a /onboarding (cuando no hay artistas) ocurre en
 * dashboard/page.tsx — no aquí — para evitar interferir con la propia
 * página de onboarding que vive bajo este mismo layout.
 */
export default async function AppLayout({ children, params }: AppLayoutProps) {
  const { locale } = await params;
  const { user, accessToken } = await withAuth();

  // Auth guard: redirigir a login si no hay sesión
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Intentar cargar el artista del usuario para el shell (sidebar/topbar).
  // Errores son silenciosos — la página sigue funcionando sin datos de artista.
  let artist = null;
  let entitlements = null;
  const me = await getAuthMe(accessToken);
  const artistId = getCurrentArtistId(me);
  if (artistId) {
    [artist, entitlements] = await Promise.all([
      getArtist(artistId, accessToken),
      getBillingEntitlements(artistId, accessToken).catch(() => null),
    ]);
  }

  return (
    <AppShell artist={artist} entitlements={entitlements}>
      {children}
    </AppShell>
  );
}
