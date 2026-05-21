import { describe, expect, it } from 'vitest';
import {
  defaultUsageForPlan,
  resolvePlanLabel,
  resolveTabId,
  SETTINGS_TAB_IDS,
} from '@/features/dashboard/settings/settings-types';

describe('resolveTabId', () => {
  it('falls back to "plan" when the query param is missing', () => {
    expect(resolveTabId(undefined)).toBe('plan');
  });

  it('falls back to "plan" when the query param is unknown', () => {
    expect(resolveTabId('analytics')).toBe('plan');
  });

  it('accepts every declared tab id', () => {
    for (const id of SETTINGS_TAB_IDS) {
      expect(resolveTabId(id)).toBe(id);
    }
  });

  it('takes the first entry when given an array (Next.js behaviour for repeated params)', () => {
    expect(resolveTabId(['connections', 'plan'])).toBe('connections');
  });
});

describe('resolvePlanLabel', () => {
  it('maps plan codes to their display labels', () => {
    expect(resolvePlanLabel('free')).toBe('Free');
    expect(resolvePlanLabel('pro')).toBe('Pro');
    expect(resolvePlanLabel('pro_plus')).toBe('Pro+');
  });
});

describe('defaultUsageForPlan', () => {
  it('returns unlimited Smart Links + unlimited languages on pro_plus', () => {
    const usage = defaultUsageForPlan('pro_plus');
    expect(usage.smartLinkResolutions.max).toBeNull();
    expect(usage.activeLanguages.max).toBeNull();
    expect(usage.artistPages.max).toBe(3);
    expect(usage.storageMb.max).toBe(2048);
  });

  it('returns unlimited Smart Links + capped languages on pro', () => {
    const usage = defaultUsageForPlan('pro');
    expect(usage.smartLinkResolutions.max).toBeNull();
    expect(usage.activeLanguages.max).toBe(1);
    expect(usage.artistPages.max).toBe(3);
  });

  it('returns bounded everything on free', () => {
    const usage = defaultUsageForPlan('free');
    expect(usage.smartLinkResolutions.max).toBe(50);
    expect(usage.artistPages.max).toBe(1);
    expect(usage.storageMb.max).toBe(256);
  });
});
