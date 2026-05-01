# StageLink — QA Scenarios

Manual test flows for pre-release validation. Run against a local dev environment
seeded with `pnpm --filter @stagelink/api db:seed`.

**Test accounts (after running seed + creating WorkOS users):**

| Account         | Email                           | Plan     | Username            |
| --------------- | ------------------------------- | -------- | ------------------- |
| Free Artist     | `free@qa.stagelink-seed.dev`    | free     | `free-artist-qa`    |
| Pro Artist      | `pro@qa.stagelink-seed.dev`     | pro      | `pro-artist-qa`     |
| Pro Plus Artist | `proplus@qa.stagelink-seed.dev` | pro_plus | `proplus-artist-qa` |

---

## 1. Onboarding Flow

**Goal:** New user signs up, sees dashboard, completes first steps.

1. Sign in as any seed account.
2. ✅ Verify: Dashboard loads without error.
3. ✅ Verify: Artist username is visible in the sidebar/header.
4. ✅ Verify: Page blocks are visible on the dashboard.
5. Open `http://localhost:3000/{username}` in an incognito tab.
6. ✅ Verify: Public page loads and shows artist name, bio, and links block.
7. ✅ Verify: StageLink branding promo slot is visible for `free-artist-qa`.
8. ✅ Verify: No StageLink branding for `proplus-artist-qa` (pro_plus plan removes branding).

---

## 2. Public Artist Page

**Goal:** Any visitor can view a published artist page.

1. Open `http://localhost:3000/free-artist-qa` (unauthenticated).
2. ✅ Verify: Page renders — artist name, bio, links block visible.
3. ✅ Verify: StageLink promo slot is shown at the bottom.
4. Open `http://localhost:3000/proplus-artist-qa`.
5. ✅ Verify: Text block, links block, and music embed block all render.
6. ✅ Verify: No StageLink promo slot.
7. Open `http://localhost:3000/nonexistent-username`.
8. ✅ Verify: 404 page is shown (not a crash).

---

## 3. Dashboard — Block Editing

**Goal:** Artist can add, reorder, and delete blocks from their dashboard.

1. Sign in as `free@qa.stagelink-seed.dev`.
2. Navigate to Dashboard → Blocks/Page editor.
3. Edit the existing "Links" block — change one link URL.
4. ✅ Verify: Change saves without error.
5. Open the public page in a new tab.
6. ✅ Verify: Updated link URL is visible on the public page.
7. Add a new "Text" block.
8. ✅ Verify: New block appears in the editor with correct position.
9. Delete the new block.
10. ✅ Verify: Block is removed from the editor and from the public page.

---

## 4. Email Capture

**Goal:** Visitor can subscribe via an email capture block.

1. Open `http://localhost:3000/pro-artist-qa` in an incognito tab.
2. Scroll to the email capture block.
3. Enter a test email (e.g., `visitor@test.com`) and check the consent checkbox.
4. Click "Subscribe".
5. ✅ Verify: Success message is displayed (not an error).
6. Sign in as `pro@qa.stagelink-seed.dev` and navigate to Subscribers.
7. ✅ Verify: `visitor@test.com` appears in the subscriber list.
8. Attempt to subscribe again with the same email.
9. ✅ Verify: No duplicate is created (idempotent behavior or friendly error).

---

## 5. Smart Link Resolution

**Goal:** Smart links route visitors to platform-specific destinations.

