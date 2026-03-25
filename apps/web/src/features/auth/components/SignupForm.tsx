'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';

export function SignupForm() {
  const t = useTranslations('auth.signup');

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="name">
              {t('name')}
            </label>
            <Input id="name" type="text" placeholder="Your name" autoComplete="name" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              {t('email')}
            </label>
            <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              {t('password')}
            </label>
            <Input id="password" type="password" autoComplete="new-password" />
          </div>
          <Button type="submit" className="w-full">
            {t('submit')}
          </Button>
        </form>
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
