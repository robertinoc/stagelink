'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

interface SignupFormProps {
  /** URL de sign-up de WorkOS (generada server-side con getSignUpUrl()) */
  signUpUrl: string;
}

/**
 * SignupForm — formulario de registro con WorkOS AuthKit.
 *
 * No maneja credenciales directamente. El registro ocurre en la
 * hosted UI de WorkOS:
 *   1. El botón redirige a la URL de WorkOS (signUpUrl)
 *   2. WorkOS registra al usuario (email/password, social, SSO)
 *   3. WorkOS redirige a /api/auth/callback con el authorization code
 *   4. El callback handler crea la sesión y redirige al dashboard
 *   5. JwtAuthGuard en el backend provisiona el User interno (primer request)
 */
export function SignupForm({ signUpUrl }: SignupFormProps) {
  const t = useTranslations('auth.signup');

  return (
    <Card>
      <CardContent className="pt-6">
        <Button className="w-full" asChild>
          <a href={signUpUrl}>{t('submit')}</a>
        </Button>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        {t('have_account')}&nbsp;
        <Link href="../login" className="text-foreground underline-offset-4 hover:underline">
          {t('login_link')}
        </Link>
      </CardFooter>
    </Card>
  );
}
