# Stripe Billing Foundation

## Scope

T5-1 implements the production-oriented billing foundation for StageLink:

- Stripe-backed subscription checkout
- Stripe Customer Portal access
- Verified webhook processing
- Minimal internal subscription persistence
- Artist/tenant-scoped billing ownership
- Clean base for T5-2 feature gating

Out of scope for this phase:

- Fine-grained feature gating
- Sophisticated pricing UX
- Trials, taxes, metered billing, invoicing customization
- Enterprise billing flows
- Advanced dunning or proration UX

## Payer Entity Decision

StageLink treats the **artist/tenant** as the billing subject.

Why:

- Feature gating later applies to the published artist space, not to an abstract user record.
- A user can conceptually belong to multiple artists over time.
- The tenant is the product unit that owns pages, blocks, analytics, branding, and future paid features.

Current billing source of truth in our DB is the `subscriptions` row keyed by `artist_id`.

## Internal Data Model

### `subscriptions`

Source: `apps/api/prisma/schema.prisma`

Persisted fields:

- `artist_id`
- `stripe_customer_id`
- `stripe_subscription_id`
- `stripe_price_id`
- `plan`
- `status`
- `current_period_end`
- `cancel_at_period_end`
- `updated_at`

This is the operational state used by the app.
Stripe remains the external source of truth; our DB stores the minimum required projection for product behavior.

Important semantic:

- `free` is not treated as an active Stripe subscription
- free/internal baseline rows default to `status = inactive`
- paid access decisions later should not treat `status = active` in isolation without plan context

### `stripe_webhook_events`

Purpose: idempotency by `stripe_event_id`.

Persisted fields:

- `stripe_event_id`
- `stripe_event_type`
- `artist_id`
- `processed_at`

This prevents blind reprocessing of duplicated webhook deliveries.

## Plan Mapping

Internal plan codes:

- `free`
- `pro`
- `pro_plus`

Stripe price IDs are configured per environment, not accepted from the client:

- `STRIPE_PRICE_PRO_ID`
- `STRIPE_PRICE_PRO_PLUS_ID`

Policy:

- The client sends internal `plan`.
- The backend resolves the allowed Stripe `price_id`.
- Arbitrary client-provided Stripe price IDs are rejected by design.

`free` is an internal plan only. It does not create a Stripe Checkout session.

## Environment Configuration

