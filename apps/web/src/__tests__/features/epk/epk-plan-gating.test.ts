import { describe, it, expect } from 'vitest';
import { PLAN_FEATURE_MATRIX, hasFeature, getMinimumPlanForFeature } from '@stagelink/types';

/**
 * Tests for the EPK plan gating fixes (Issues 3, 4, 9):
 *
 * Issue 3 & 9: multi_language_pages must be enabled for PRO (not just PRO+).
 *   Prior to fix: only pro_plus had multi_language_pages. PRO users could see
 *   the SEO localized content UI but their saves were silently stripped by
 *   useProfileAutosave (which checked hasMultiLanguageAccess).
 *
 * Issue 4: epk_builder must be available on PRO and PRO+ so the AI bio
 *   generator is accessible (the backend assertFeatureAccess gates on it).
 */
describe('PLAN_FEATURE_MATRIX — EPK plan gating', () => {
  // ── multi_language_pages ───────────────────────────────────────────────────

  it('FREE plan does NOT have multi_language_pages', () => {
    expect(PLAN_FEATURE_MATRIX.free).not.toContain('multi_language_pages');
  });

  it('PRO plan has multi_language_pages (Issue 3 & 9 fix)', () => {
    expect(PLAN_FEATURE_MATRIX.pro).toContain('multi_language_pages');
  });

  it('PRO+ plan has multi_language_pages', () => {
    expect(PLAN_FEATURE_MATRIX.pro_plus).toContain('multi_language_pages');
  });

  it('hasFeature("pro", "multi_language_pages") returns true', () => {
    expect(hasFeature('pro', 'multi_language_pages')).toBe(true);
  });

  it('hasFeature("free", "multi_language_pages") returns false', () => {
    expect(hasFeature('free', 'multi_language_pages')).toBe(false);
  });

  it('minimum plan for multi_language_pages is "pro" (not pro_plus)', () => {
    expect(getMinimumPlanForFeature('multi_language_pages')).toBe('pro');
  });

  // ── epk_builder ───────────────────────────────────────────────────────────

  it('FREE plan does NOT have epk_builder', () => {
    expect(PLAN_FEATURE_MATRIX.free).not.toContain('epk_builder');
  });

  it('PRO plan has epk_builder', () => {
    expect(PLAN_FEATURE_MATRIX.pro).toContain('epk_builder');
  });

  it('PRO+ plan has epk_builder', () => {
    expect(PLAN_FEATURE_MATRIX.pro_plus).toContain('epk_builder');
  });

  it('hasFeature("free", "epk_builder") returns false (Issue 4: AI bio must be blocked for FREE)', () => {
    expect(hasFeature('free', 'epk_builder')).toBe(false);
  });

  it('hasFeature("pro", "epk_builder") returns true', () => {
    expect(hasFeature('pro', 'epk_builder')).toBe(true);
  });

  // ── Sanity check: PRO features are a subset of PRO+ ───────────────────────

  it('every PRO feature is also available in PRO+', () => {
    for (const feature of PLAN_FEATURE_MATRIX.pro) {
      expect(
        PLAN_FEATURE_MATRIX.pro_plus,
        `PRO+ should include every PRO feature but is missing "${feature}"`,
      ).toContain(feature);
    }
  });
});
