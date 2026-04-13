import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { detectLocale } from '@/lib/detect-locale';

interface PublicEpkRedirectPageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicEpkRedirectPage({ params }: PublicEpkRedirectPageProps) {
  const { username } = await params;
  const locale = detectLocale((await headers()).get('accept-language') ?? '');

  redirect(`/${locale}/${username}/epk`);
}
