'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

interface LoginFormProps {
  /** URL de autorización de WorkOS (generada server-side con getSignInUrl()) */
  signInUrl: string;
  locale: string;
}

/**
 * LoginForm — formulario de autenticación con WorkOS AuthKit.
 *
 * No maneja credenciales directamente. La autenticación ocurre en la
 * hosted UI de WorkOS:
 *   1. El botón redirige a la URL de WorkOS (signInUrl)
 *   2. WorkOS autentica al usuario (email/password, social, SSO)
 *   3. WorkOS redirige a /api/auth/callback con el authorization code
 *   4. El callback handler crea la sesión y redirige al dashboard
 */
export function LoginForm({ signInUrl, locale }: LoginFormProps) {
  const t = useTranslations('auth.login');

  return (
    <Card>
      <CardContent className="pt-6">
        <Button className="w-full" asChild>
          <a href={signInUrl}>{t('submit')}</a>
        </Button>
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
