import { apiFetch } from '@/lib/auth';
import type {
  BillingUiSummary,
  BillingSubscriptionStatus,
  FeatureKey,
  PlanCode,
  TenantEntitlements,
} from '@stagelink/types';

export type BillingPlan = PlanCode;
export type BillingCatalogPlan = PlanCode | 'enterprise';
export type BillingStatus = BillingSubscriptionStatus;

export interface BillingPlanCatalogItem {
  plan: BillingCatalogPlan;
  available: boolean;
  contactSales?: boolean;
  amount: number | null;
  currency: string | null;
  interval: string | null;
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

export interface BillingEntitlementsResponse extends TenantEntitlements {
  features: Record<FeatureKey, boolean>;
}

export type BillingSummaryResponse = BillingUiSummary;

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

export async function getBillingEntitlements(
  artistId: string,
  accessToken: string,
): Promise<BillingEntitlementsResponse> {
  const res = await apiFetch(`/api/billing/${artistId}/entitlements`, { accessToken });
  const json = await readJsonOrThrow<WrappedResponse<BillingEntitlementsResponse>>(
    res,
    'Failed to load billing entitlements',
  );
  return json.data;
}

export async function getBillingSummary(
  artistId: string,
  accessToken: string,
): Promise<BillingSummaryResponse> {
  const res = await apiFetch(`/api/billing/${artistId}/summary`, { accessToken });
  const json = await readJsonOrThrow<WrappedResponse<BillingSummaryResponse>>(
    res,
    'Failed to load billing summary',
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
