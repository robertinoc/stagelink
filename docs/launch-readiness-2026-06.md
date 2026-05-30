# StageLink launch readiness — June 2026

Companion to [`perf-audit-2026-05.md`](./perf-audit-2026-05.md). The
post-mortem is retrospective; this is forward-looking: **what to verify
before turning the public faucet on**, what to monitor during the first
days of real traffic, and what to do when something specific breaks.

Designed to be runnable end-to-end by one person in ~90 minutes. Tick
each box. Anything that doesn't pass blocks launch.

---

## 0 — Required environment variables

These must all be set in their respective providers. The audit caught
several near-misses (e.g. `https://` accidentally stripped from
`AWS_S3_PUBLIC_BASE_URL` triggered a healthcheck-failure outage during
the audit). Re-verify each.

### Vercel (frontend)

- [ ] `NEXT_PUBLIC_APP_URL` = `https://stagelink.art`
- [ ] `NEXT_PUBLIC_API_URL` = `https://api.stagelink.art`
- [ ] `NEXT_PUBLIC_IMAGES_HOSTNAME` = `pub-45fe98cf1b3b45ffa3f83f6a73f247cc.r2.dev` *(no protocol, no trailing slash)*
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` — present if analytics enabled, else unset (SDK stays dormant)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` — present if Sentry enabled
- [ ] `WORKOS_*` — auth config matches dashboard
- [ ] `UPSTASH_REDIS_*` — for Behind/admin roles
- [ ] All three environments (Production, Preview, Development) have the same values

### Railway (NestJS API)

- [ ] `DATABASE_URL` — points at the Supabase production DB, NOT the Railway orphan Postgres (see leftover items below)
- [ ] `DIRECT_URL` — direct (non-pooled) connection for migrations
- [ ] `AWS_S3_PUBLIC_BASE_URL` = `https://pub-45fe98cf1b3b45ffa3f83f6a73f247cc.r2.dev` *(WITH protocol, validated by Joi as URL)*
- [ ] `AWS_S3_BUCKET`, `AWS_S3_REGION`, `AWS_S3_ACCESS_KEY_ID`, `AWS_S3_SECRET_ACCESS_KEY`
- [ ] `WORKOS_API_KEY` / `WORKOS_CLIENT_ID` / `WORKOS_COOKIE_PASSWORD`
- [ ] `STRIPE_SECRET_KEY` (live mode, not test)
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `RESEND_API_KEY`

### Cloudflare

- [ ] `stagelink.art` proxied (orange cloud on)
- [ ] `api.stagelink.art` either proxied OR DNS-only — confirm what Railway expects
- [ ] HSTS active

---

## 1 — Smoke tests for each shipped perf PR

Run these from incognito Chrome with DevTools open (Network tab visible).

### PR #430 — Ola 1 dashboard caching + form feedback

- [ ] Log in. Open `/[locale]/dashboard`, Network tab. First load shows `/api/auth/me`, `/api/artists/<id>`, `/api/billing/<id>/summary` requests.
- [ ] Click another section (`/dashboard/settings`). The same three endpoints should **NOT** appear again in the Network tab within 60 s — the `unstable_cache` is serving them.
- [ ] Open `/dashboard/billing`, click **Refresh billing status**. Cache invalidation should fire and the next page load shows the three calls again.
- [ ] Open `/dashboard/settings?tab=plan`. Click "Manage / Upgrade / Cancel" buttons — each should disable + show spinner inline on click (before the Stripe redirect).
- [ ] Avatar in topbar/sidebar shows from `/_next/image?url=https%3A%2F%2Fpub-…`.

### PR #432 + #436 — Public page image optimization

