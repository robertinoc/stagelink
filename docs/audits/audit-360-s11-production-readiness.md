# StageLink Audit 360 - S11 Production Readiness

Status: implemented with operational fixes
Last checked: 2026-05-27

## Scope

S11 covers:

- T11.1 Environment & Deploy
- T11.2 Legal & Compliance
- T11.3 Go-Live Checklist

This pass reviewed deploy configuration, environment examples, CI readiness,
health reporting, existing security/privacy evidence, and public-launch gaps.

## Findings

| ID      | Severity | Area             | Finding                                                                                                                                                                                                         | Action                                                                                                                                         |
| ------- | -------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| S11-001 | P1       | Environment      | `APP_ENV` was documented and used by analytics/billing, but not part of the structured API config. `/api/health` reported `NODE_ENV`, so staging running with `NODE_ENV=production` could appear as production. | Added `APP_ENV` validation/config, health output for deployment tier, and a unit test.                                                         |
| S11-002 | P2       | Deploy           | `docs/deploy.md` still described manual migrations, while Railway now runs `prisma migrate deploy` through `pnpm start`.                                                                                        | Updated deploy docs and Dockerfile comments to match current Railway behavior.                                                                 |
| S11-003 | P2       | Environment      | `.env.example` files had stale domains, missing production variables, and incomplete server-only email/config entries.                                                                                          | Updated web/API examples for `stagelink.art`, APP_ENV, Resend, Stripe price IDs, S3 public URL, WorkOS cookie domain, and current Umami names. |
| S11-004 | P1       | Legal/compliance | Public Privacy Policy, Terms of Service, and Cookie Policy are documented as structures, not final lawyer-reviewed public pages.                                                                                | Kept as a launch gate; do not publish draft legal text from repo docs as final policy.                                                         |
| S11-005 | P1       | Go-live          | Staging DB, real restore drill, managed backups/PITR, shared rate limiting, and external alerting remain documented deferred gates.                                                                             | Preserved as explicit launch blockers for broad public traffic or paid acquisition.                                                            |

## T11.1 Environment & Deploy

Pass with fixes.

Implemented:

- API config now exposes `app.appEnv`.
- `APP_ENV` is validated as `development | staging | production`.
- `/api/health` reports `environment` from `APP_ENV` and includes `nodeEnv`
  separately for runtime debugging.
- Deploy docs now reflect Railway migrate-on-start behavior.
- Environment examples now match the canonical production domain and current
  provider variables.

Remaining external checks:

- Confirm Vercel project root is `apps/web`.
- Confirm Railway root is repo root and `railway.json` has no dashboard override.
- Confirm production `APP_ENV=production`; staging `APP_ENV=staging`.
- Confirm `DIRECT_URL` is configured and reachable from Railway.

## T11.2 Legal & Compliance

Blocked for public launch until owner/legal inputs are finalized.

Evidence exists in `docs/privacy/`, including legal foundations, policy
structures, compliance gap analysis, privacy UX, DSAR, retention, provider, and
incident-response documentation. The remaining blocker is not lack of structure;
it is final counsel-reviewed public policy content and publication.

Launch gates:

- Publish lawyer-reviewed Privacy Policy.
- Publish lawyer-reviewed Terms of Service.
- Publish lawyer-reviewed Cookie Policy.
- Finalize legal entity, privacy contact, support/DSAR email, governing law,
  refund/cancellation terms, provider DPAs/SCCs, and retention periods.
- Confirm SoundCloud, EmailJS, PostHog/Umami, Resend, storage, Stripe, WorkOS,
  Vercel, Railway, and Upstash production posture in the provider evidence
  register.

## T11.3 Go-Live Checklist

Private QA / controlled MVP can continue with explicit risk acceptance.

Before broad public traffic, paid acquisition, or meaningful user data volume:

- Create a dedicated staging DB/environment and rerun staging data validation.
- Run a real backup/restore drill against a disposable restore DB.
- Enable managed backups/PITR or document an equivalent production recovery
  capability.
- Move public/API/upload/SmartLink rate limits to a shared atomic store.
- Add external monitoring/alerting and define operational owners.
- Confirm branch protection/ruleset requires the green CI jobs documented in
  `.github/workflows/ci.yml`.
- Revisit owner/admin MFA or step-up for Behind/admin access.

## Verification

Local checks for this S11 PR:

```bash
pnpm --filter @stagelink/api test -- health.controller.spec.ts
pnpm --filter @stagelink/api typecheck
```
