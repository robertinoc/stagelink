'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

interface SignupFormProps {
  /**
   * Server Action that calls getSignInUrl() and redirects to WorkOS.
   * See LoginForm for the full reasoning.
   */
  action: () => Promise<void>;
  locale: string;
}

/**
 * SignupForm — formulario de registro con WorkOS AuthKit.
 *
 * No maneja credenciales directamente. El registro ocurre en la
 * hosted UI de WorkOS:
 *   1. El formulario envía un POST al Server Action (no se muestra /api/* en la barra)
 *   2. El Server Action llama a getSignInUrl() y redirige a WorkOS
 *   3. WorkOS registra al usuario (email/password, social, SSO)
 *   4. WorkOS redirige a /api/auth/callback con el authorization code
 *   5. El callback handler crea la sesión y redirige al dashboard
 *   6. JwtAuthGuard en el backend provisiona el User interno (primer request)
 */
export function SignupForm({ action, locale }: SignupFormProps) {
  const t = useTranslations('auth.signup');

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action}>
          <Button type="submit" className="w-full">
            {t('submit')}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        {t('have_account')}&nbsp;
        <Link
          href={`/${locale}/login`}
          className="text-foreground underline-offset-4 hover:underline"
        >
          {t('login_link')}
        </Link>
      </CardFooter>
    </Card>
  );
}
