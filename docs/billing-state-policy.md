# Billing State Policy

## Goal

This document makes the current billing-state policy explicit before new premium features ship on top of T5-2 and T5-3.

It defines how StageLink currently interprets Stripe-derived subscription state for:

- effective product access
- user-facing billing UX
- explicit recovery paths when Stripe sync is delayed

## Source of Truth

Billing still has two layers:

1. Stripe + webhook-synced subscription projection in `subscriptions`
2. T5-2 effective plan resolution built from that projection

The backend remains authoritative for feature access.

## Effective access policy

Current policy is intentionally conservative, while still honoring paid access for a subscription
period that Stripe reports as not yet ended:

- `free` plan -> effective access `free`
- paid plan + `active` -> keep paid access
- paid plan + `trialing` -> keep paid access
- paid plan + `past_due` + future `currentPeriodEnd` -> keep paid access until that period ends
- paid plan + `past_due` without a future `currentPeriodEnd` -> downgrade effective access to `free`
- paid plan + `canceled` -> downgrade effective access to `free`
- paid plan + `inactive` / `incomplete` -> downgrade effective access to `free`

This means StageLink does **not** trust the raw billed plan by itself.

## UI state policy

The dashboard can still show a difference between:

- `billingPlan`
- `effectivePlan`

That distinction is intentional and should stay visible to avoid lying about product access.

Current UI mapping:

- `free` -> Free
- `active` -> Active
- `trialing` -> Trialing
- `past_due` -> Payment issue
- `canceling` -> Cancels at period end
- `canceled` -> Canceled
- `syncing` -> Updating

## `cancel_at_period_end`

Policy:

- if Stripe still reports the subscription as `active` or `trialing`
- and `cancel_at_period_end = true`
- StageLink keeps the paid effective plan until the current period actually ends

Why:

- the user already paid for the current cycle
- product access should not disappear early
- billing UI should communicate that cancellation is scheduled, not completed

## `past_due`

Current policy:

- billed plan remains visible
- billing UI shows a payment issue state
- effective product access remains paid only when Stripe still reports a future `currentPeriodEnd`
- once the paid period is missing or elapsed, effective product access falls back to `free`

Why:

- this avoids cutting off users before the paid period Stripe reports as active is over
- it avoids any custom grace period beyond the subscription period StageLink receives from Stripe

## Grace period policy

There is **no custom grace period** implemented yet.

`past_due` can still keep access until `currentPeriodEnd` when Stripe provides a future paid
period. After that date, StageLink downgrades effective access to `free` unless Stripe recovers
the subscription.

If StageLink introduces grace periods later, it should happen with:

- a dedicated product decision
- explicit backend rules
- explicit UX copy
- tests for post-failure recovery and edge cases

## Recovery policy

`GET /billing/:artistId/summary` is now treated as a read path and should stay side-effect free.

If Stripe and the internal subscription projection fall out of sync:

- webhooks remain the primary sync path
- `POST /billing/:artistId/refresh` is the explicit recovery action
- future work can add a background reconciliation worker if needed

This keeps billing reads predictable and easier to reason about as more premium features ship.

## What this prepares for

This policy is the baseline for:

- T5-4 Free plan branding rules
- future `Pro` / `Pro+` premium features
- later discussion of grace periods or delinquency recovery
