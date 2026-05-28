# Audit 360 — S6 Data & Edge Cases

Date: 2026-05-28

Scope:

- T6.1 Empty States
- T6.2 Data Integrity
- T6.3 Downgrade/Upgrade Data Behavior
- T6.4 Draft & Persistence

## Executive Summary

S6 found no blocking data-loss issue in the public page block manager or EPK publish flow, but did
find one persistence gap in the profile editor: profile changes are autosaved with a debounce, yet
same-tab navigation could leave before the debounce or a failed save completed. The section also
found a billing-policy documentation drift around `past_due`: tests and shared billing helpers keep
paid access during a future Stripe `currentPeriodEnd`, while the policy document still described an
immediate downgrade.

## Findings Implemented

### S6-001 — Profile Editor Needed an Unsaved-Changes Guard

Area: T6.4 Draft & Persistence

The EPK editor already protected dirty form state with a browser unload guard and same-tab anchor
navigation confirmation. The profile editor relied on autosave only, leaving a small but real window
where changes could be lost if the user navigated away before the debounce finished or after a save
error.

Implemented:

- Added `useUnsavedChangesGuard`.
- Reused it in `EpkEditorV2`.
- Applied it to `ProfileEditor` while the form is dirty and not actively saving.
- Covered same-tab anchor behavior with unit tests.

### S6-002 — Billing State Policy Drift for `past_due`

Area: T6.3 Downgrade/Upgrade Data Behavior

The implementation and existing API tests grant paid effective access for `past_due` subscriptions
when Stripe still reports a future `currentPeriodEnd`. `docs/billing-state-policy.md` still said all
`past_due` paid subscriptions downgrade immediately to `free`.

Implemented:

- Updated the policy document to match the current source of truth.
- Clarified that StageLink has no custom grace period beyond the Stripe-reported paid period.

## Audit Notes

### T6.1 Empty States

The reviewed app surfaces already contain explicit empty/error/loading states:

- Block manager shows loading, retryable errors, and an empty block list state.
- Functional audit S2 added recoverable auth/error states across dashboard surfaces.
- EPK publish readiness blocks saving/publishing incomplete required content.

No new empty-state implementation was needed in this section.

### T6.2 Data Integrity

Data-integrity support exists through:

- `scripts/data/run-data-integrity.mjs`
- `scripts/data/data-integrity.sql`
- existing billing and entitlement unit coverage

The S6 implementation stayed focused on user-facing persistence and policy drift rather than
expanding database checks.

### T6.3 Downgrade/Upgrade Data Behavior

Current source of truth:

- shared billing helpers in `packages/types/src/billing.ts`
- API entitlement tests in `apps/api/src/modules/billing/billing-entitlements.service.spec.ts`

Important behavior:

- `active` / `trialing` paid subscriptions grant paid access.
- `past_due` grants paid access only while `currentPeriodEnd` is in the future.
- `unpaid`, `canceled`, `inactive`, and `incomplete` resolve to `free`.

### T6.4 Draft & Persistence

The highest-risk persistence gap is now closed for profile and EPK editing. Remaining future work is
to consider richer draft recovery UX for long-form edits, such as local draft restore after repeated
API failures.

## Verification

- Added unit coverage for `useUnsavedChangesGuard`.
- Typecheck/lint/build results are recorded in the PR.
