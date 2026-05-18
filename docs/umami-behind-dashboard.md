# Umami Behind Dashboard

Status: v1 implementation notes.

## Scope

Umami is for StageLink product/admin analytics only.

It must measure `https://behind.stagelink.art/`, where StageLink operators use
Behind the Stage. It must not measure:

- public artist pages;
- artist dashboards;
- auth pages;
- landing/marketing pages;
- fan traffic or artist-specific performance.

## Website Structure

Create one Umami website:

- Name: `StageLink Behind`
- Domain: `behind.stagelink.art`
- Environment variable: `NEXT_PUBLIC_UMAMI_BEHIND_WEBSITE_ID`
- Optional embed URL: `NEXT_PUBLIC_UMAMI_BEHIND_SHARE_URL`

Keep `NEXT_PUBLIC_UMAMI_DOMAINS=behind.stagelink.art` in production. The web app
also checks the current hostname before injecting the Umami script, so a copied
website ID does not accidentally track `stagelink.art` or local routes.

## Runtime Integration

Files:

- `apps/web/src/lib/analytics/UmamiProvider.tsx`
- `apps/web/src/lib/analytics/umami.ts`
- `apps/web/src/app/behind/layout.tsx`
- `apps/web/src/app/behind/analytics/page.tsx`
- `apps/web/src/app/behind/UsersTable.tsx`

The provider is mounted only in `behind/layout.tsx`.
The existing Users table remains at `/behind`. Umami is integrated as an
additional section at `/behind/analytics`.

## Event Taxonomy

Current explicit events:

- `behind_nav_clicked`
- `behind_logout_clicked`
- `behind_umami_opened`
- `behind_invite_opened`
- `behind_invitation_sent`
- `behind_users_sorted`
- `behind_users_filtered`
- `behind_user_profile_updated`
- `behind_user_status_updated`
- `behind_role_updated`
- `behind_access_granted`
- `behind_access_extended`
- `behind_access_revoked`

Allowed event properties:

- product section names, such as `users`;
- filter names and values, such as `plan=pro`;
- sort field and direction;
- role/access/status outcomes.

Do not send user email, artist handle, user id, name, or free-text search query
to Umami.

## Dashboard V1

Recommended Umami dashboard sections:

1. Traffic overview: pageviews, visits, referrers, device/browser, and country.
2. Product usage: top events from the `behind_*` taxonomy.
3. Users table workflow: filters, sorts, invites, status changes, role changes.
4. Access operations: grants, extensions, and revokes.

## Validation Checklist

1. Configure `NEXT_PUBLIC_UMAMI_BEHIND_WEBSITE_ID`.
2. Optionally configure `NEXT_PUBLIC_UMAMI_BEHIND_SHARE_URL` to embed the shared
   Umami dashboard inside `/behind/analytics`.
3. Keep `NEXT_PUBLIC_UMAMI_DOMAINS=behind.stagelink.art`.
4. Deploy and open `https://behind.stagelink.art/`.
5. Confirm the Umami script is present on Behind.
6. Confirm the script is absent on `https://stagelink.art/`, public artist pages,
   artist dashboards, login, and marketing routes.
7. Trigger a filter, sort, and invite modal open in Behind.
8. Confirm only `behind_*` events appear in the `StageLink Behind` website.
