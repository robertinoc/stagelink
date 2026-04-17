# Plan Feature Gating

## Scope

T5-2 adds plan-based feature gating on top of the Stripe billing foundation from T5-1.

This phase covers:

- centralized plan and feature definitions
- effective plan resolution from persisted billing state
- backend entitlement checks
- frontend capability reflection and upgrade UX
- a reusable pattern for future premium modules

This phase does not add:

- dynamic admin-configurable entitlements
- usage-based quotas
- billing experiments
- per-seat or enterprise licensing logic

## Source of Truth

T5-1 persists Stripe-derived billing state in `subscriptions` keyed by `artist_id`.
T5-2 reads that projection and resolves the tenant's `effectivePlan`.

The backend remains the real authorization layer.
The frontend consumes entitlements for UX only.

## Payer and Gating Subject

StageLink gates features at the **artist / tenant** level.

Why:

- paid capabilities apply to the published artist space
- future feature gating affects pages, analytics, domains, branding, commerce, and EPK features
- a user account can belong to more than one artist over time

## Shared Model

Shared source of truth lives in `packages/types/src/billing.ts`.

Central definitions:

- `PlanCode`
- `FeatureKey`
- `PLAN_FEATURE_MATRIX`
- `FEATURE_MINIMUM_PLAN`
- `resolveEffectivePlan()`
- `buildTenantEntitlements()`
- `hasFeature()`

This avoids duplicated string literals across API and web.

## Effective Plan Resolution

The effective plan is conservative by design.

See also:

- `docs/billing-state-policy.md`

Rules:

- no subscription row -> `free`
- `plan = free` -> `free`
- `status = active` or `trialing` with paid plan -> keep `pro` or `pro_plus`
- `status = inactive`, `past_due`, `canceled`, `incomplete` -> fallback to `free`
- `cancel_at_period_end = true` does not downgrade access by itself while Stripe still reports `active` or `trialing`

This means feature gating does not trust the raw plan column in isolation.

## Plan Matrix v1

### Free

- no premium features
- branding remains visible
- basic analytics only

### Pro

- `remove_stagelink_branding`
- `custom_domain`
- `epk_builder`

### Pro+

- everything in Pro
- `analytics_pro`
- `multi_language_pages`
- `advanced_fan_insights`
- `shopify_integration`
- `smart_merch`

This matrix is intentionally v1 and should evolve by editing the centralized shared map, not by scattering conditionals through product modules.

## Backend Enforcement

Primary backend service:

- `BillingEntitlementsService`

Responsibilities:

- load tenant billing projection
- resolve effective plan
- build feature availability
- expose `hasFeatureAccess()` and `assertFeatureAccess()`

Semantic lock error:

- HTTP `403`
- `code = FEATURE_NOT_INCLUDED_IN_PLAN`
- includes `feature`, `currentPlan`, and `requiredPlan`

Current real enforcement in T5-2:

- `analytics_pro` is required for the `365d` analytics range on `GET /api/analytics/:artistId/overview`

This is the first production pattern for premium authorization in the backend.

## Frontend Reflection

Frontend reads entitlements from:

- `GET /api/billing/:artistId/entitlements`

Payload includes:

- `effectivePlan`
- `billingPlan`
- `subscriptionStatus`
- `cancelAtPeriodEnd`
- `features`
- `featureKeys`

Current frontend usage:

- app shell shows the tenant plan badge
- analytics page disables the premium `365d` range and shows an upgrade state
- settings page shows included vs locked roadmap capabilities with billing CTA

Frontend does not decide authorization by itself. It mirrors backend state to reduce confusion.

## Relation to T5-1

T5-1 responsibilities:

- Stripe checkout, portal, webhooks
- persisted subscription projection per artist

T5-2 responsibilities:

- resolve `effectivePlan`
- derive entitlements from the persisted subscription projection
- enforce plan checks in product modules

If a user returns from Stripe before webhook sync finishes, entitlements remain conservative until T5-1 writes the new subscription state.

## Adding a New Feature Gate

1. Add the new `FeatureKey` in `packages/types/src/billing.ts`.
2. Set its minimum plan in `FEATURE_MINIMUM_PLAN`.
3. Add it to `PLAN_FEATURE_MATRIX`.
4. Enforce it in the backend module with `assertFeatureAccess(artistId, feature)`.
5. Reflect it in the relevant frontend screen using the entitlements payload.
6. Document the behavior if the feature has plan-specific UX.

## Current Limitations

- only `analytics_pro` has live backend enforcement today because the other premium modules are not implemented yet
- locked roadmap features are reflected in UI and documented, but not enforced until their modules exist
- no dynamic runtime entitlement config exists yet
- no quota or usage-limit logic exists yet

## Recommended Next Steps

- enforce `custom_domain` when the domain module is implemented
- enforce `epk_builder` when EPK CRUD/publish flows ship
- enforce `shopify_integration` when commerce connection endpoints exist
- enforce `smart_merch` for Printful/Printify-backed merch blocks
- add premium analytics breakdown endpoints behind `analytics_pro`
- consider a shared web helper or provider if more dashboard areas need entitlements frequently