- [ ] Visit `https://stagelink.art/en/robertinoc` (incognito). View page source (`Ctrl+U`).
- [ ] Search for `pub-…r2.dev` — every occurrence should be inside a `_next/image?url=` parameter, never as a direct `<img src=>`.
- [ ] In the Network tab, filter by "img". The cover, avatar and gallery thumbnails should be `image/webp` or `image/avif` (NOT `image/png` or `image/jpeg`).
- [ ] Cover image weight in Network tab: **< 50 kB** (was 2.5 MB before).
- [ ] Gallery thumbnail weight: **< 25 kB each** (was 1–4 MB each).
- [ ] Visit an artist with NO cover, NO avatar, NO gallery (or a test artist you can configure). All three fallbacks render — gradient cover, initial letter avatar, no gallery section.
- [ ] **Known visible issue**: Release covers from Spotify (`i.scdn.co`), Beatport (`geo-media.beatport.com`) and Google search thumbnails (`encrypted-tbn0.gstatic.com`) currently render as 💿 emoji fallback. See "Known issues" below.

### PR #433 — Dashboard lazy-load

- [ ] Log in, visit `/dashboard/settings` directly. Network tab: only the chunk for the active tab should load.
- [ ] Click each settings tab (Plan / Connections / Stores / Privacy). Each should trigger ONE new chunk load with a brief skeleton flash, then settle.
- [ ] Visit `/dashboard/epk`. Initial paint shows the editor skeleton (animated pulse) for ~200–500 ms, then the editor mounts.
- [ ] Edit something in the EPK editor, save. Submit should debounce / show pending state correctly.

### PR #434 — PostHog code-split

- [ ] Open incognito, visit `https://stagelink.art/en/robertinoc`. DevTools Network tab, filter `posthog`.
- [ ] **Expected**: `0 / N requests` — no PostHog chunk loads before consent.
- [ ] Click "Accept all" / equivalent in the cookie banner. Wait 2 s.
- [ ] **Expected**: a chunk with `posthog` in the URL loads. (Confirms dynamic import is working.)
- [ ] Reload the same page (consent now set). PostHog chunk loads again — this is normal.
- [ ] Repeat with consent denied. PostHog should NEVER load.

### PR #435 — Backend write reduction + Stripe memoization

- [ ] In Supabase SQL editor, run *before* heavy traffic:
  ```sql
  SELECT schemaname, relname, n_tup_ins, n_tup_upd, n_tup_del
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
    AND relname ILIKE '%subscription%';
  ```
- [ ] Note `n_tup_upd`. Re-check after 24 h of real traffic. Growth should be SLOW — only true plan changes + webhook updates write. No more "phantom upserts" per page load.
- [ ] Check Stripe dashboard → Developers → Logs. Product/price API calls should be ≤ 12 per hour per Vercel function instance (was: ~ N per visitor).

---

## 2 — Critical user-flow smoke tests

These are the flows that, if broken, mean rolling back the launch. Each
should take < 5 minutes.

### Auth + onboarding

- [ ] Sign up with a new email via WorkOS Hosted UI.
- [ ] Receive welcome email via Resend.
- [ ] Complete onboarding (pick username, category).
- [ ] Land on `/dashboard` with the empty state.

### Billing

- [ ] On a Free account, click **Upgrade to Pro**. Stripe Checkout opens.
- [ ] Use Stripe test card `4242 4242 4242 4242` (in test mode) or a real card (in live mode).
- [ ] After checkout, redirect back to `/dashboard/billing?session_id=...`.
- [ ] Wait ≤ 5 s. The page should show "Pro" badge. If it doesn't, click **Refresh billing status**.
- [ ] Open Stripe portal from the same page. Cancel the subscription. Confirm `cancelAtPeriodEnd: true` reflects within 60 s.

### Public artist page

- [ ] Visit `https://stagelink.art/en/<your-username>` from incognito + mobile-emulation (375 × 667).
- [ ] Page renders below ~3 s on a decent connection.
- [ ] Cover image loads.
- [ ] Avatar loads.
- [ ] All links work (Instagram, YouTube, Spotify, etc.).
- [ ] Click a link block — verify the click is tracked (open Supabase, check `analytics_events` table for the recent click).
- [ ] Cookie banner appears. Accept analytics. Reload — banner does NOT reappear.

