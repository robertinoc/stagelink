# StageLink - Security Audit E2.10: Webhooks Security

Status: completed with fixes and launch follow-ups
Last checked: 2026-05-13

## Scope

This audit closes:

- T2.10.1 - Stripe webhooks;
- T2.10.2 - Shopify/future webhooks;
- T2.10.3 - signature verification;
- T2.10.4 - replay/idempotency;
- T2.10.5 - error leakage.

Reviewed surfaces:

- `POST /api/billing/webhook`;
- Stripe billing service webhook handlers;
- Prisma `StripeWebhookEvent` idempotency table;
- API bootstrap raw-body configuration;
- Shopify integration notes and future webhook posture.

## Summary

| Area                    | Status               | Notes                                                                                                                   |
| ----------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Stripe webhooks         | Closed with fix      | Signature verification already existed; now uses explicit 5-minute replay tolerance and generic invalid-signature logs. |
| Shopify/future webhooks | Closed with decision | StageLink has no Shopify inbound webhooks today. Future hooks must reuse the signed raw-body/idempotency baseline.      |
| Signature verification  | Closed with tests    | Missing signature, missing raw body and invalid signatures reject before DB writes.                                     |
| Replay/idempotency      | Closed with tests    | Processed Stripe event ids are unique; stale out-of-order events do not overwrite newer subscription state.             |
| Error leakage           | Closed with fix      | Invalid signature responses stay generic and logs no longer include Stripe signature-parser detail.                     |

## T2.10.1 - Stripe Webhooks

Current production webhook:

- `POST /api/billing/webhook`;
- marked `@Public()` because Stripe cannot send WorkOS user auth;
- protected by Stripe signature verification against `STRIPE_WEBHOOK_SECRET`;
- uses Nest `rawBody: true`, required by Stripe signature validation;
- supported event types:
  - `checkout.session.completed`;
  - `invoice.paid`;
  - `invoice.payment_succeeded`;
  - `customer.subscription.created`;
  - `customer.subscription.updated`;
  - `customer.subscription.deleted`.

Unsupported event types are acknowledged but do not write
`stripe_webhook_events` or mutate subscriptions.

## T2.10.2 - Shopify / Future Webhooks

StageLink currently uses Shopify Storefront reads/configuration only. There are
no inbound Shopify webhooks in production.

Required baseline before adding Shopify or other inbound webhooks:

- endpoint remains unauthenticated only if the provider requires it;
- raw-body signature verification before parsing/trusting payload;
- explicit timestamp/replay tolerance when provider supports it;
- durable idempotency by provider event id;
- minimal event allowlist;
- generic public errors; detailed investigation through server logs only;
- tests for missing signature, invalid signature, duplicate event, stale/replay
  event and provider retry behavior.

## T2.10.3 - Signature Verification

Fix applied:

- Stripe `constructEvent()` now receives an explicit
  `STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300` replay window.
- Invalid signature logging is generic. This avoids logging attacker-controlled
  signature parser details while still surfacing the rejection.

Tests added:

- valid signature calls Stripe SDK with raw body, secret and explicit tolerance;
- missing signature rejects before Stripe parsing/DB transaction;
- missing raw body rejects before Stripe parsing/DB transaction;
- invalid signature rejects before any idempotency or subscription write.

## T2.10.4 - Replay / Idempotency

Existing controls confirmed:

- `stripe_webhook_events.stripe_event_id` is unique;
- webhook processing inserts the Stripe event id inside the same transaction as
  the subscription mutation;
- duplicate event ids are skipped without mutating subscription state;
- stale events are recorded but do not overwrite a newer
  `subscriptions.last_stripe_event_at`;
- invoice-backed events fetch the Stripe subscription before recording the
  event, so lookup failures can be retried by Stripe.

This means duplicate deliveries are safe, old deliveries are ignored, and
transient failures still produce non-2xx responses so Stripe can retry.

## T2.10.5 - Error Leakage

Closed:

- invalid signatures return a generic `Invalid Stripe webhook signature`;
- Stripe parser details are not emitted to client responses;
- the service no longer logs raw parser error messages for invalid signatures.

Residual operational note:

- server logs should still be monitored for repeated invalid-signature warnings,
  because they can indicate webhook secret mismatch or automated probing.

## Files Changed

- `apps/api/src/modules/billing/billing.service.ts`
- `apps/api/src/modules/billing/billing.service.spec.ts`
- `docs/security-audit-e2-webhooks-security.md`
- `CLAUDE.md`

## Residual Backlog

| Priority | Item                                                                                                                             | Target                |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| P1       | Confirm `STRIPE_WEBHOOK_SECRET` is environment-specific and stored as sensitive in Railway before public launch.                 | T7-8 launch checklist |
| P2       | Add alerting for repeated invalid Stripe signatures and repeated Stripe retry failures.                                          | E2.15 monitoring      |
| P2       | If Shopify inbound webhooks are added, create a separate `shopify_webhook_events` idempotency table and signed raw-body handler. | Shopify V2            |

## Validation

Executed validation:

```bash
pnpm --filter @stagelink/api db:generate
pnpm --filter @stagelink/api exec jest src/modules/billing/billing.service.spec.ts --runInBand
pnpm --filter @stagelink/api typecheck
pnpm security:audit
```
