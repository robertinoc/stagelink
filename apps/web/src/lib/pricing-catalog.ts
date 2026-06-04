/**
 * Public pricing catalog fetch for the marketing pricing page.
 *
 * Sources the displayed price from the billing catalog (Stripe-backed) via
 * `GET /api/billing/public/plans` so the marketing page can never drift from the
 * real billing price. Any failure returns an empty map and the page falls back
 * to its static i18n price copy.
 */

export interface PublicPlanCatalogItem {
  plan: string;
  priceDisplay: string;
  available: boolean;
}

/** Builds a `plan → priceDisplay` lookup, ignoring unavailable/blank entries. */
export function buildPriceMap(items: PublicPlanCatalogItem[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of items) {
    if (!item.available) continue;
    const price = item.priceDisplay?.trim();
    if (!price || price === 'Unavailable') continue;
    map[item.plan] = price;
  }
  return map;
}

/**
 * Fetches the public plan catalog and returns a `plan → priceDisplay` map.
 * Never throws — returns `{}` on any failure so the caller can fall back to its
 * static price copy.
 */
export async function fetchPublicPlanPrices(): Promise<Record<string, string>> {
  const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/api/billing/public/plans`, {
      // Prices change rarely; cache for an hour to keep the page cheap.
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};

    const data = (await res.json()) as PublicPlanCatalogItem[];
    if (!Array.isArray(data)) return {};

    return buildPriceMap(data);
  } catch {
    return {};
  }
}
