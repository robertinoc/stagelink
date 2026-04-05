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

Current policy is intentionally conservative:

- `free` plan -> effective access `free`
- paid plan + `active` -> keep paid access
- paid plan + `trialing` -> keep paid access
- paid plan + `past_due` -> downgrade effective access to `free`
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
- effective product access falls back to `free`

Why:

- this is the safest policy for the current product stage
- it avoids implicit grace periods that have not been designed or tested yet

## Grace period policy

There is **no grace period** implemented yet.

That is an explicit product decision for now, not an omission.

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
