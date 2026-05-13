# DSAR Validation Audit

Date: 2026-05-13

Scope: DSAR endpoints, account deletion/export/update flow, privacy settings UI,
request logging, and `/docs/privacy` documentation.

## Readiness Score

**78 / 100**

StageLink now has a practical self-service DSAR baseline suitable for private QA
and controlled launch readiness. The strongest areas are tenant-scoped export,
authenticated access, token redaction, and audit logging. The weakest areas are
provider-side automation and step-up authentication.

## Findings

### Critical

None found in the implemented scope.

### High

| Finding                                          | Risk                                                              | Recommendation                                             |
| ------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| No WorkOS step-up authentication before deletion | A compromised active session could erase an account.              | Add WorkOS step-up/email confirmation before public scale. |
| External provider deletion is manual             | Local erasure may not propagate to Stripe/WorkOS/PostHog records. | Add provider deletion runbook and later automation.        |

### Medium

| Finding                      | Risk                                                      | Recommendation                                            |
| ---------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| Export is direct JSON only   | Large accounts could produce heavy synchronous responses. | Move to encrypted temporary download links if data grows. |
| No admin DSAR dashboard      | Support cannot easily review DSAR status/failures.        | Add Behind owner-only DSAR view.                          |
| Deletion has no grace period | Accidental user deletion is hard to recover.              | Consider delayed deletion for consumer accounts.          |

### Low

| Finding                                             | Risk                                                                           | Recommendation                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Objection requests are documented but not automated | Users must contact support for nuanced objections.                             | Add support workflow before public launch.                             |
| Cookie consent is client-side                       | Server export documents consent but does not include historical consent state. | Add server-side consent events if regulator-grade history is required. |

## Validation Summary

- User rights coverage: access, rectification, erasure, portability, and consent
  withdrawal are represented.
- Export: tenant-scoped, authenticated, JSON, redacts tokens/secrets.
- Deletion: removes sole-owner public workspaces, anonymizes account, retains
  minimal audit/DSAR records.
- Update: limited to account name fields; artist profile correction remains in
  the profile editor.
- Identity: active session plus email confirmation; no password prompt because
  auth methods include OAuth/passwordless.
- Logging: privacy-safe `dsar_requests` and `audit_logs`.
- Abuse: fixed-window user/IP rate limit.

## Production Blockers

No hard blocker for private QA. Before broad public launch:

1. Add provider-side deletion/revocation runbook.
2. Decide whether deletion requires grace period or WorkOS step-up.
3. Add Behind DSAR operational dashboard or at least a documented SQL/reporting
   workflow for `dsar_requests`.