### EPK

- [ ] Visit `/dashboard/epk`. Editor loads.
- [ ] Edit identity, save. Status indicator turns green.
- [ ] Publish EPK.
- [ ] Visit `https://stagelink.art/en/<username>/epk` from incognito. Public EPK renders.
- [ ] Try `/epk/print`. Print-friendly version renders.

### Smart Link redirect

- [ ] Click a configured Smart Link (e.g. `https://stagelink.art/go/<id>`).
- [ ] Redirects to the platform-specific destination (Spotify / Apple Music / etc.).
- [ ] Click is tracked in `smart_link_resolutions`.

---

## 3 — Visual checks on production

Just eyeball these. The audit fixed image-weight issues but layout regressions
should still be caught by a human.

- [ ] Public page on mobile (375 px): cover crops correctly, avatar centred and round, gallery is a 2-col grid, links are tappable.
- [ ] Public page on desktop (1440 px): hero looks right, gallery is a 3-col grid.
- [ ] EPK on mobile: tabs work, content readable.
- [ ] Dashboard on mobile: sidebar collapses to drawer, topbar shows hamburger.
- [ ] Settings → Plan tab: upgrade button gradient renders, current plan card highlights.

---

## 4 — Monitoring + alerting setup

Things to wire up BEFORE launch. These cover "how do we hear about it
if something breaks".

### Sentry

- [ ] Verify `NEXT_PUBLIC_SENTRY_DSN` set in Vercel — go to Sentry dashboard, "Test event" should arrive within 1 minute of triggering an intentional client error.
- [ ] Verify `SENTRY_DSN` set in Railway — same test from the API side.
- [ ] **Alert rules**: New issue → Slack / email. Error frequency spike (>10 / minute) → page someone.
- [ ] **Performance**: `tracesSampleRate: 0` today — fine for v1 launch, revisit if perf regression suspected.

### Vercel

- [ ] Vercel project notifications: deployment failure → email + Slack.
- [ ] Function logs visible (Project → Logs). Check periodically for 500s.
- [ ] **Speed Insights**: not on Hobby plan — accept this for v1, revisit after first revenue.

### Railway

- [ ] Project notifications: deployment failure → email.
- [ ] **Healthcheck**: confirm `/api/health` returns 200 within Railway's healthcheck timeout. The audit broke this once via env-var typo — re-verify.
- [ ] Logs visible. Filter for `ERROR` periodically.

### Supabase

- [ ] Database "Insights" tab tracking. Check slow query log if anything feels off.
- [ ] Backups enabled (Railway Pro / Supabase Pro). Confirm a recent backup exists.

### Stripe

