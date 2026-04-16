import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { detectLocale } from '@/lib/detect-locale';

interface PublicEpkPrintRedirectPageProps {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ download?: string }>;
}

export default async function PublicEpkPrintRedirectPage({
  params,
  searchParams,
}: PublicEpkPrintRedirectPageProps) {
  const { username } = await params;
  const locale = detectLocale((await headers()).get('accept-language') ?? '');
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const suffix = resolvedSearchParams?.download === '1' ? '?download=1' : '';

  redirect(`/${locale}/${username}/epk/print${suffix}`);
}
