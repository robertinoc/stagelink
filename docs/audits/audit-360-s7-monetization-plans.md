# Audit 360 — S7 Monetization & Plans

Date: 2026-05-28

Scope:

- T7.1 Audit Feature Gating
- T7.2 Audit Pricing Logic
- T7.3 Audit Billing Edge Cases

## Executive Summary

S7 found that most new Pro+ modules already had backend feature enforcement, but two monetization
edges still needed hardening:

1. Checkout relied too much on frontend filtering and could still receive same-tier, lower-tier, or
   payment-recovery requests directly at the API.
2. EPK was priced and documented as a Pro feature, but the live EPK editor/public EPK path was not
   consistently gated by the `epk_builder` entitlement.

Both are now fixed with backend checks first, plus dashboard/public UX alignment.

## Findings Implemented

### S7-001 — Checkout Must Only Accept Real Upgrades

Area: T7.2 Pricing Logic, T7.3 Billing Edge Cases

The UI already tried to avoid invalid Stripe checkout attempts, but the API still accepted direct
checkout requests for same-tier or lower-tier paid plans. Payment-issue states could also surface an
upgrade CTA derived from effective access even though recovery should happen through the Stripe
portal.

Implemented:

- Added API-side checkout validation in `BillingService`.
- Reject same-tier and lower-tier checkout attempts for active/trialing paid subscriptions.
- Reject checkout while `past_due`/`unpaid`; users must recover billing through the portal first.
- Changed billing summary recommendations to use checkout-eligible plan state instead of only
  effective access.
- Added billing service tests for invalid checkout and payment-recovery recommendation behavior.

### S7-002 — EPK Builder Needed Real Entitlement Enforcement

Area: T7.1 Feature Gating

Pricing copy and the shared plan matrix place `epk_builder` on Pro and above, but EPK editing and
public EPK rendering were not consistently protected by that entitlement.

Implemented:

- EPK editor reads/writes/publish/template/brand/AI bio generation now require `epk_builder`.
- Public EPK rendering returns not found when the artist no longer has `epk_builder`.
- Dashboard EPK page shows an upgrade CTA instead of loading the editor for locked tenants.
- Public EPK test coverage now verifies entitlement lock behavior.

## Audit Notes

### T7.1 Feature Gating

Backend enforcement now covers:

- `analytics_pro`
- `advanced_fan_insights`
- `stage_link_insights`
- `shopify_integration`
- `smart_merch`
- `multi_language_pages`
- `epk_builder`

Remaining future feature:

- `custom_domain` is still reserved until the domain module ships.

### T7.2 Pricing Logic

Plan pricing still comes from Stripe products/prices in the billing summary, with UI fallback only
for display resilience. Checkout now validates plan movement on the backend so hidden inputs or
manual requests cannot create invalid paid-plan flows.

### T7.3 Billing Edge Cases

Payment issue states (`past_due`, `unpaid`) now point users toward billing portal recovery instead
of checkout. Canceled/inactive subscriptions can still start a new paid checkout.

## Verification

- Billing service tests cover invalid checkout and payment-recovery recommendations.
- Public EPK service tests cover missing entitlement behavior.
- Typecheck/lint/test results are recorded in the PR.
