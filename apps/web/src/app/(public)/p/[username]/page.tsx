import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolvePreferredLocale } from '@/lib/detect-locale';

interface LegacyArtistPageProps {
  params: Promise<{ username: string }>;
}

export default async function LegacyArtistPage({ params }: LegacyArtistPageProps) {
  const { username } = await params;
  const locale = resolvePreferredLocale({
    acceptLanguage: (await headers()).get('accept-language'),
    localeCookie: (await cookies()).get('NEXT_LOCALE')?.value ?? null,
  });

  redirect(`/${locale}/${username}`);
}
