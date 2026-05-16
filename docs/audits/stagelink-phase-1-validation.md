# StageLink Phase 1 Validation Report

**Date:** 2026-05-16  
**Commit:** `40942c3` on branch `fix/record-label-logo-cover-url`  
**Validator:** Claude (read-only audit)  
**Final status:** PASS

---

## 1. Summary

Phase 1 (access architecture separation + manual admin grants) is correctly implemented. All 9 check areas pass. Both typechecks are clean. All 331 unit tests pass. No Stripe fields are touched by the manual grant path. One minor note is recorded (see §12).

---

## 2. Files Reviewed

| File                                                                               | Purpose                                                    |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                                                    | Subscription model — 5 manual access fields                |
| `apps/api/prisma/migrations/20260516120000_add_manual_access_fields/migration.sql` | Migration SQL                                              |
| `packages/types/src/billing.ts`                                                    | Interfaces, resolver, `isManualGrantActive`, `PLAN_RANK`   |
| `apps/api/src/modules/admin/admin.service.ts`                                      | `listUsers`, `grantAccess`, `extendAccess`, `revokeAccess` |
| `apps/api/src/modules/admin/admin.controller.ts`                                   | Admin API routes + guards                                  |
| `apps/api/src/modules/admin/dto/grant-access.dto.ts`                               | `GrantAccessDto` + `ExtendAccessDto`                       |
| `apps/web/src/app/behind/UsersTable.tsx`                                           | Behind the Stage UI — access modal, plan display           |
| `apps/web/src/app/behind/page.tsx`                                                 | Page heading                                               |
| `apps/api/src/modules/billing/billing-entitlements.service.ts`                     | `getArtistEntitlements()` with grant elevation             |
| `apps/api/src/modules/billing/billing.service.ts`                                  | `getBillingSummary()`, Stripe handlers                     |

---

## 3. Checks Run and Results

| Check                                    | Result                          |
| ---------------------------------------- | ------------------------------- |
| `pnpm --filter @stagelink/api typecheck` | PASS — zero errors              |
| `pnpm --filter @stagelink/web typecheck` | PASS — zero errors              |
| `pnpm --filter @stagelink/api test`      | PASS — 331/331 tests, 42 suites |

---

## 4. Access Model Validation (Check A)

**Result: PASS**

The `Subscription` model in `schema.prisma` (lines 499–503) has all 5 required manual access fields:

```prisma
manualAccessPlan      PlanTier?         @map("manual_access_plan")
manualAccessStartsAt  DateTime?         @map("manual_access_starts_at")
manualAccessExpiresAt DateTime?         @map("manual_access_expires_at")
manualAccessReason    String?           @map("manual_access_reason")
manualAccessGrantedBy String?           @map("manual_access_granted_by")
```

All are nullable (zero/null means "no grant"). They are placed between `lastStripeEventAt` and `createdAt` and do **not** overlap with `plan`, `status`, or any `stripe_*` column.

The migration SQL (`20260516120000_add_manual_access_fields/migration.sql`) uses `ADD COLUMN IF NOT EXISTS` for all 5 columns — additive and idempotent.

---

## 5. Effective Access Resolver Validation (Check B)

**Result: PASS**

All required exports exist in `packages/types/src/billing.ts`:

- `ManualAccessSnapshot` interface — lines 94–100
- `EffectiveAccessResult` interface — lines 104–114
- `resolveEffectiveAccess(snapshot, manual, now)` — lines 288–318, exported
- `isManualGrantActive(manual, now)` — lines 266–278, exported
- `getPlanRank(plan)` — line 211, uses internal `PLAN_ORDER = ['free', 'pro', 'pro_plus']`

### Scenario Traces (manual code walkthrough)

**Scenario 1: Free + no manual grant → effective Free, source = commercial_plan**

- `resolveEffectivePlan(snapshot)` → `subscriptionGrantsAccess` returns false (plan = 'free') → `'free'`
- `isManualGrantActive(null)` → false (no plan)
- `manualOutranksCommercial` = false
- Result: `effectiveAccess = 'free'`, `accessSource = 'commercial_plan'` ✓

**Scenario 2: Free + active PRO+ grant → effective PRO+, source = manual_admin_grant**

- `resolveEffectivePlan` → `'free'` (inactive/no subscription)
- `isManualGrantActive` → true (plan set, within date window)
- `getPlanRank('pro_plus') > getPlanRank('free')` → `2 > 0` → true
- `manualOutranksCommercial` = true
- Result: `effectiveAccess = 'pro_plus'`, `accessSource = 'manual_admin_grant'` ✓

**Scenario 3: Free + expired PRO+ grant → effective Free, source = commercial_plan**

