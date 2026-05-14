# Data Retention and Lifecycle Validation Audit

Date: 2026-05-14
Scope: retention policies, account lifecycle, deletion/anonymization strategy,
cleanup job architecture, inactive-account handling, downgrade handling, and
`/docs/privacy` documentation.

## Readiness Score

**76 / 100**

StageLink now has a coherent retention/lifecycle architecture and a safe
read-only candidate report. The strongest areas are clear retention categories,
account/workspace lifecycle definitions, downgrade grace behavior, and refusal
to enable destructive cleanup prematurely. The weakest areas remain automated
deletion, provider-side retention evidence, object storage deletion proof, and
inactive account activity tracking.

## Findings

### Critical

None found in the implemented scope.

### High

| Finding | Risk | Recommendation |
| --- | --- | --- |
| Destructive cleanup jobs are not enabled | Data may exceed documented retention periods. | Enable only after legal review, staging dry-runs, backup policy, and provider runbooks. |
| Provider retention/deletion remains manual | WorkOS, Stripe, PostHog, logs, storage, and email may retain data after local erasure. | Add provider deletion/revocation checklist and operational evidence register. |
| Object storage deletion is not proven | DB deletion may leave uploaded files orphaned. | Add object delete/verify job and disposable upload erasure test. |
| No local `lastActiveAt` lifecycle signal | Inactive account handling cannot be automated safely. | Add local activity tracking before inactive cleanup automation. |
| Railway backups are disabled/deferred | Recovery posture is limited until Pro plan/backup policy is enabled. | Keep launch decision documented; enable backups before public scale. |

### Medium

| Finding | Risk | Recommendation |
| --- | --- | --- |
| Retention periods are engineering baselines, not legal-final | Public policy could overpromise if periods change. | Legal review before publishing final public policy. |
| Downgrade cleanup is policy-only | Premium data may remain indefinitely after downgrade. | Add entitlement-aware grace/cleanup job after product limits are final. |
| Audit/DSAR retention jobs are not implemented | Accountability records may accumulate indefinitely. | Add low-risk batch jobs after legal retention periods are approved. |
| Browser/provider persistence is partly outside app control | Cookies, analytics IDs, logs, and provider records may outlive local deletion. | Maintain provider retention register and disclose backup/provider limits. |

### Low

| Finding | Risk | Recommendation |
| --- | --- | --- |
| No legal hold model | Rare disputes may need retention exceptions. | Add only when operationally needed. |
| No retention dashboard | Manual review is harder. | Add Behind retention dashboard later. |

## Checklist Validation

### Retention Policy

Result: improved, not legal-final.

- All major data categories are covered.
- Durations are specific enough for engineering planning.
- Legal/business rationales are documented.
- Provider and backup boundaries are explicit.

### Data Persistence

Result: strong documentation.

- PostgreSQL, object storage, WorkOS, Stripe, PostHog, logs, email, Redis,
  browser storage, CI artifacts, and backups are covered.
- Hidden persistence remains a provider-evidence task.

### Account Lifecycle

Result: clear baseline.

- Active, inactive, suspended, soft-deleted, permanently deleted, and provider
  remnant states are defined.
- Shared workspace deletion behavior is documented.
- Local activity tracking is still missing.

### Automatic Deletion

Result: safe architecture, not destructive.

- Read-only candidate report exists.
- Production-like URL guard exists.
- Destructive deletion is intentionally deferred.
- This is the correct posture until final legal/product/backup decisions exist.

### Anonymization

Result: practical baseline.

- Deleted users, analytics, audit logs, and support/contact data have strategies.
- True anonymization vs pseudonymization is clearly distinguished.
- Analytics aggregation remains future work.

### Inactive Accounts

Result: policy-only.

- Thresholds and notification strategy are defined.
- No silent deletion is allowed.
- Needs `lastActiveAt` or equivalent before automation.

### Downgrades

Result: policy-only but coherent.

- PRO+/PRO/FREE downgrade grace behavior is documented.
- No immediate destructive deletion after downgrade.
- Needs product-limit alignment and entitlement-aware cleanup later.

### Third Parties

Result: documented responsibilities.

- Stripe/legal retention is recognized.
- WorkOS/PostHog/log/email/storage provider retention remains evidence-gathering
  work.

## Production Readiness

Private QA / controlled beta:

- Ready with warnings.

Broad public launch:

- Not fully ready until provider runbooks, backup policy, object deletion proof,
  final legal retention periods, and at least dry-run production candidate
  evidence exist.

## Immediate Recommendations

1. Run `pnpm data:retention:candidates` against staging after dashboard/API are
   stable.
2. Confirm provider retention settings and DPAs/regions/log retention.
3. Add object-storage deletion verification before enabling destructive jobs.
4. Add local `lastActiveAt` tracking before inactive account automation.
5. Keep destructive cleanup jobs disabled until legal/product/ops approval.

