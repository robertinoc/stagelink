# Launch readiness runbook

Operational steps to finish before going public + the manual smoke tests to
run after each. The code for observability (Sentry, uptime probe) and the
billing/insights fixes already shipped — what's left here is configuration in
external dashboards (Sentry, Supabase, Railway) plus a final verification pass.

---

## 1. Activate Sentry error tracking

The SDK ships dormant — it does nothing until the DSN env vars are set.

1. In [sentry.io](https://sentry.io) create **two projects**:
   - a **Node.js** project for the API
   - a **Next.js** project for the web app
2. **Railway** → `stagelink` service → Variables:
   - `SENTRY_DSN` = the **Node** project DSN
3. **Vercel** → project → Settings → Environment Variables (Production):
   - `NEXT_PUBLIC_SENTRY_DSN` = the **Next.js** project DSN
4. _(Optional — readable stack traces via source maps)_ add in **Vercel**:
   - `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`
5. Redeploy both (Railway redeploys on var change; Vercel needs a new build).

**Manual test:**

- API: hit a route that 500s (or temporarily throw in a handler) → confirm the
  event appears in the Node project within ~1 min, tagged with `requestId`.
- Web: trigger a client error → confirm it lands in the Next.js project.
- Confirm **no** events appear before the DSN is set (dormant by default).

---

## 2. Rotate the database password

The temporary password used during the Railway fix was shared in a chat and
should be rotated before launch.

1. Supabase → Settings → Database → **Reset database password** → copy the new one.
2. Update **both** Railway vars on the `stagelink` service (same password, note
   the different host/port/user per connection type):
   - `DATABASE_URL` = `postgresql://postgres.<ref>:<NEW_PWD>@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
   - `DIRECT_URL` = `postgresql://postgres:<NEW_PWD>@db.<ref>.supabase.co:5432/postgres`
3. Redeploy. Watch the deploy log: `prisma migrate deploy` should connect to the
   **direct** host and report "No pending migrations to apply", then the API boots.

**Manual test:**

- `curl https://api.stagelink.art/api/health` → `200 {"status":"ok"}`
- Hit a DB-backed route (e.g. a public artist page) → `200`, not `500`
  (a 500 with `prepared statement "s1" already exists` means the
  `?pgbouncer=true` flag was lost on `DATABASE_URL`).

> Also update your local `apps/api/.env` so local dev keeps working.

---

## 3. Deploy + uptime alerting

- **Railway** → `stagelink` service → Settings → **Notifications**: enable
  deploy-failure alerts to your email / Slack. (Railway deploys failing silently
  was the original gap.)
- **Uptime probe (already in repo)**: `.github/workflows/uptime.yml` runs every
  10 min from `main` and emails you on failure. Trigger it once manually after
  merge: Actions → Uptime → Run workflow → confirm green.
- _(Optional, faster)_ [UptimeRobot](https://uptimerobot.com) monitor on
  `https://api.stagelink.art/api/health` for sub-5-minute detection.

---

## 4. Database capacity for the launch spike

Architecture is already spike-friendly: the API uses the Supabase **transaction
pooler** (`:6543?pgbouncer=true`), which multiplexes many client connections
over few DB connections, and Prisma connects lazily so `/api/health` survives a
saturated DB.

- Confirm the **Supabase plan**. Free caps `max_connections` (~60) with a small
  pooler `default_pool_size`; **Pro** is recommended for a launch spike.
- _(Optional)_ bound per-instance connections by appending `&connection_limit=5`
  to the Railway `DATABASE_URL` — protects the pool if you scale replicas.

---

## 5. Final smoke test (run on production, logged in)

- [ ] `/en/dashboard/settings` — 4 tabs load; switching tabs updates `?tab=` with no reload
- [ ] Plan tab shows the **correct price** for your plan (Pro+ = $19); "Manage billing" / portal opens with no `?error=checkout`
- [ ] Connections — paste a Spotify/YouTube URL → Validate shows live numbers; Connect → Analytics shows data immediately (no "—")
- [ ] Privacy — cookie toggles persist; export downloads; delete-account modal blocks until you type the email
- [ ] Switch locale to ES — copy translates; `?tab=` survives
- [ ] Public artist page + EPK render for a published artist
- [ ] Sign up / log in flow end-to-end (WorkOS)
- [ ] Mobile (< 720px) — layouts stack, nothing overflows
- [ ] Sentry receives a deliberately-triggered test error (api + web)
- [ ] Uptime workflow run is green
