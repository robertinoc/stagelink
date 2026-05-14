# Downgrade Retention Policy

Status: Data Retention and Lifecycle baseline.
Date: 2026-05-14

## Objective

Plan downgrades should not surprise users with immediate data loss. StageLink
should preserve user trust while limiting indefinite storage of paid-feature
data after access ends.

## General Rule

When a workspace downgrades:

- keep data intact during the paid period and a defined grace period;
- make premium features inaccessible or read-only according to product rules;
- do not delete user-created content immediately;
- warn users before permanent deletion or anonymization of paid-feature data.

## Plan Transitions

### PRO+ to PRO

Likely affected data:

- PRO+ analytics ranges/features;
- advanced insights/sync intervals;
- premium EPK or asset limits if configured;
- extra integrations if reserved for PRO+.

Retention behavior:

- Keep existing data for 90 days after downgrade.
- Make PRO+-only features read-only/inaccessible.
- Continue retaining billing metadata.
- Delete or aggregate PRO+-only raw data after grace if not available in PRO.

### PRO to FREE

Likely affected data:

- longer analytics history;
- extra assets or pages beyond FREE limits;
- premium EPK features;
- integrations/syncs;
- custom domains when introduced.

Retention behavior:

- Keep existing paid-feature data for 90 days after downgrade.
- Pause premium sync jobs immediately after entitlement ends.
- Keep public page functional within FREE limits.
- Hide/lock premium blocks or integrations rather than deleting immediately.
- Notify user before permanent cleanup.

### Past due / unpaid

Retention behavior:

- Preserve data during Stripe retry/dunning window.
- Restrict paid features according to billing policy.
- Do not delete paid-feature data while payment recovery is in progress.

## Data-Specific Downgrade Rules

| Data | Downgrade behavior |
| --- | --- |
| Artist profile and core page | Retain; core service data remains available. |
| EPK | Retain and potentially lock premium editing/publishing after grace. |
| Assets | Retain during grace; after grace, enforce storage limits with warning. |
| Analytics raw history | Keep within new plan's allowed range; aggregate/delete older raw rows after grace. |
| Provider integrations | Pause sync if entitlement removed; keep connection metadata during grace; delete tokens after grace if feature unavailable. |
| Smart links | Retain active links if FREE supports them; otherwise disable after warning. |
| Billing records | Retain according to payment/accounting policy. |

## User Experience Requirements

- Show downgrade consequences before plan change.
- Confirm what remains available and what becomes locked.
- Give export options where practical.
- Send reminders before cleanup after grace period.
- Avoid dark patterns that force users to retain paid plans to access their own
  export/deletion rights.

## Current Gaps

- No automated downgrade cleanup job is documented as active.
- Final feature limits for FREE/PRO/PRO+ must be aligned with product/billing
  policy.
- UI warnings for grace-period cleanup need final product copy.
- Retention cleanup must integrate with entitlement checks.