Required backend variables:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_ID`
- `STRIPE_PRICE_PRO_PLUS_ID`
- `FRONTEND_URL`

Supporting app variables:

- `APP_ENV`
- `APP_URL`
- `CORS_ALLOWED_ORIGINS`

Recommended environment policy:

- Sandbox/staging: use Stripe test mode keys and test-mode price IDs
- Production: use live keys and live price IDs
- Never reuse live IDs in sandbox or test IDs in production

Price mapping should be documented in deployment config per environment, for example:

- staging: `STRIPE_PRICE_PRO_ID=price_test_xxx`
- staging: `STRIPE_PRICE_PRO_PLUS_ID=price_test_yyy`
- production: `STRIPE_PRICE_PRO_ID=price_live_xxx`
- production: `STRIPE_PRICE_PRO_PLUS_ID=price_live_yyy`

## Source of Truth Policy

Billing synchronization policy:

1. Frontend only starts flows.
2. Backend creates Checkout or Portal sessions.
3. Stripe owns payment/subscription execution.
4. Webhooks update internal subscription state.
5. StageLink uses internal persisted subscription state for product behavior.
6. Redirect query params are UX hints only, never authoritative billing confirmation.

## Checkout Flow

1. Authenticated user opens dashboard billing.
2. User chooses an internal plan (`pro` or `pro_plus`).
3. Frontend posts to `POST /api/billing/:artistId/checkout`.
4. Backend validates auth plus artist ownership.
5. Backend resolves internal `plan` to configured Stripe `price_id`.
6. Backend creates or reuses the Stripe customer for that artist.
7. Backend creates Stripe Checkout Session in `subscription` mode.
8. Frontend redirects to Stripe Checkout.
9. Stripe redirects the user back to StageLink billing.
10. Real subscription state is synchronized through webhooks.

### Checkout metadata

We write small, reconciliation-focused metadata:

- `artistId`
- `plan`
- `username`
- `initiatingUserId`
- `environment`

Metadata lives on:

- Checkout Session `metadata`
- `subscription_data.metadata`
- Stripe Customer `metadata`

This is enough to reconcile the tenant and actor without leaking secrets or sending oversized payloads.

## Customer Portal Flow

1. Authenticated user clicks "Open billing portal".
2. Frontend posts to `POST /api/billing/:artistId/portal`.
3. Backend validates auth plus ownership.
4. Backend loads the artist-scoped `stripe_customer_id`.
5. Backend creates a Stripe Billing Portal session.
6. Frontend redirects to Stripe.
7. User returns to the billing page.
8. Subscription state remains synchronized by webhooks.

## Webhook Strategy

Endpoint:

- `POST /api/billing/webhook`

Properties:

- Public route
- Stripe signature verification enabled
- Requires raw body
- Uses `stripe_event_id` persistence for idempotency
- Uses subscription upserts as a second safety layer

Currently processed events:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Current ignore policy:

- Any other Stripe event is acknowledged but ignored
- We process only events that materially affect subscription state or its reconciliation

### Why these events

- `checkout.session.completed` links the completed hosted flow back to the artist/customer/subscription identifiers
- `customer.subscription.*` is the main subscription state stream
- We intentionally do not process `invoice.*` yet because T5-1 does not need invoice-level state transitions and subscription events are a safer source for the current projection

## Idempotency and Retries

Primary strategy:

- Process each webhook inside a DB transaction
- Insert one row in `stripe_webhook_events` per `event.id`
- Apply the subscription mutation in the same transaction
- If the unique constraint already exists, skip processing as duplicate

Secondary strategy:

- Subscription writes use `upsert`
- This keeps writes safe under normal retry conditions

Tradeoffs:

- This is intentionally minimal
- It prevents duplicate processing and avoids the failure mode where an event is marked processed before the subscription mutation commits
- It still does not attempt complex cross-event ordering logic beyond "the accepted subscription event rewrites the current projection"
- If Stripe delivers unusual out-of-order historical events, `customer.subscription.updated/deleted` remains the meaningful steady-state stream we expect to win

## Internal Subscription States

Internal states currently stored:

- `inactive`
- `active`
- `trialing`
- `past_due`
- `canceled`
- `incomplete`

Current mapping:

- Free/no-Stripe-subscription baseline -> `inactive`
- Stripe `paused` -> `inactive`
- Stripe `active` -> `active`
- Stripe `trialing` -> `trialing`
- Stripe `past_due`, `unpaid` -> `past_due`
- Stripe `canceled` -> `canceled`
- Stripe `incomplete`, `incomplete_expired` -> `incomplete`

This is sufficient for T5-2 plan and access decisions later.

## Frontend Behavior

Minimal billing UX lives in dashboard billing:

- Shows current internal plan and status
- Allows starting Checkout for paid plans
- Allows opening Stripe Billing Portal
- Shows "success", "canceled", or generic error messages on return

Important:

- These messages are informational only
- The page always reads the real backend subscription state
- Checkout creation does not optimistically upgrade the local plan anymore

## Return URLs

Current behavior:

- Frontend derives the authenticated billing page URL and passes it to the backend
- Backend validates the origin against `FRONTEND_URL` plus allowed origins
- Checkout success and cancel both return to dashboard billing with a lightweight query hint
- Portal returns to the same billing page

Why:

- Users return to a private route that can immediately query real subscription state
- We avoid treating redirect params as authoritative payment state

## Security Notes

Implemented protections:

- Auth required for Checkout and Portal
- Ownership required on artist-scoped billing routes
- No arbitrary client-provided Stripe price IDs
- Webhook signature verification
- No Stripe secret exposed to the frontend
- Artist-scoped customer portal access only
- Minimal metadata only

Known limits of this phase:

- No alerting pipeline yet for failed webhook processing
- No advanced ordering strategy beyond idempotent event registration plus state upsert
- No separate billing account abstraction yet because it is unnecessary for current StageLink scope

## Connection to T5-2

For future feature gating, the authoritative product-side lookup should be:

- `subscriptions.plan`
- `subscriptions.status`
- `subscriptions.cancel_at_period_end`
- `subscriptions.current_period_end`

T5-2 should not query Stripe directly for gating decisions in normal request paths.
It should use the internal subscription projection updated by webhooks.

## Validation Checklist

Local:

- `pnpm --filter @stagelink/api exec prisma generate`
- `pnpm --filter @stagelink/api typecheck`
- `pnpm --filter @stagelink/api test`
- `pnpm --filter @stagelink/api build`
- `pnpm --filter @stagelink/web typecheck`
- `pnpm --filter @stagelink/web build`

Stripe sandbox manual QA:

1. Configure test keys and test price IDs.
2. Start Checkout for `pro`.
3. Complete payment with Stripe test card.
4. Confirm `subscriptions` row updates through webhook delivery.
5. Open Customer Portal.
6. Cancel or modify subscription from Stripe.
7. Confirm webhook retries do not duplicate processing.
8. Confirm billing page reflects the persisted internal state after each change.
