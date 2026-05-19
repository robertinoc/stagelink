# Umami Behind Dashboard

Status: v1 active when the public Behind Umami env vars are configured.

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
- `behind_invitation_submitted`
- `behind_invitation_sent`
- `behind_invitation_failed`
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
- invitation funnel context, such as `surface=users_table`,
  `channel=workos_email`, `source=behind_users`, `medium=email_invite`,
  `result=sent|api_error|network_error`, and API error `status`.

Do not send user email, artist handle, user id, artist id, name, free-text
search query, or outreach content to Umami.

UTM campaign conventions and outreach templates live in
`docs/umami-acquisition-utm-playbook.md`. They are operational templates only:
the Behind Umami website does not measure public signup or landing sessions.

## Dashboard V1

The `/behind/analytics` page is the StageLink Behind analytics operating center.
It keeps the shared Umami iframe as the primary data source and adds StageLink
context around it.

Current sections:

1. Traffic overview: pageviews, visitors, visits, referrers, devices, and
   geography from the Umami dashboard.
2. UTM campaigns: operational naming for outreach links, using the templates in
   `docs/umami-acquisition-utm-playbook.md`.
3. `behind_*` events: navigation, invitation funnel, filters, sorts, roles,
   status, and access operations.
4. Manual validation: visible end-to-end checks for the active Behind setup.

The future native dashboard path is intentionally documented but not
implemented in v1. A later API-backed version should fetch Umami metrics
server-side and avoid exposing API tokens in the browser.

## Validation Checklist

Use `docs/umami-operational-checklist.md` as the source checklist for production
setup, route validation, event validation, and privacy guardrails.

Minimum release checks:

1. Configure `NEXT_PUBLIC_UMAMI_BEHIND_WEBSITE_ID`.
2. Configure `NEXT_PUBLIC_UMAMI_BEHIND_SHARE_URL` when the embedded dashboard
   should render inside `/behind/analytics`.
3. Keep `NEXT_PUBLIC_UMAMI_DOMAINS=behind.stagelink.art`.
4. Deploy and open `https://behind.stagelink.art/`.
5. Confirm the Umami script is present on Behind.
6. Confirm the script is absent on `https://stagelink.art/`, public artist pages,
   artist dashboards, login, and marketing routes.
7. Open `/behind/analytics` and confirm the embedded dashboard renders.
8. Trigger a nav click, invite open, invite submit, filter, and sort in Behind.
9. Confirm pageviews and only `behind_*` events appear in the `StageLink Behind`
   website.
10. Confirm UTM templates remain documentation-only and public signup/landing
    routes are not tracked by this Behind Umami website.
