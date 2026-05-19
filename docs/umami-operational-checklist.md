# Umami Operational Checklist

Status: active for Behind the Stage when the public Umami env vars are configured.

## Production Environment

Configure these variables in the Vercel project that serves `behind.stagelink.art`:

- `NEXT_PUBLIC_UMAMI_BEHIND_WEBSITE_ID`: required. Use the `data-website-id`
  value from the `StageLink Behind` website in Umami.
- `NEXT_PUBLIC_UMAMI_BEHIND_SHARE_URL`: optional but recommended. Use the
  Umami shared dashboard URL to embed analytics in `/behind/analytics`.
- `NEXT_PUBLIC_UMAMI_SCRIPT_URL`: optional. Default for Umami Cloud is
  `https://cloud.umami.is/script.js`.
- `NEXT_PUBLIC_UMAMI_HOST_URL`: leave empty for Umami Cloud. Set only for a
  self-hosted Umami collection endpoint.
- `NEXT_PUBLIC_UMAMI_DOMAINS`: required in production. Use
  `behind.stagelink.art`.

Railway does not need these variables for the current v1 because the script and
embed are Next.js/Vercel frontend concerns.

## Expected Website Setup

- Umami website name: `StageLink Behind`.
- Umami website domain: `behind.stagelink.art`.
- Tracking scope: StageLink operator/product analytics only.
- Exclusions: public artist pages, artist dashboards, auth pages, landing pages,
  marketing pages, fan traffic, and artist-specific performance.

## Route Validation

The Umami script should load on:

- `https://behind.stagelink.art/`
- `https://behind.stagelink.art/behind`
- `https://behind.stagelink.art/behind/analytics`

The Umami script should not load on:

- `https://stagelink.art/`
- public artist pages;
- authenticated artist dashboards;
- auth/sign-in routes;
- marketing/landing pages.

## Manual Event Validation

In Umami Realtime or Events, validate:

- pageview for `/behind` or `/behind/analytics`;
- `behind_nav_clicked` after switching between Users and Analytics;
- `behind_umami_opened` after opening the shared Umami dashboard;
- `behind_invite_opened` after opening the invite modal;
- `behind_invitation_submitted` after submitting the invite form;
- `behind_invitation_sent` after sending an invite;
- `behind_invitation_failed` if the invitation API or network fails;
- `behind_users_filtered` after changing plan, role, or status filters;
- `behind_users_sorted` after sorting the users table;
- access and role events only when those admin operations are performed.

## Privacy Guardrails

- Do not send emails, names, handles, user IDs, artist IDs, or free-text search
  queries to Umami.
- Event properties may include only product/admin context such as section,
  filter, sort direction, role, status, and access plan.
- Keep `NEXT_PUBLIC_UMAMI_DOMAINS=behind.stagelink.art` in production.
- Keep Umami out of artist-facing analytics until a separate product/privacy
  review explicitly approves it.
- Use `docs/umami-acquisition-utm-playbook.md` for outreach UTMs. Those links
  are campaign templates only and do not expand the Behind-only tracking scope.
