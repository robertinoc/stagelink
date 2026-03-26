import { redirect } from 'next/navigation';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { Sidebar } from '@/components/layout/Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Layout de la app protegida (dashboard, settings, etc.).
 *
 * Protección server-side:
 *   - Si no hay sesión válida → redirect al login page (preserva locale)
 *   - Si hay sesión → renderiza el layout con datos del usuario
 *
 * El check ocurre en el server antes de renderizar cualquier hijo,
 * por lo que nunca se expone contenido privado a usuarios no autenticados.
 */
export default async function AppLayout({ children, params }: AppLayoutProps) {
  const { locale } = await params;
  const { user } = await withAuth();

  // Redirigir a login si no hay sesión
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar locale={locale} />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex h-14 items-center border-b px-6">
          <div className="ml-auto flex items-center gap-3">
            {/* Avatar con iniciales del usuario */}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold"
              title={displayName}
            >
              {(user.firstName?.charAt(0) ?? user.email.charAt(0)).toUpperCase()}
            </div>
            {/* Logout link — /api/auth/signout es una API route, no una page */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/auth/signout"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Log out
            </a>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
