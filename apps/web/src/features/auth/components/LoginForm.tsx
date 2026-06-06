'use client';

import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { trackPlatformFunnelEvent } from '@/lib/analytics/track';
import { ANALYTICS_EVENTS } from '@stagelink/types';
import Link from 'next/link';

interface LoginFormProps {
  /**
   * Localized route that starts WorkOS and redirects to the hosted auth UI.
   * Keeping this outside /api keeps the raw API URL out of the address bar,
   * while still using a Route Handler for reliable PKCE cookie writes on PWA
   * mobile launches.
   */
  action: string;
  locale: string;
  /**
   * Optional error message to display above the submit button.
   * Set by login/page.tsx when the callback redirects back with ?error=auth_failed
   * (e.g. PKCE mismatch, missing state cookie, code-exchange failure).
   */
  errorMessage?: string;
}

/**
 * SubmitButton must be a child of the <form> so useFormStatus can read
 * the pending state of the parent form's Server Action.
 */
function SubmitButton({ label, locale }: { label: string; locale: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full"
      disabled={pending}
      aria-disabled={pending}
      onClick={() =>
        trackPlatformFunnelEvent(ANALYTICS_EVENTS.AUTH_LOGIN_STARTED, {
          locale,
          surface: 'login',
        })
      }
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}

/**
 * LoginForm — formulario de autenticación con WorkOS AuthKit.
 *
 * No maneja credenciales directamente. La autenticación ocurre en la
 * hosted UI de WorkOS:
 *   1. El formulario envía un POST a /{locale}/login/start (no se muestra /api/*)
 *   2. Ese Route Handler llama a getSignInUrl() y escribe la cookie PKCE
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
        <form action={action} method="post">
          <SubmitButton label={t('submit')} locale={locale} />
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        {t('no_account')}&nbsp;
        <Link
          href={`/${locale}/signup`}
          className="text-foreground underline-offset-4 hover:underline"
          onClick={() =>
            trackPlatformFunnelEvent(ANALYTICS_EVENTS.AUTH_LOGIN_SIGNUP_CLICKED, {
              locale,
              surface: 'login',
            })
          }
        >
          {t('signup_link')}
        </Link>
      </CardFooter>
    </Card>
  );
}