1. Navigate to `http://localhost:3000/smart-links/{smart-link-id}` (get ID from dashboard).
2. ✅ Verify: Platform selector page appears showing Spotify, Apple Music, YouTube options.
3. Click "Spotify".
4. ✅ Verify: Redirect goes to `open.spotify.com` (or a 404 since it's test data, not a crash).
5. Sign in as `pro@qa.stagelink-seed.dev`.
6. Navigate to Smart Links in the dashboard.
7. ✅ Verify: "New Single" smart link is listed.
8. Edit the smart link — add a new destination (e.g., SoundCloud).
9. ✅ Verify: New destination appears in the smart link.

---

## 6. PRO Feature Gating — Custom Domain

**Goal:** Custom domain settings are accessible for Pro/Pro Plus but blocked for free.

1. Sign in as `free@qa.stagelink-seed.dev`.
2. Navigate to Settings → Custom Domain.
3. ✅ Verify: Upgrade prompt is shown (not an error, not a blank page).
4. Sign in as `pro@qa.stagelink-seed.dev`.
5. Navigate to Settings → Custom Domain.
6. ✅ Verify: Custom domain input is available (Pro plan unlocks `custom_domain`).

---

## 7. PRO+ Feature Gating — Analytics

**Goal:** Analytics dashboard is visible for Pro Plus, gated for Free.

1. Sign in as `free@qa.stagelink-seed.dev`.
2. Navigate to Analytics.
3. ✅ Verify: Upgrade prompt is shown (free plan: `analytics_pro = false`).
4. Sign in as `proplus@qa.stagelink-seed.dev`.
5. Navigate to Analytics.
6. ✅ Verify: Analytics dashboard loads with charts (seeded 90-day data).
7. ✅ Verify: Page view counts are non-zero (seed data created `isQa=true` events).
8. ✅ Verify: Country breakdown chart is visible.

---

## 8. EPK (Electronic Press Kit)

**Goal:** Pro Plus artist can publish and share an EPK.

1. Sign in as `proplus@qa.stagelink-seed.dev`.
2. Navigate to EPK in the dashboard.
3. ✅ Verify: Pre-seeded EPK data is shown (headline, bio, press quote, highlights, media).
4. Verify the "Featured media" section shows 3 items (YouTube, Spotify, SoundCloud).
5. ✅ Verify: All 3 media items have correct provider badges.
6. Click "Preview EPK" or open `http://localhost:3000/proplus-artist-qa/epk`.
7. ✅ Verify: Public EPK page loads with all sections rendered.
8. ✅ Verify: Press quote is shown in the italic block.
9. ✅ Verify: Highlights grid shows all 6 items.
10. ✅ Verify: Featured media section renders with clickable links.
11. Open `http://localhost:3000/proplus-artist-qa/epk/print`.
12. ✅ Verify: Print view renders in light mode (white background, dark text).
13. ✅ Verify: Print footer ("Shared via StageLink" / "Print view") is hidden in print mode.

---

## 9. EPK — Add/Edit Media

**Goal:** EPK editor correctly handles featured media CRUD.

1. Sign in as `proplus@qa.stagelink-seed.dev`.
2. Navigate to EPK editor.
3. ✅ Verify: Featured media section shows 3 existing items.
4. Click "Add media link".
5. Enter title: `Test Mix`, URL: `https://soundcloud.com/test/mix`.
6. ✅ Verify: Provider auto-detects as "SoundCloud".
7. Click "Add" to confirm.
8. ✅ Verify: New item appears in the list (4 total).
9. Click "Remove" on the first item.
10. ✅ Verify: Item is removed (3 total remain).
11. Save the EPK.
12. ✅ Verify: Save succeeds without error.

---

## 10. EPK — Highlights (Regression: Add First Highlight)

**Goal:** Artists with no highlights can add the first one.

1. Sign in as `free@qa.stagelink-seed.dev`.
2. Navigate to EPK editor (if available on free plan, otherwise use `proplus` and clear highlights).
3. Delete all existing highlights until the list is empty.
4. ✅ Verify: "Add highlight" button is visible (regression: was missing when list was empty).
5. Click "Add highlight".
6. ✅ Verify: An empty text input appears.
7. Type a highlight (e.g., `Sold out debut show`).
8. ✅ Verify: Text input is focused and accepts input.
9. Add a second highlight.
10. ✅ Verify: Button label changes to "Add another highlight".

---

## 11. Plan Upgrade Flow

**Goal:** Artist can upgrade from free to pro via Stripe Checkout.

> **Note:** Requires a Stripe test-mode environment. Use Stripe test card: `4242 4242 4242 4242`.

1. Sign in as `free@qa.stagelink-seed.dev`.
2. Navigate to Settings → Billing.
3. ✅ Verify: Current plan shows "Free".
4. Click "Upgrade to Pro".
5. ✅ Verify: Redirects to Stripe Checkout (not a crash or 500 error).
6. Complete checkout with test card `4242 4242 4242 4242`.
7. ✅ Verify: Redirects back to the dashboard.
8. ✅ Verify: Plan now shows "Pro" (subscription webhook processed).
9. Navigate to Custom Domain settings.
10. ✅ Verify: Custom domain input is now available (unlocked by Pro plan).

---

## 12. Subscription Cancellation

**Goal:** Canceling a subscription maintains access until period end.

> **Requires:** Active Stripe subscription from scenario 11.

1. Sign in as an artist with an active Pro subscription.
2. Navigate to Settings → Billing.
3. Click "Cancel subscription".
4. ✅ Verify: Confirmation dialog appears.
5. Confirm cancellation.
6. ✅ Verify: Plan shows "Pro (cancels on {date})".
7. ✅ Verify: Pro features (custom domain) still accessible until period end.
8. ✅ Verify: `cancel_at_period_end = true` in the database (check via Prisma Studio).

---

## 13. Asset Upload (Avatar / Cover)

**Goal:** Artist can upload avatar and cover images.

1. Sign in as any seed account.
2. Navigate to Profile/Settings.
3. Click the avatar upload area and select a JPEG file < 5 MB.
4. ✅ Verify: Upload progress indicator is shown.
5. ✅ Verify: Avatar updates after upload (no reload required).
6. Navigate to the public page.
7. ✅ Verify: New avatar is visible on the public page.
8. Upload a cover image.
9. ✅ Verify: Cover image is visible on the public page.
10. Try uploading a file > 5 MB.
11. ✅ Verify: File size error is shown (not a server crash).
12. Try uploading a non-image file (e.g., `.pdf`).
13. ✅ Verify: File type error is shown (magic bytes validation).

---

## 14. Smart Link Ownership Guard (Security)

**Goal:** Artist cannot modify another artist's smart links.

1. Create a smart link as `pro@qa.stagelink-seed.dev` (note the smart link ID from the URL).
2. Sign in as `free@qa.stagelink-seed.dev`.
3. Send a PATCH request to `/api/smart-links/{id}` (from step 1) using the free artist's session.
4. ✅ Verify: Response is `403 Forbidden` or `404 Not Found` (not a successful update).
5. Verify in the database that the pro artist's smart link was NOT modified.

---

## 15. Analytics Quality Flags

**Goal:** Bot and QA traffic is correctly flagged and excluded from the dashboard.

1. Open `http://localhost:3000/free-artist-qa` with the header `X-SL-QA: 1`.
2. Sign in as `free@qa.stagelink-seed.dev` and open Analytics.
3. ✅ Verify: The visit from step 1 does NOT appear in the page view count.
4. Open the page with a bot user-agent (e.g., `Googlebot/2.1`).
5. ✅ Verify: The bot visit is flagged `is_bot_suspected=true` in the DB and excluded from charts.
6. Open the page normally from a browser.
7. ✅ Verify: The normal visit IS counted in the dashboard.

---

## 16. Security Regression Probes

**Goal:** Validate Section 6 security basics and abuse protections after deploy.

1. Call any protected API endpoint without `Authorization`.
2. ✅ Verify: Response is `401` with the shared error envelope.
3. Call an artist/page/block endpoint as a user who is not a member of that artist.
4. ✅ Verify: Response is `403 Forbidden` or resource-safe `404 Not Found`.
5. POST `/api/public/events/link-click` with `artistId="' OR 1=1 --"`.
6. ✅ Verify: Response is `400`; no analytics event is created.
7. POST `/api/public/events/link-click` with `<script>` in `linkItemId`.
8. ✅ Verify: Response is `400`; no analytics event is created.
9. GET `/api/public/smart-links/not-a-cuid/resolve?platform=ios`.
10. ✅ Verify: Response is `400`; the service layer is not reached.
11. Resolve a real SmartLink CUID through `/api/public/smart-links/{id}/resolve?platform=ios`.
12. ✅ Verify: Response is `{ url }` or expected `404` if inactive/missing.
13. Send 121 public event/resolve requests from the same IP in under 60 seconds.
14. ✅ Verify: Requests over quota return `429`.
15. Send 21 upload-intent requests as the same authenticated user in under 60 seconds.
16. ✅ Verify: Requests over quota return `429`.
17. Attempt repeated password login in WorkOS hosted auth.
18. ✅ Verify: WorkOS applies its configured brute-force protection/challenge.

---

## 17. Performance Regression Probes

**Goal:** Validate Section 7 load, stress and scalability behavior after deploy.

1. Confirm the test target is local or staging, not production, unless a production test window is approved.
2. Run a dry plan:
   `PERF_WEB_URL={web-url} PERF_API_URL={api-url} PERF_DEMO_ARTIST={username} pnpm perf:load -- --dry-run`.
3. ✅ Verify: Route mix includes web home, public artist page, API health and public page API.
4. Run load:
   `PERF_WEB_URL={web-url} PERF_API_URL={api-url} PERF_DEMO_ARTIST={username} pnpm perf:load`.
5. ✅ Verify: p95 <= 1000 ms and error rate <= 1%.
6. Run scalability in staging:
   `PERF_WEB_URL={web-url} PERF_API_URL={api-url} PERF_DEMO_ARTIST={username} pnpm perf:scalability`.
7. ✅ Verify: p95 and p99 grow predictably across stages; no sustained 5xx response pattern.
8. Run stress only during an approved staging window:
   `PERF_WEB_URL={web-url} PERF_API_URL={api-url} PERF_DEMO_ARTIST={username} pnpm perf:stress`.
9. ✅ Verify: first breakpoint is understood, failures are controlled, and services recover after load stops.
10. Store JSON results outside git with `PERF_OUTPUT=performance-results/{run-name}.json`.

---

## 18. Data & Reliability Probes

**Goal:** Validate Section 8 data correctness and recovery readiness.

1. Run data validation against local or staging:
   `DATABASE_URL={db-url} pnpm data:validate`.
2. ✅ Verify: The command exits `0` and reports `StageLink data integrity: pass`.
3. If findings appear, review `docs/data-reliability-section-8.md` for severity and remediation order.
4. Run backup dry-run:
   `DATABASE_URL={db-url} pnpm data:backup:dry-run`.
5. ✅ Verify: The printed command uses `pg_dump --format=custom --no-owner --no-acl`.
6. Run backup during an approved staging window:
   `DATABASE_URL={db-url} pnpm data:backup -- --execute --output-dir backups`.
7. ✅ Verify: A `.dump` file is created outside git and its path/timestamp are recorded.
8. Restore into a disposable local/approved database:
   `TARGET_DATABASE_URL=postgresql://localhost:5432/stagelink_restore pnpm data:restore:check -- --execute --backup {dump-file}`.
9. ✅ Verify: Restore completes, post-restore `pnpm data:validate` passes, and critical row counts match the source snapshot.

---

## 19. UAT & Final QA Probes

**Goal:** Validate Section 9 release readiness with real-user journeys and a
final non-mutating smoke pass.

1. Confirm the target domain and environment:
   `PLAYWRIGHT_BASE_URL=https://stagelink.art`.
2. Run UAT automation:
   `E2E_DEMO_ARTIST={published-demo-artist} pnpm test:e2e:uat`.
3. ✅ Verify: landing, pricing, signup/login, public artist, mobile and public
   accessibility checks pass.
4. Run final pre-release smoke:
   `PLAYWRIGHT_BASE_URL=https://stagelink.art E2E_DEMO_ARTIST={published-demo-artist} pnpm test:e2e:final`.
5. ✅ Verify: no production-mutating project is included in the run.
6. Complete the manual UAT issue table in `docs/uat-final-qa-section-9.md`.
7. ✅ Verify: no open P0/P1 remains before launch sign-off.

---

## Critical Edge Cases Checklist

- [ ] Artist with no published blocks → public page shows empty state (not 500)
- [ ] Artist with no EPK → `/username/epk` returns 404 (not a crash)
- [ ] Subscription `past_due` → features downgraded to free (billing guard works)
- [ ] Upload rate limit: POST 21+ upload intents in 60s → 429 after the 20th
- [ ] Public rate limit: POST/GET 121+ public event/resolve requests in 60s → 429 after the 120th
- [ ] CORS: Cross-origin POST without valid Origin header → 403
- [ ] X-Request-ID: Present on every API response header
- [ ] EPK with 0 highlights → "Add highlight" button is visible (regression check)
- [ ] EPK with 6 media items → "Add media link" button is hidden (max reached)
- [ ] Security Section 6: Review `docs/security-testing-section-6.md` and validate WorkOS brute-force settings before final launch sign-off.
- [ ] Performance Section 7: `pnpm perf:load` passes against staging before launch sign-off.
- [ ] Performance Section 7: `pnpm perf:stress` is never run against production without `PERF_ALLOW_PROD_STRESS=true` and an approved test window.
- [ ] Data Section 8: `pnpm data:validate` passes against staging before launch sign-off.
- [ ] Data Section 8: first backup/restore drill is run only after the full testing plan is complete and uses a disposable restore DB.
- [ ] UAT Section 9: `pnpm test:e2e:uat` passes against staging or production preview data.
- [ ] UAT Section 9: manual UAT issue table is reviewed and has no open P0/P1.
- [ ] Final QA Section 9: `pnpm test:e2e:final` passes against `https://stagelink.art` before launch sign-off.

---

## Known QA Follow-ups

- [ ] Review WorkOS hosted-auth flakiness in staging E2E before final launch sign-off.
      Current status: non-blocking. The `main` CI run after PR #213 passed staging E2E and production smoke, but Playwright reported one flaky retry in `e2e/auth/auth.setup.ts` before succeeding. If this repeats, consider replacing hosted UI login in CI with a more deterministic authenticated setup flow or increasing auth setup observability.
