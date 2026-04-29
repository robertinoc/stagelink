'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

interface LoginFormProps {
  /**
   * Server Action that calls getSignInUrl() and redirects to WorkOS.
   * Using a Server Action (instead of a plain href to /api/auth/signin) keeps
   * the raw API URL out of the address bar, which prevents Chrome SafeBrowsing
   * from flagging the page as a dangerous credential-harvesting endpoint.
   */
  action: () => Promise<void>;
  locale: string;
  /**
   * Optional error message to display above the submit button.
   * Set by login/page.tsx when the callback redirects back with ?error=auth_failed
   * (e.g. PKCE mismatch, missing state cookie, code-exchange failure).
   */
  errorMessage?: string;
}

/**
 * LoginForm — formulario de autenticación con WorkOS AuthKit.
 *
 * No maneja credenciales directamente. La autenticación ocurre en la
 * hosted UI de WorkOS:
 *   1. El formulario envía un POST al Server Action (no se muestra /api/* en la barra)
 *   2. El Server Action llama a getSignInUrl() (requiere cookie — solo permitido
 *      en Route Handlers y Server Actions en Next.js 15)
 *   3. Next.js redirige al usuario a la URL de WorkOS (https://authkit.workos.com/...)
 *   4. WorkOS autentica al usuario y redirige a /api/auth/callback
 *   5. El callback handler crea la sesión y redirige al dashboard
 */
export function LoginForm({ action, locale, errorMessage }: LoginFormProps) {
  const t = useTranslations('auth.login');

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {errorMessage && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {errorMessage}
          </div>
        )}
        <form action={action}>
          <Button type="submit" className="w-full">
            {t('submit')}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        {t('no_account')}&nbsp;
        <Link
          href={`/${locale}/signup`}
          className="text-foreground underline-offset-4 hover:underline"
        >
          {t('signup_link')}
        </Link>
      </CardFooter>
    </Card>
  );
}
