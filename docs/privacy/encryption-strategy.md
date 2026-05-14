# Encryption and Secret Handling Strategy

Status: Privacy-by-Design baseline.
Date: 2026-05-14

## Encryption in Transit

Expected production posture:

- Public app traffic uses HTTPS through Vercel.
- API traffic to Railway should use HTTPS.
- WorkOS, Stripe, PostHog, Resend, storage, and provider APIs use HTTPS.
- Auth callbacks must stay on the canonical production domain:
  `https://stagelink.art/api/auth/callback`.

Required operational check:

- Confirm all production and staging URLs enforce HTTPS.
- Keep WorkOS redirect/callback URLs aligned with Vercel domains.
- Do not use plaintext provider callbacks in production.

## Encryption at Rest

Expected provider posture:

- Railway PostgreSQL: provider-managed disk/database encryption, to be
  confirmed in provider evidence register.
- Vercel/Railway logs: provider-managed storage, retention and region to be
  confirmed.
- WorkOS, Stripe, PostHog, Resend, and object storage: provider-managed
  encryption, DPAs/regions/subprocessors to be confirmed.

Current repository controls:

- App-level secret encryption helper exists in
  `apps/api/src/common/utils/secret-encryption.ts`.
- Shopify storefront tokens and merch provider API tokens are encrypted before
  persistence.
- DSAR export redacts tokens/secrets.
- WorkOS access tokens are passed server-side and should not be stored in
  PostgreSQL.

## Secrets and Environment Variables

Secret values:

- `WORKOS_API_KEY`
- `WORKOS_COOKIE_PASSWORD`
- `STRIPE_SECRET_KEY`
- webhook secrets
- `SECRETS_ENCRYPTION_KEY`
- Upstash Redis token
- provider API keys/tokens
- storage credentials

Rules:

- Never expose secret values through `NEXT_PUBLIC_*`.
- Vercel/Railway secret variables must be marked sensitive where supported.
- Rotate any value that was ever visible in a UI, log, screenshot, test
  artifact, or public PR.
- Use different values for development, staging, and production.
- Do not log environment variable values.

## Third-Party Tokens

Current high-risk token classes:

- Shopify storefront tokens.
- Merch provider API tokens.
- Future OAuth access/refresh tokens for Spotify, YouTube, or SoundCloud.

Controls:

- Encrypt tokens before database persistence.
- Decrypt only at the moment of provider API use.
- Do not return raw tokens to frontend/API responses.
- Redact tokens in DSAR export.
- Add disconnect/revoke flows for provider integrations.
- Prefer provider references/handles over tokens when possible.

## Browser-Side Token Exposure

Allowed:

- Necessary WorkOS encrypted session cookies.
- Versioned consent cookies.
- Analytics consent compatibility cookie.

Not allowed:

- Provider access tokens in `localStorage`, `sessionStorage`, or query params.
- WorkOS access tokens stored in browser storage.
- Stripe secret/client secrets beyond Stripe-approved client-side flows.
- Raw provider API tokens in JavaScript-accessible persistence.

## Cookie Posture

Authentication/session cookies:

- Necessary.
- Must not be blocked by consent banner.
- Should be Secure, HttpOnly where provider supports it, and SameSite-aware.

Consent cookies:

- Necessary for privacy preference persistence.
- Store categories, timestamp, expiration, and version.

Analytics cookies/local storage:

- Allowed only after analytics consent.
- Must be cleaned up on withdrawal where possible.

## Known Gaps

| Gap | Severity | Next action |
| --- | --- | --- |
| Provider encryption-at-rest and region evidence not collected | High | Build provider evidence register before public launch. |
| Retention for logs and provider-side records not confirmed | High | Confirm in Vercel, Railway, WorkOS, Stripe, PostHog, Resend. |
| Historical/legacy plaintext integration tokens may exist if created before encryption | Medium | Run one-time admin check/migration before launch if legacy data exists. |
| WorkOS step-up before account deletion is not implemented | High | Add step-up/email challenge before broad public launch. |

## Validation Checklist

- No server secrets are prefixed with `NEXT_PUBLIC_`.
- `SECRETS_ENCRYPTION_KEY` exists in each backend environment.
- Provider tokens are encrypted in database rows.
- DSAR export redacts provider tokens.
- Logs do not include Authorization headers, cookies, tokens, or request bodies.
- Production deploy uses `stagelink.art` callback URLs.