- [ ] Live mode webhook configured: `https://api.stagelink.art/api/billing/webhook` receiving `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
- [ ] Stripe dashboard alerts: failed webhook → email.

### PostHog

- [ ] Project receiving events (after consent). Check "Live events" view.
- [ ] Funnel for "sign up → onboarding complete" exists.

---

## 5 — First 24–48 h watch list

What to actively check during the first traffic. Plan to spend ~30 min
twice a day for the first 2 days.

| Signal | Where | Threshold for concern |
|---|---|---|
| Unhandled errors (client) | Sentry frontend project | > 1 new issue per hour, OR any issue affecting > 5 users |
| Unhandled errors (server) | Sentry backend project + Railway logs | > 1 new issue per hour, OR any 5xx response in Railway logs |
| Healthcheck failures | Railway dashboard | Any failure (audit caught one during the audit window) |
| Function timeouts | Vercel logs | Any function over 9.5 s (default timeout is 10 s) |
| DB write rate to `subscription` | Supabase SQL `pg_stat_user_tables` | n_tup_upd growing > 100 / day (would indicate PR #435 isn't working) |
| Stripe webhook failures | Stripe dashboard | Any failed delivery |
| Image optimisation errors | Vercel logs grep "INVALID_IMAGE_OPTIMIZE" | More than the known release-cover ones |
| LCP regression | PageSpeed Insights on `/[locale]/<test-username>` mobile | > 6 s for a fully-populated profile |

---

## 6 — Known issues and how to detect them

Things the audit identified but did NOT fix. None of these are launch
blockers. If you see one in the wild, here's how to know.

### Issue A — External release covers render as 💿 emoji

**Symptom**: artist's release section shows the emoji `💿` instead of the
actual cover art. Affects releases pointing at Spotify
(`i.scdn.co`), Beatport (`geo-media.beatport.com`), Apple Music, Google
Search thumbnails (`encrypted-tbn0.gstatic.com`).

**Root cause**: those hosts aren't in `images.remotePatterns` in
`apps/web/next.config.ts`. Next/Image responds `400
INVALID_IMAGE_OPTIMIZE_REQUEST`, the `onError` handler in
`ReleaseCoverImage.tsx` falls back to the emoji.

**Fix when ready** (1-line change per host):

```ts
remotePatterns: [
  { protocol: 'https', hostname: imagesHostname },
  { protocol: 'https', hostname: 'i.scdn.co' },
  { protocol: 'https', hostname: 'geo-media.beatport.com' },
  { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
  // For Shopify / Printful merch (PR follow-up):
  { protocol: 'https', hostname: 'cdn.shopify.com' },
  { protocol: 'https', hostname: '**.printful.com' },
]
```

**Why deferred**: the audit was scoped to LCP. The cover IS the LCP element
on every page; release covers are below the fold. The emoji fallback
already protects UX from looking broken. Real fix is a 10-minute PR
when convenient.

### Issue B — TBT regression on PageSpeed (150 ms → 930 ms)

**Symptom**: PageSpeed mobile Total Blocking Time score went from green
(150 ms) to red (930 ms) after PR #436.

**Root cause**: combination of (a) forced reflow during `next/image fill`
hydration, (b) decode work for images that now actually finish loading
within the Lighthouse measurement window.

**Detection**: re-run PageSpeed on `https://stagelink.art/en/robertinoc`
2–3 times. If TBT stabilises between 300–600 ms, it was largely lab
noise. If consistent 800+ ms, the issue is real.

**User-visible impact**: minimal. TBT measures the gap between FCP and
"can interact". Most public-page visitors scroll or click a link well
after that window closes.

**If it becomes a real problem**: see PR #437's leftover item "Sentry
lazy-load" — that would drop ~145 kB gzip from the page, likely
collapsing TBT regression.

### Issue C — Cache staleness on billing changes (60 s window)

**Symptom**: user upgrades from Free to Pro via Stripe Checkout. Returns
to the dashboard. Sees "Free" for up to 60 s before the cache expires.

**Root cause**: `getBillingSummary` cached via `unstable_cache` with 60 s
TTL. Cache invalidation only fires from `refreshBillingStatusAction`
(the explicit "Refresh" button on `/dashboard/billing`), not from the
post-Stripe redirect.

**Workaround for users**: click "Refresh billing status" once after
returning from Stripe.

**Real fix when ready**: add a `revalidateTag('billing:' + artistId)` to
the `startCheckoutAction` success path, and have the post-Stripe
redirect URL include a `?refresh=1` flag that triggers it server-side.
~15 LOC.

### Issue D — Imágenes de merch shipping raw

**Symptom**: artists on Pro+ with Shopify or Smart Merch (Printful) blocks
configured will see their product images served at full resolution from
Shopify CDN / Printful CDN.

**Root cause**: `ShopifyStoreRenderer.tsx` and `SmartMerchRenderer.tsx`
still use raw `<img>`. The migration was out of scope for PR #436
because adding the necessary hosts to `remotePatterns` is a config
change with broader review surface.

**User-visible impact**: products show, just heavier than they could be.
Same fix shape as Issue A — add the hosts to `remotePatterns`, then
migrate the renderers.

### Issue E — Orphaned Railway Postgres

**Symptom**: bill from Railway includes a Postgres instance that the
app isn't using (production DB is Supabase).

**Detection**: Railway → Postgres service → Metrics. CPU ~0, memory
flat. Audit confirmed this is unused.

**Fix**: verify by `SELECT * FROM pg_stat_user_tables` returning empty
rows (or "realtime" schema rows only). Then drop the Railway Postgres
service.

### Issue F — PageSpeed shows 1.3 MB "unused JavaScript"

**Symptom**: PageSpeed report flags `1320 KiB` of unused JS.

**Composition**: ~145 kB gzip is Sentry SDK core (irreducible for error
capture). The rest is React + Next.js runtime + framework code, also
mostly irreducible.

**User-visible impact**: minor on warm cache (it's cached after first
visit). Real impact only on cold-cache mobile first-load.

**If problem**: Sentry lazy-load is the lever (see post-mortem).

---

## 7 — Rollback recipes

If something breaks under real traffic, here's the fastest path back.

### Roll back a single perf PR

Each perf PR is independently revertible. From GitHub:

1. Open the PR (#430, #432, ..., #436).
2. Click the "Revert" button at the bottom of the merged PR.
3. Merge the auto-generated revert PR.
4. Vercel + Railway redeploy automatically.

Each PR's blast radius:

| PR | If reverted, you lose | Risk to revert |
|---|---|---|
| #430 | Dashboard nav cache, form feedback, bundle optimization | Low |
| #432 | Optimized cover/avatar/release on public page | Low — falls back to raw `<img>` |
| #433 | Lazy-loaded settings tabs + EpkEditor | Low — they just load eagerly again |
| #434 | PostHog code-split (compliance risk!) | **Medium** — losing this means PostHog ships to all visitors, possible GDPR issue |
| #435 | Backend write optimization | Low — restores the wasteful `upsert` |
| #436 | Gallery image optimization | Low — falls back to raw `<img>`, 12 MB per page |

### Healthcheck failure on Railway

Symptom: Railway shows "Network → Healthcheck" failed; production stays
on the old deployment. Audit hit this once.

1. Click the failed deployment in Railway → "View logs".
2. Most likely: env var typo or missing var. Re-verify section 0 above.
3. **The audit hit this specifically with `AWS_S3_PUBLIC_BASE_URL`** —
   stripping `https://` breaks Joi validation and the API refuses to start.
4. Fix the env var. Railway auto-redeploys.
5. Old deployment kept serving the whole time, so users saw no downtime.

### Vercel build failure

Symptom: PR build fails, latest production stays on previous deploy.

1. Vercel → Project → Deployments → click the failed one → "View logs".
2. Most common cause: env var change (`NEXT_PUBLIC_*` is build-time-inlined).
3. Fix and retry.

### Stripe webhook failures

Symptom: subscription changes don't reflect in app.

1. Stripe dashboard → Developers → Webhooks → check delivery status.
2. If `secret` rotated, update `STRIPE_WEBHOOK_SECRET` in Railway.
3. Replay failed events from Stripe.

---

## Final pre-launch sign-off

Before flipping DNS / marketing campaign / etc.:

- [ ] All sections 0–4 above ticked
- [ ] No new Sentry issues in the past 1 h with traffic on staging
- [ ] One test purchase end-to-end in live Stripe mode
- [ ] One test public profile loaded from a fresh-cache mobile device
- [ ] Backup-and-restore drill done at least once (per `docs/final-qa-task-6-restore-drill.md`)
- [ ] Decided who is on first-day on-call
- [ ] Decided on the rollback criteria (e.g. "if error rate > 1% for > 10 min, revert and post-mortem")

🤖 Generated with [Claude Code](https://claude.com/claude-code)