- `resolveEffectivePlan` → `'free'`
- `isManualGrantActive` → false (expiresAt in the past)
- `manualOutranksCommercial` = false
- Result: `effectiveAccess = 'free'`, `accessSource = 'commercial_plan'` ✓

**Scenario 4: PRO + active PRO+ grant → effective PRO+, source = manual_admin_grant**

- `resolveEffectivePlan` → `'pro'` (active subscription)
- `isManualGrantActive` → true
- `getPlanRank('pro_plus') > getPlanRank('pro')` → `2 > 1` → true
- `manualOutranksCommercial` = true
- Result: `effectiveAccess = 'pro_plus'`, `accessSource = 'manual_admin_grant'` ✓

**Scenario 5: PRO+ + no manual grant → effective PRO+, source = commercial_plan**

- `resolveEffectivePlan` → `'pro_plus'`
- `isManualGrantActive(null)` → false
- `manualOutranksCommercial` = false
- Result: `effectiveAccess = 'pro_plus'`, `accessSource = 'commercial_plan'` ✓

**Scenario 6: Revoked (null plan) → fallback to commercial**

- `isManualGrantActive({ manualAccessPlan: null, ... })` → false (first guard: `!manual.manualAccessPlan`)
- Commercial plan resolution applies normally
- Result: `accessSource = 'commercial_plan'` ✓

**Edge case noted:** If commercial plan is PRO+ and an active manual grant is also PRO+ (`manualOutranksCommercial` = false because `getPlanRank('pro_plus') > getPlanRank('pro_plus')` is false), the source correctly returns `'commercial_plan'`. The grant is not "better" so it doesn't show as the active source. This is correct and intentional.

---

## 6. Behind the Stage UI Validation (Check E)

**Result: PASS**

**`apps/web/src/app/behind/UsersTable.tsx`:**

- `AdminUser` type includes `subscription: ArtistSubscription | null` (line 36) with all manual access fields
- `var(--card)` is **not used** as a background value anywhere in the component. The only occurrence is in a code comment on line 39: `// Shared dark modal panel surface — fixes the near-invisible var(--card) bug.`
- All modal panels use `MODAL_PANEL_STYLE = { backgroundColor: '#1a1030', border: '1px solid rgba(255,255,255,0.12)' }` — a solid dark hex color, confirmed visible
- `AccessCell` component (lines 191–222): displays commercial plan badge in every user row, plus an inline fuchsia "⚡ PRO+ until {date}" indicator when a grant is active, plus "effective: {plan}" when the grant elevates access
- `ManageAccessModal` (lines 970–1342): fully implemented with:
  - Info view showing commercial plan, subscription status, effective access, access source
  - Grant details section when a grant exists (granted plan, expiry, active status, reason)
  - Grant form (plan toggle PRO/PRO+, date picker, reason field)
  - Extend form (new date picker, reason field)
  - Revoke action with inline confirmation

**`apps/web/src/app/behind/page.tsx`:**

- Heading: `"Behind the Stage — Users"` ✓

---

## 7. Admin Grant / Extend / Revoke Validation (Check C + D)

**Result: PASS**

### Admin Service (`admin.service.ts`)

**`listUsers()`:** Uses `ADMIN_USER_SELECT` which includes `artists.subscription` with the full `ADMIN_SUBSCRIPTION_SELECT` (all 5 manual access fields + commercial fields). Calls `resolveEffectiveAccess()` via `mapSubscription()` for each user row. ✓

**`grantAccess()`:**

- Sets all 5 fields via upsert (lines 359–374)
- Defensive guard: `if (plan === PlanTier.free) throw BadRequestException` (line 352)
- Validates expiry is in the future and ≤ 1 year via `parseExpiry()` (lines 324–337)
- Logs audit: `admin.access.grant` with target user, plan, expiry, reason
- Uses `artistId` (UUID) — does NOT touch `plan`, `status`, or Stripe fields ✓

**`extendAccess()`:**

- Validates future date via `parseExpiry()`
- Checks that a grant exists (`manualAccessPlan !== null`) before extending — throws `BadRequestException` otherwise
- Updates only `manualAccessExpiresAt` (and optionally `manualAccessReason`)
- Logs audit: `admin.access.extend` ✓

**`revokeAccess()`:**

- Nulls all 5 `manualAccess*` fields
- Checks subscription exists first — throws `NotFoundException` if not
- Logs audit: `admin.access.revoke`
- Commercial fields (`plan`, `status`, Stripe) completely untouched ✓

### Admin Controller (`admin.controller.ts`)

| Route                                | Guard             | Present |
| ------------------------------------ | ----------------- | ------- |
| `POST /api/admin/users/:id/access`   | `AdminOwnerGuard` | ✓       |
| `PATCH /api/admin/users/:id/access`  | `AdminOwnerGuard` | ✓       |
| `DELETE /api/admin/users/:id/access` | `AdminOwnerGuard` | ✓       |

