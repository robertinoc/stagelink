'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import {
  createBillingCheckoutSession,
  createBillingPortalSession,
  type BillingPlan,
  refreshBillingStatus,
} from '@/lib/api/billing';

function buildReturnUrl(locale: string, headerStore: Headers): string {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configuredAppUrl) {
    return new URL(`/${locale}/dashboard/billing`, configuredAppUrl).toString();
  }

  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host');
  const protocol =
    headerStore.get('x-forwarded-proto') ?? (host?.includes('localhost') ? 'http' : 'https');

  if (host) {
    return `${protocol}://${host}/${locale}/dashboard/billing`;
  }

  return `http://localhost:4000/${locale}/dashboard/billing`;
}

function buildErrorUrl(returnUrl: string, error: 'checkout' | 'portal' | 'refresh'): string {
  const url = new URL(returnUrl);
  url.searchParams.set('error', error);
  return url.toString();
}

export async function startCheckoutAction(formData: FormData) {
  const artistId = String(formData.get('artistId') ?? '');
  const plan = String(formData.get('plan') ?? '') as BillingPlan;
  const locale = String(formData.get('locale') ?? 'en');
  const session = await getSession();
  const returnUrl = buildReturnUrl(locale, await headers());

  if (!session) {
    redirect(`/${locale}/login`);
  }

  let checkout: { url: string };
  try {
    checkout = await createBillingCheckoutSession(
      artistId,
      { plan, returnUrl },
      session.accessToken,
    );
  } catch {
    redirect(buildErrorUrl(returnUrl, 'checkout'));
  }

  redirect(checkout.url);
}

export async function startPortalAction(formData: FormData) {
  const artistId = String(formData.get('artistId') ?? '');
  const locale = String(formData.get('locale') ?? 'en');
  const session = await getSession();
  const returnUrl = buildReturnUrl(locale, await headers());

  if (!session) {
    redirect(`/${locale}/login`);
  }

  let portal: { url: string };
  try {
    portal = await createBillingPortalSession(artistId, { returnUrl }, session.accessToken);
  } catch {
    redirect(buildErrorUrl(returnUrl, 'portal'));
  }

  redirect(portal.url);
}

export async function refreshBillingStatusAction(formData: FormData) {
  const artistId = String(formData.get('artistId') ?? '');
  const locale = String(formData.get('locale') ?? 'en');
  const session = await getSession();
  const returnUrl = buildReturnUrl(locale, await headers());

  if (!session) {
    redirect(`/${locale}/login`);
  }

  try {
    await refreshBillingStatus(artistId, session.accessToken);
  } catch {
    redirect(buildErrorUrl(returnUrl, 'refresh'));
  }

  redirect(new URL(`?refresh=done`, returnUrl).toString());
}
