# Data Mapping Validation Audit

Date: 2026-05-14

Scope: `/docs/privacy` data inventory, classification, data-flow mapping,
storage-location mapping, retention policy, and processor inventory.

This validation is intentionally strict and assumes StageLink may be reviewed by
privacy counsel, enterprise customers, app-store/platform reviewers, or a
regulator after public launch.

## Readiness Score

**82 / 100**

StageLink now has a strong operational data map for launch planning. The docs
are specific to the current Prisma schema and observed app flows, and they are
usable by engineering, privacy, and support. The weakest areas are not the
documents themselves; they are missing runtime enforcement around retention,
provider deletion, backup behavior, and subscriber/fan rights workflows.

## Audit Findings

### Critical

None found in the documentation scope.

### High

| Finding                                                         | Risk                                                                                                     | Recommendation                                                                                                                |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| OAuth/API/provider tokens exist in DB-backed integration tables | Token exposure would compromise connected platform/store accounts                                        | Keep redaction tests, add encryption-at-rest or field-level encryption evaluation, and verify logs never include token values |
| External provider deletion is still manual                      | Local erasure can leave WorkOS, Stripe, PostHog, object-storage, email, or infrastructure records behind | Create provider deletion runbook/queue before public launch                                                                   |
| Retention policy is documented but not automated                | Raw analytics, logs, webhook events, snapshots, and orphaned uploads may persist indefinitely            | Implement scheduled retention jobs before public scale                                                                        |
| Railway backups are disabled by plan decision                   | No tested restore path, and future backups will introduce deletion lag                                   | Revisit at launch/100 users; document backup retention and deleted-record handling when Pro is enabled                        |

### Medium

| Finding                                                         | Risk                                                                             | Recommendation                                                                                                       |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Subscriber/fan DSAR ownership is not fully operationalized      | A fan may request access/deletion, but artist-vs-StageLink handling is not final | Define fan DSAR/unsubscribe workflow and artist responsibility language                                              |
| Consent history is browser-local for account users              | StageLink cannot prove historical consent changes server-side                    | Keep current design for low-friction launch; add server-side consent event ledger only if analytics/legal risk grows |
| Runtime/provider log retention is not confirmed                 | Logs may contain IPs, route metadata, and errors longer than expected            | Confirm Vercel/Railway/GitHub/Resend retention settings                                                              |
| Object storage deletion is not proven end-to-end                | DB deletion may not remove actual uploaded objects                               | Add asset deletion/orphan cleanup job and test it                                                                    |
| Contact/support free text may contain unexpected sensitive data | Visitors can disclose sensitive data in messages                                 | Add internal retention workflow and avoid message-body logging                                                       |

### Low

| Finding                                                           | Risk                                                           | Recommendation                                            |
| ----------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| Some provider roles are necessarily assumptions                   | Processor/controller language may need contract-specific edits | Keep TODOs until legal review                             |
| Aggregated analytics retention is not yet specified in product UI | Users may not understand how long metrics remain               | Add public-policy language after final retention decision |
| GitHub artifacts can include private UI screenshots               | Test artifacts may persist dashboard snapshots                 | Continue excluding auth state and limit retention         |

## Validation Checklist

### Data Discovery

Pass with gaps.

Covered:

- authentication and WorkOS data;
- onboarding and artist profile data;
- public pages and blocks;
- EPK content;
- analytics/tracking;
- subscribers/fan capture;
- Stripe billing;
- platform insights;
- Shopify/merch provider settings;
- uploads/assets;
- DSAR/consent/audit logs;
- runtime logs;
- contact/support flow;
- browser storage.

Residual gaps:

- exact provider log retention and regions;
- exact object-storage provider/region;
- Umami provider evidence for the Behind-only v1 setup;
- final backup policy after Railway Pro.

### Data Classification

Pass.

The classification correctly separates public, private, tenant, behavioral,
financial, secret/token, technical metadata, and sensitive-by-context data.
Analytics and subscriber association are appropriately treated as higher-risk
instead of generic low-risk metrics.

### Data Flow Mapping

Pass.

The flow map covers frontend/backend/database flows, WorkOS, Stripe,
PostHog/consent, asset upload, provider insights, email capture, contact forms,
and DSAR deletion/export. Tenant isolation assumptions are documented around
`ArtistMembership`.

### Storage Mapping

Pass with gaps.

Storage locations are complete for current architecture. The main weakness is
runtime evidence for provider retention, backup behavior, and object-storage
deletion.

### Purpose Limitation

Pass.

Purposes are business-specific and aligned to product use. Unnecessary or risky
areas are flagged: original filenames, raw analytics, broad logs, provider
tokens, and support free text.

### Retention

Partial pass.

Documentation is strong, but enforcement is incomplete. Retention jobs and
provider deletion runbooks are production-readiness work.

### Third-Party Processors

Pass with required legal review.

All current major processors/providers are documented. The matrix avoids
overclaiming provider roles and flags contract/region/DPA gaps.

### Multi-Tenant Isolation

Pass.

The docs correctly identify `Artist` as tenant boundary and
`ArtistMembership` as the access-control source of truth. New endpoints must
continue documenting account-scoped vs artist-scoped vs public/admin access.

### Article 30 / ROPA Readiness

Partial pass.

The inventory can support a formal ROPA, but it is not yet a complete legal
ROPA because it still needs:

- final controller/entity identity;
- recipient categories in legal format;
- country/region transfer details;
- final retention periods;
- final lawful basis review by counsel.

## Production Blockers

No blocker for private QA or controlled beta.

Before broad public launch:

1. Implement or schedule raw analytics retention cleanup.
2. Create provider-side deletion/revocation runbook for WorkOS, Stripe,
   PostHog, object storage, email, and logs.
3. Confirm processor DPAs/regions/log retention.
4. Finalize subscriber/fan DSAR and unsubscribe handling.
5. Decide Railway backup upgrade and backup retention policy.

## Final Recommendations

Immediate:

- Treat this data map as the source of truth for Privacy Plan follow-up tasks.
- Add retention automation tickets to the launch backlog.
- Add provider deletion runbook to the T7-8 launch documentation.

Can wait until public scale:

- Server-side consent event ledger.
- Automated data lineage generation.
- Data governance dashboard.
- Formal enterprise DPA package.

Not overengineered:

- Separate docs for inventory, classification, flow, storage, retention, and
  processors are justified because StageLink has public pages, fan capture,
  billing, OAuth/provider data, and artist multi-tenancy.