### DTOs (`grant-access.dto.ts`)

**`GrantAccessDto`:**

- `plan`: `@IsEnum([PlanTier.pro, PlanTier.pro_plus])` — explicitly excludes `free` ✓
- `expiresAt`: `@IsISO8601()` ✓
- `reason`: `@IsOptional() @IsString() @MaxLength(500)` ✓

**`ExtendAccessDto`:**

- `expiresAt`: `@IsISO8601()` ✓
- `reason`: `@IsOptional() @IsString() @MaxLength(500)` ✓

---

## 8. Modal UI Fix Validation

**Result: PASS**

The `var(--card)` CSS variable is not used as a `backgroundColor` in any modal panel. The constant `MODAL_PANEL_STYLE` uses `backgroundColor: '#1a1030'` — a hardcoded dark purple hex that is always opaque and visible regardless of the CSS theme context. All five modal types (Edit, Delete, RoleChange, Invite, ManageAccess) use this shared constant.

---

## 9. Billing Service Validation (Check F)

**Result: PASS**

**`billing-entitlements.service.ts` — `getArtistEntitlements()`:**

- Fetches all 5 manual access fields from the subscription row (lines 23–33)
- Calls `resolveEffectiveAccess(snapshot, manual)` to combine commercial + grant
- If the grant elevates the plan, recomputes entitlements at the higher plan while preserving `billingPlan`, `subscriptionStatus`, and `cancelAtPeriodEnd` from the real subscription (lines 61–73) ✓

**`billing.service.ts` — `getBillingSummary()`:**

- Calls `resolveEffectiveAccess(snapshot, { manualAccess* fields })` (lines 108–119)
- Uses `access.effectiveAccess` as the plan for feature entitlements and upgrade logic
- Surfaces `manualAccess` block in the response when a grant exists (lines 170–179): plan, startsAt, expiresAt, reason, isActive, accessSource ✓

---

## 10. Security Validation (Check G)

**Result: PASS**

| Check                                                                          | Result                                                                      |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Grant/extend/revoke routes use `AdminOwnerGuard` (not just `AdminAccessGuard`) | ✓ All three routes                                                          |
| `GrantAccessDto` validates plan is `pro` or `pro_plus` only                    | ✓ `@IsEnum([PlanTier.pro, PlanTier.pro_plus])`                              |
| `ExtendAccessDto` validates `expiresAt` is ISO date                            | ✓ `@IsISO8601()`                                                            |
| Server-side validation of expiry being future (service, not just DTO)          | ✓ `parseExpiry()` checks `expiry.getTime() <= now` and max 1 year           |
| Free plan cannot be granted                                                    | ✓ Dual protection: DTO type-level exclusion + runtime `BadRequestException` |

---

## 11. Regression Check — Stripe Logic Untouched (Check I)

**Result: PASS**

Reviewed `billing.service.ts` in full. The `reconcileSubscriptionFromStripe`, `handleWebhook`, `handleCheckoutCompleted`, `handleSubscriptionBackedEvent`, `handleInvoiceBackedEvent`, and `syncStripeSubscription` methods are unmodified. `buildStripeSubscriptionWrite` (which produces the `update`/`create` payloads for all Stripe writes) does not include any `manualAccess*` field. Stripe webhook paths cannot touch manual grants by construction.

---

## 12. Bugs Found

**None** — no functional bugs were found.

**One minor note (not a bug):**

The `revokeAccess()` service method (line 459) only guards with `if (!current)` (subscription row doesn't exist) but does **not** throw if `current.manualAccessPlan === null` (no active grant to revoke). This means revoking an already-revoked grant is a silent no-op (it still runs the `UPDATE` setting nulls to nulls). This is harmless and idempotent, but inconsistent with `extendAccess()` which does check for an active grant first. It could silently return a valid-looking `AdminSubscriptionDto` to the UI without surfacing the "nothing to revoke" case. Low severity — the UI only shows the Revoke button when `hasGrant` is true.

---

## 13. Recommended Fixes Before Phase 2

1. **Optional — add guard to `revokeAccess()`:** Mirror the `extendAccess()` check:
   ```ts
   if (!current || current.manualAccessPlan === null) {
     throw new BadRequestException('No active manual grant to revoke');
   }
   ```
   This makes all three mutators consistent and prevents silent no-ops. The UI already guards against this, but defense-in-depth is preferred at the service layer.

No other fixes are required before proceeding to Phase 2.

---

## Final Status: PASS

All access model, resolver, admin service, API, UI, billing integration, modal fix, and security checks pass cleanly. Both typechecks produce zero errors. All 331 unit tests pass. Stripe logic is untouched. Phase 1 is ready to ship.
