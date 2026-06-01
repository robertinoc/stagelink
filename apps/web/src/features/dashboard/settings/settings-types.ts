/**
 * Pure types + helpers for the Settings page. Kept separate from
 * `settings-data.ts` (which pulls in server-only auth/Supabase modules)
 * so client code and unit tests can import these without dragging the
 * whole server bundle into the browser / vitest environment.
 */

export type PlanCode = 'free' | 'pro' | 'pro_plus';

export function resolvePlanLabel(plan: PlanCode) {
  switch (plan) {
    case 'pro':
      return 'Pro';
    case 'pro_plus':
      return 'Pro+';
    default:
      return 'Free';
  }
}

export function canUpgradeToPlan(currentPlan: PlanCode, nextPlan: PlanCode) {
  const rank = { free: 0, pro: 1, pro_plus: 2 };
  return rank[nextPlan] > rank[currentPlan];
}

export type SettingsTabId = 'plan' | 'connections' | 'stores' | 'privacy';

export const SETTINGS_TAB_IDS: SettingsTabId[] = ['plan', 'connections', 'stores', 'privacy'];

export function resolveTabId(input: string | string[] | undefined): SettingsTabId {
  const raw = Array.isArray(input) ? input[0] : input;
  if (raw && (SETTINGS_TAB_IDS as readonly string[]).includes(raw)) {
    return raw as SettingsTabId;
  }
  return 'plan';
}

/**
 * Usage panel rows. Only metrics we can populate from REAL artist data are
 * included — no hardcoded placeholders. `max: null` renders as unlimited.
 */
export type UsageRowKey = 'languages' | 'photos';

export interface UsageRowData {
  key: UsageRowKey;
  value: number;
  max: number | null;
}

export interface SettingsUsage {
  rows: UsageRowData[];
}

/** Minimal structural shape of the artist fields the usage panel reads. */
interface UsageArtistInput {
  baseLocale?: string | null;
  galleryImageUrls?: string[] | null;
  // Typed as unknown because ArtistTranslations has no string index signature;
  // we structurally walk it below.
  translations?: unknown;
}

/**
 * Builds usage rows from real artist data:
 * - languages: distinct locales = baseLocale ∪ locales present in any
 *   translation field (multi-language is a Pro+ feature → max 1 below Pro+).
 * - photos: count of gallery images the artist has uploaded.
 *
 * Smart Links resolutions and page counts are intentionally omitted until
 * backed by real backend data — better no row than a misleading placeholder.
 */
export function buildUsage(plan: PlanCode, artist: UsageArtistInput | null): SettingsUsage {
  const rows: UsageRowData[] = [];

  const locales = new Set<string>();
  if (artist?.baseLocale) locales.add(artist.baseLocale);
  const translations = artist?.translations;
  if (translations && typeof translations === 'object') {
    for (const field of Object.values(translations as Record<string, unknown>)) {
      if (field && typeof field === 'object') {
        for (const [loc, val] of Object.entries(field as Record<string, unknown>)) {
          if (typeof val === 'string' && val.trim().length > 0) locales.add(loc);
        }
      }
    }
  }
  rows.push({
    key: 'languages',
    value: Math.max(locales.size, 1),
    max: plan === 'pro_plus' ? null : 1,
  });

  rows.push({
    key: 'photos',
    value: artist?.galleryImageUrls?.length ?? 0,
    max: null,
  });

  return { rows };
}

export interface SettingsInvoice {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending';
  pdfUrl: string | null;
}

export interface SettingsTabBadgeCounts {
  connections: { connected: number; total: number };
  stores: { connected: number; total: number };
}
