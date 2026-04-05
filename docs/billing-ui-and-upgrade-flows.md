# Billing UI and Upgrade Flows (T5-3)

## Goal

T5-3 adds a real billing experience inside the private dashboard so authenticated artist owners can:

- see their current plan and subscription state
- understand effective product access vs billed plan
- compare upgrade options
- start Stripe Checkout from the product
- open Stripe Customer Portal from the product
- understand what happened after returning from Stripe

This is intentionally not a public marketing pricing overhaul. The source of truth remains:

- Stripe + webhook-synced subscription projection from T5-1
- effective plan + entitlements from T5-2

## Route structure

Primary route:

- `/[locale]/dashboard/billing`

No extra dashboard billing sub-routes are introduced in T5-3.

## Source of truth for the UI

The dashboard billing screen uses:

- `GET /api/billing/:artistId/summary`

This summary endpoint is the main UI contract. It consolidates:

- billed plan
- effective plan
- subscription status
- current period end
- cancel-at-period-end
- billing UI state
- available plans
- feature highlights
- upgrade options
- webhook sync hint
- portal availability

The frontend does not reconstruct billing state from multiple endpoints anymore.

## Billing summary payload

The summary payload includes:

- `artistId`
- `effectivePlan`
- `billingPlan`
- `subscriptionStatus`
- `currentPeriodEnd`
- `cancelAtPeriodEnd`
- `billingState`
- `availablePlans`
- `entitlements`
- `featureHighlights`
- `upgradeOptions`
- `notes.isWebhookSyncPending`
- `portalAvailable`

## Billing screen structure

The screen is organized as:

1. Billing overview / current plan
2. Available plans
3. Included and locked features
4. Billing actions

This keeps the experience inside the dashboard and avoids a disconnected pricing flow.

## Upgrade flow

1. User clicks an upgrade CTA inside `/dashboard/billing`.
2. Frontend server action posts to `POST /api/billing/:artistId/checkout`.
3. Backend resolves the valid Stripe price for the requested plan.
4. Backend creates Stripe Checkout and returns the hosted URL.
5. Frontend redirects the user to Stripe Checkout.
6. On success or cancel, Stripe redirects back to `/dashboard/billing`.
7. Billing UI re-fetches the real summary from the backend.
8. If webhook sync is still pending, the UI shows a syncing message instead of assuming success.

## Return from Checkout

The checkout return uses query params for UX only:

- `?checkout=success`
- `?checkout=canceled`

These query params never mutate the local billing state by themselves.
They only help select the temporary feedback banner.

The screen always re-reads the real billing summary from backend.
After the banner renders, the billing page cleans these transient params from the URL so the feedback does not keep reappearing on every refresh or when the page URL is shared.

### Success handling

If `checkout=success` and the summary still resolves to a syncing state, the UI shows:

- “Stripe completed your checkout, but StageLink is still confirming the subscription.”

If the webhook already updated state, the UI shows:

- a success confirmation
- the updated billed/effective plan

### Canceled handling

If `checkout=canceled`, the UI shows a non-destructive warning explaining that the current subscription did not change.

## Return from Customer Portal

The portal return URL is normalized by backend to include:

- `?portal=returned`

On return, the billing screen re-reads the summary and shows:

- a refresh/info message if state is already stable
- a syncing message if Stripe changes are still propagating

The UI does not assume that the user changed anything in the portal.

## Syncing / webhook delay policy

T5-3 intentionally uses a simple and honest sync strategy.

There is no long-running polling loop.

Instead:

- the billing route re-fetches summary on page load
- Stripe return query params control banner copy only
- backend summary exposes `notes.isWebhookSyncPending`
- the UI shows a clear syncing state when billing is still being confirmed

### Current syncing heuristic

`billingState = syncing` when:

- the billed plan is paid
- but the subscription status is still conservative (`inactive` / transitional)

This matches the current T5-1 webhook flow, where Checkout completion can arrive before the subscription update webhook finishes syncing the final active state.

### Recovery path

Billing summary is treated as a read path.

If Stripe sync is delayed or a webhook delivery needs help:

- webhook delivery remains the primary source of synchronization
- manual refresh is available as an explicit recovery action
- future work may add a background reconciliation worker if webhook recovery becomes a recurring operational need

See `docs/billing-state-policy.md` for the explicit state policy that now governs `syncing`, `past_due`, cancellation, and recovery.

## UI state mapping

Technical state is mapped to user-facing labels like:

- `free` → Free
- `active` → Active
- `trialing` → Trialing
- `past_due` → Payment issue
- `canceling` → Cancels at period end
- `canceled` → Canceled
- `syncing` → Updating

Billing uses these UI states for badges and messaging, while still showing the raw subscription projection fields that matter.

## Upsell entrypoints

T5-3 introduces a reusable locked-feature upsell component:

- `apps/web/src/components/billing/FeatureLockCta.tsx`

It is currently used in:

- analytics locked state
- settings feature cards

This provides a consistent path back to `/dashboard/billing` from premium gates without making frontend the source of truth for enforcement.

## Relationship with T5-1 and T5-2

### T5-1

Provides:

- Stripe checkout
- Stripe customer portal
- webhook synchronization
- subscription projection in the database

### T5-2

Provides:

- effective plan resolution
- entitlement matrix
- feature gating contracts
- backend authority for locked features

### T5-3

Consumes both layers and exposes them coherently in the dashboard UX.

## Current limitations

- No downgrade wizard is implemented.
- Free-to-paid upgrade is the primary happy path.
- Billing history and invoices remain in Stripe Portal.
- No complex polling strategy exists yet.
- `past_due` follows the explicit conservative policy documented in `docs/billing-state-policy.md`.

## Recommended next steps

1. Expand backend enforcement to each new premium feature as it ships.
2. Revisit grace-period behavior only when product wants to support it explicitly.
3. Add more feature-specific upgrade entrypoints where they help conversion.
4. Consider a more explicit post-checkout refresh strategy only if webhook lag becomes a recurring UX issue.

## Validation checklist

### Local

- `pnpm --filter @stagelink/types build`
- `pnpm --filter @stagelink/api exec prisma generate`
- `pnpm --filter @stagelink/api build`
- `pnpm --filter @stagelink/web build`
- `pnpm --filter @stagelink/api test -- --runInBand src/modules/billing/billing-entitlements.service.spec.ts src/modules/billing/billing.helpers.spec.ts src/modules/billing/billing.service.spec.ts`

### Manual QA

1. Visit `/[locale]/dashboard/billing` as an authenticated artist owner.
2. Confirm current billed plan and effective access are visible.
3. Confirm feature highlights match entitlements.
4. Start a checkout flow and confirm redirect to Stripe.
5. Return from checkout success and verify:
   - summary re-fetches
   - syncing banner appears if webhook is not done yet
   - no false success is shown
6. Return from checkout cancel and verify the warning message.
7. Open Stripe portal and return.
8. Verify manage billing stays available only when a Stripe customer exists.
9. Verify analytics/settings locked CTAs point to `/dashboard/billing`.

### Remote / staging QA

1. Deploy frontend and backend with the same branch or merged `main`.
2. Validate `/[locale]/dashboard/billing` on the real dashboard shell.
3. Start a real Stripe Checkout flow against the staging environment.
4. Confirm the return banner matches:
   - success
   - canceled
   - syncing
5. Open Stripe Customer Portal and return to the app.
6. Verify portal return does not fake subscription success and always re-reads backend state.
7. Trigger at least one premium lock entrypoint (analytics/settings) and confirm it routes back to billing.
