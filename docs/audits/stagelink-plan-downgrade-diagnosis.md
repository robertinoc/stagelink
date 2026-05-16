# StageLink Billing — Unexpected Plan Downgrade Diagnosis

**Date:** 2026-05-16
**Phase:** Fase 0 — Diagnosis
**Status:** Complete (diagnosis only — no fixes implemented)
**Affected user:** `robertinoc` (manually set to `pro_plus`, unexpectedly reverted to `free`)

---

## 1. Summary of Findings

The downgrade is caused by `reconcileSubscriptionFromStripe()` in `billing.service.ts`. When this function finds no active Stripe subscription for an artist, it **unconditionally writes `plan: 'free', status: 'inactive'` to the DB** — with no guard for artists whose plan was set manually and has no Stripe backing. For `robertinoc`, this function was triggered by the "Refresh" button (or a Stripe portal return redirect), Stripe returned zero subscriptions (as expected, since there is no real subscription), and the plan was silently overwritten.

---

## 2. Relevant Files Inspected

- `apps/api/src/modules/billing/billing.service.ts` — root cause
- `apps/api/src/modules/billing/billing.controller.ts` — which endpoints call reconcile
- `apps/web/src/app/[locale]/(app)/dashboard/billing/page.tsx` — when the frontend triggers refresh
- `apps/web/src/app/[locale]/(app)/dashboard/billing/actions.ts` — `refreshBillingStatusAction`
- `apps/web/src/lib/api/billing.ts` — `refreshBillingStatus()` API call

---

## 3. Code Path That Caused the Downgrade

### Step 1 — Trigger

`POST /api/billing/:artistId/refresh` (controller line 65–67) calls:

```typescript
async refreshSubscriptionState(artistId: string) {
  const subscription = await this.ensureSubscriptionRecord(artistId);
  await this.reconcileSubscriptionFromStripe(artistId, subscription);
  return this.getBillingSummary(artistId);
}
```

This is called when:

- The user clicks the manual "Refresh billing status" button on the billing page.
- The user returns from the Stripe Customer Portal (`?portal=returned` query param → billing page auto-invokes `refreshBillingStatusAction`).

### Step 2 — Stripe query returns nothing

`reconcileSubscriptionFromStripe()` (lines 779–839):

```typescript
if (subscription.stripeCustomerId) {
  const subscriptions = await stripe.subscriptions.list({
    customer: subscription.stripeCustomerId,
    status: 'all',
    limit: 10,
  });
  stripeSubscription = this.selectMostRelevantStripeSubscription(subscriptions?.data ?? []);
}

if (!stripeSubscription && subscription.stripeSubscriptionId) {
  stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);
}
```

For `robertinoc`:

- If `stripeCustomerId` is null → first block skipped.
- If `stripeSubscriptionId` is also null → second block skipped.
- `stripeSubscription` remains `null`.

OR if `stripeCustomerId` was set (from a past checkout session initiation) but never completed:

- First block runs → Stripe returns `[]` → `stripeSubscription = null`.

Either path leads to the same outcome.

### Step 3 — Unconditional overwrite (line 801–813)

```typescript
if (!stripeSubscription) {
  return this.prisma.subscription.update({
    where: { artistId },
    data: {
      plan: PlanTier.free, // ← always 'free', no guard
      status: SubscriptionStatus.inactive,
      stripeSubscriptionId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      lastStripeEventAt: new Date(),
    },
  });
}
```

There is **no check** for whether the current plan was manually set. If Stripe knows nothing about this artist, the plan is reset to `free`. This is the bug.

---

## 4. Root Cause

| Cause                                                                                                                                  | Location                                 | Impact                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| `reconcileSubscriptionFromStripe()` overwrites `plan='free'` when Stripe returns no subscription, with no guard for manually-set plans | `billing.service.ts:801–813`             | Critical — silently destroys any manual plan assignment                    |
| `refreshSubscriptionState` is triggered automatically on Stripe portal return                                                          | `billing/page.tsx:206` + `actions.ts:92` | Medium — makes the bug easy to hit accidentally                            |
| No `manualOverride` or `stripeLinked` flag on the subscription model                                                                   | DB schema                                | Medium — no way to distinguish manually-set plans from abandoned checkouts |

---

## 5. How to Reproduce

1. Manually set an artist's plan to `pro_plus` in the DB (no Stripe customer ID, no subscription ID).
2. Have the artist open their billing page and click "Refresh billing status".
3. Plan is immediately reset to `free`.

Also reproducible if:

- Artist started a checkout (gets a Stripe customer ID) but never completed it.
- Artist then opens the Customer Portal and returns.
- Same outcome.

---

## 6. Recommended Fix

### Option A — Skip reconcile when no Stripe link exists (minimal, safe)

In `reconcileSubscriptionFromStripe()`, add a guard before the unconditional overwrite:

```typescript
if (!stripeSubscription) {
  // No Stripe link exists — plan was set manually. Don't overwrite.
  if (!subscription.stripeCustomerId && !subscription.stripeSubscriptionId) {
    return subscription;
  }
  // We queried Stripe and found nothing — legitimate downgrade.
  return this.prisma.subscription.update({
    where: { artistId },
    data: {
      plan: PlanTier.free,
      status: SubscriptionStatus.inactive,
      stripeSubscriptionId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      lastStripeEventAt: new Date(),
    },
  });
}
```

**Effort:** 5 lines. **Risk:** None — only skips overwrite when both IDs are null.

### Option B — Add `manualPlanOverride` flag to subscription model (robust)

Add a boolean column `manualPlanOverride` to the `subscriptions` table. When set, `reconcileSubscriptionFromStripe()` returns early entirely. Requires a Prisma migration and schema change.

**Effort:** Medium. **Benefit:** Explicit and queryable.

### Recommendation

**Implement Option A immediately** as a hotfix to stop the damage. Option B can follow as a proper feature for admin-set plans.

---

## 7. Immediate Recovery Steps

1. Re-set `robertinoc`'s subscription in the DB: `UPDATE subscriptions SET plan = 'pro_plus', status = 'active' WHERE "artistId" = '<id>';`
2. Apply the Option A guard so the next "Refresh" click doesn't revert it again.
3. Audit the `subscriptions` table for any other artists whose plan was manually set and may have been downgraded by this path.

---

## 8. Priority Order for Fix

| Priority | Fix                                                                                           | Effort | Impact           |
| -------- | --------------------------------------------------------------------------------------------- | ------ | ---------------- |
| 1        | Add `!stripeCustomerId && !stripeSubscriptionId` guard in `reconcileSubscriptionFromStripe()` | Low    | Critical         |
| 2        | Restore `robertinoc` plan to `pro_plus` in DB                                                 | Low    | Immediate        |
| 3        | Audit other manually-set subscriptions in production                                          | Low    | Medium           |
| 4        | Consider `manualPlanOverride` flag for explicit admin-set plans                               | Medium | High (long-term) |

---

## 9. Specific File to Change

- **`apps/api/src/modules/billing/billing.service.ts`** — add guard at line 801 (before the unconditional `plan: 'free'` update)

---

## Checklist

- [x] Downgrade trigger identified (reconcile called via refresh endpoint)
- [x] Code path traced from controller to DB write
- [x] Specific line with the bug identified (line 801–813)
- [x] Conditions under which the bug fires documented
- [x] Fix options evaluated
- [x] Recommended fix written out (Option A)
- [x] Recovery steps documented
- [x] No implementation changes made during diagnosis
