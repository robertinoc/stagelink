# OAuth and External Token Architecture

Status: Privacy Plan - third-party and integrations baseline.
Date: 2026-05-14

StageLink has three different external access patterns. They should not be
treated as one generic OAuth bucket.

## Current Access Patterns

| Provider | Current pattern | User OAuth tokens stored? | App credentials stored? | Local disconnect behavior | Privacy risk |
| --- | --- | --- | --- | --- | --- |
| WorkOS | AuthKit hosted OAuth/OIDC/session provider | WorkOS session token held by AuthKit/web session; local API receives bearer token | `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, cookie password | Sign-out exists; provider-side deletion/revocation is manual/runbook | High |
| Spotify | Client Credentials for public artist data | No | `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | Delete local insights connection/snapshots through account deletion/disconnect | Medium |
| YouTube | API key for public channel data | No | `YOUTUBE_DATA_API_KEY` | Delete local insights connection/snapshots through account deletion/disconnect | High if OAuth added later |
| SoundCloud | `client_id` for public profile data/API v2 | No | `SOUNDCLOUD_CLIENT_ID` | Delete local insights connection/snapshots through account deletion/disconnect | High |
| Shopify | Storefront access token entered by artist | Not OAuth; token is artist-supplied | encrypted per-artist Storefront token | `disconnectConnection()` deletes local token/config | Medium |
| Printful | API token entered by artist | Not OAuth; token is artist-supplied | encrypted per-artist API token | `disconnectConnection()` deletes local token/config | Medium |
| Printify | Future schema only | No current implementation | No current active token flow | Not implemented | Medium |

## WorkOS AuthKit

WorkOS is the authentication authority. StageLink must keep these rules:

- browser-visible code can know redirect/client configuration, but never
  `WORKOS_API_KEY` or cookie password;
- StageLink API validates WorkOS JWTs and maps them to local users;
- access tokens must not be logged, stored in analytics, or exposed in client
  storage;
- account deletion must include a provider-side WorkOS deletion/revocation
  runbook until automated provider deletion exists;
- custom auth domains require `WORKOS_JWT_ISSUER` alignment and smoke testing.

## Spotify

Current implementation uses app-level Client Credentials:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- optional `SPOTIFY_TOP_TRACKS_MARKET`

The Spotify access token is cached in memory by the backend provider and is not
persisted in PostgreSQL. Current local insight connection rows store public
artist ids, display names, URLs, scopes JSON, and snapshots.

Rules:

- do not request Spotify user OAuth scopes for current public artist-reference
  insights;
- do not store Spotify app tokens beyond in-memory TTL;
- do not use Spotify data for advertising, user profiling, AI/model training,
  or derived listener analytics outside the visible artist-insights feature;
- provide local delete/disconnect behavior for imported Spotify metrics.

## YouTube/Google

Current implementation uses `YOUTUBE_DATA_API_KEY` and public channel data.
This is lower-risk than user OAuth, but still requires YouTube API policy
compliance and public disclosures.

Rules:

- do not add owner-only YouTube Analytics scopes until a real user-facing
  feature requires them;
- do not "future-proof" by requesting write or analytics scopes early;
- if Google OAuth is added, implement:
  - contextual consent screen copy;
  - exact scope inventory;
  - token encryption at rest;
  - token revocation endpoint;
  - deletion of authorized Google/YouTube API data after revocation;
  - Google security settings link in public Privacy Policy;
  - Google OAuth verification/security assessment review if sensitive or
    restricted scopes are used.

## SoundCloud

Current implementation uses SoundCloud API v2 endpoints with `SOUNDCLOUD_CLIENT_ID`.
The provider code explicitly notes that the API v2 surface is undocumented and
may reject server-side requests.

Rules:

- treat SoundCloud as policy-fragile until official access/terms posture is
  confirmed;
- do not use browser-extracted or rotating client ids as a long-term production
  compliance strategy;
- if official OAuth/API access is enabled later, add token encryption,
  revocation, scope documentation, and provider DPA/terms review;
- if official permission cannot be confirmed, keep SoundCloud to public links
  or embeds and avoid server-side metric sync.

## Shopify Storefront Tokens

Shopify Storefront tokens are not OAuth tokens in the current implementation;
they are artist-supplied Storefront access tokens used against a store domain.

Controls already present:

- token is encrypted using StageLink secret encryption before persistence;
- public API responses return `hasStorefrontToken`, not the token;
- disconnect deletes the local connection row;
- product preview cache is short-lived in memory.

Required before public scale:

- document token creation instructions that request only Storefront read access
  needed for selected products/collections;
- warn artists not to paste Admin API tokens;
- add token rotation instructions.

## Printful Tokens

Printful API tokens are artist-supplied and encrypted before persistence.

Controls already present:

- token is not returned to clients;
- disconnect deletes the local connection row;
- provider product caches are short-lived in memory;
- Printify is not implemented.

Required before public scale:

- document least-privilege token creation where Printful supports it;
- require explicit artist confirmation that the connected store belongs to
  them or they have authority to connect it;
- add provider-side deletion/revocation guidance to DSAR/deletion runbooks.

## Token Storage Rules

All external tokens and API credentials must follow this baseline:

- server-only env vars for app-level credentials;
- encrypted persistence for artist-supplied provider tokens;
- no tokens in logs, analytics, E2E artifacts, screenshots, or PR comments;
- no tokens in public `NEXT_PUBLIC_*` variables unless the provider explicitly
  defines them as public identifiers;
- provider-specific disconnect must delete local tokens and stop background
  sync;
- account deletion must remove local provider tokens before anonymizing user
  identifiers.

## Future OAuth Gate

No new OAuth provider or scope may ship without:

1. user-facing purpose copy;
2. exact scope list and justification;
3. token storage/encryption design;
4. revocation and disconnect behavior;
5. deletion behavior after provider revocation;
6. provider policy review;
7. public Privacy Policy and Terms updates;
8. test cases for token absence, expired token, revoked token, and cross-tenant
   access denial.
