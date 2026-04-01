import { apiFetch } from '@/lib/auth';

export type BillingPlan = 'free' | 'pro' | 'pro_plus';
export type BillingCatalogPlan = BillingPlan | 'enterprise';
export type BillingStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

export interface BillingPlanCatalogItem {
  plan: BillingCatalogPlan;
  available: boolean;
  contactSales?: boolean;
  priceId: string | null;
  amount: number | null;
  currency: string | null;
  interval: string | null;
  productId: string | null;
  productName: string;
  productDescription: string | null;
}

export interface BillingProductsResponse {
  plans: BillingPlanCatalogItem[];
}

export interface BillingSubscriptionResponse {
  plan: BillingPlan;
  status: BillingStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  portalAvailable: boolean;
}

interface WrappedResponse<T> {
  data: T;
}

async function readJsonOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const message = Array.isArray(err.message) ? err.message.join(', ') : (err.message ?? fallback);
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export async function getBillingProducts(accessToken: string): Promise<BillingProductsResponse> {
  const res = await apiFetch('/api/billing/products', { accessToken });
  const json = await readJsonOrThrow<WrappedResponse<BillingProductsResponse>>(
    res,
    'Failed to load billing products',
  );
  return json.data;
}

export async function getBillingSubscription(
  artistId: string,
  accessToken: string,
): Promise<BillingSubscriptionResponse> {
  const res = await apiFetch(`/api/billing/${artistId}/subscription`, { accessToken });
  const json = await readJsonOrThrow<WrappedResponse<BillingSubscriptionResponse>>(
    res,
    'Failed to load subscription',
  );
  return json.data;
}

export async function createBillingCheckoutSession(
  artistId: string,
  payload: { plan: BillingPlan; returnUrl: string },
  accessToken: string,
): Promise<{ url: string }> {
  const res = await apiFetch(`/api/billing/${artistId}/checkout`, {
    method: 'POST',
    accessToken,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await readJsonOrThrow<WrappedResponse<{ url: string }>>(
    res,
    'Failed to create checkout session',
  );
  return json.data;
}

export async function createBillingPortalSession(
  artistId: string,
  payload: { returnUrl: string },
  accessToken: string,
): Promise<{ url: string }> {
  const res = await apiFetch(`/api/billing/${artistId}/portal`, {
    method: 'POST',
    accessToken,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const json = await readJsonOrThrow<WrappedResponse<{ url: string }>>(
    res,
    'Failed to create billing portal session',
  );
  return json.data;
}
