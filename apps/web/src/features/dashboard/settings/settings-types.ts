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

export interface SettingsUsage {
  smartLinkResolutions: { value: number; max: number | null };
  activeLanguages: { value: number; max: number | null };
  artistPages: { value: number; max: number | null };
  storageMb: { value: number; max: number | null };
}

export function defaultUsageForPlan(plan: PlanCode): SettingsUsage {
  if (plan === 'pro_plus') {
    return {
      smartLinkResolutions: { value: 0, max: null },
      activeLanguages: { value: 1, max: null },
      artistPages: { value: 1, max: 3 },
      storageMb: { value: 0, max: 2048 },
    };
  }
  if (plan === 'pro') {
    return {
      smartLinkResolutions: { value: 0, max: null },
      activeLanguages: { value: 1, max: 1 },
      artistPages: { value: 1, max: 3 },
      storageMb: { value: 0, max: 1024 },
    };
  }
  return {
    smartLinkResolutions: { value: 0, max: 50 },
    activeLanguages: { value: 1, max: 1 },
    artistPages: { value: 1, max: 1 },
    storageMb: { value: 0, max: 256 },
  };
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
