# Settings — redesign + fixes (reference)

The dashboard **Settings** page (`/[locale]/dashboard/settings`) is a single
page with 4 sticky tabs — **Plan & Billing · Connections · Stores · Privacy &
data** — that replaced the old hub + 5 routed sub-pages. This doc records the
final architecture, what's code vs external config, and the manual test
checklist, so anyone picking this up later has the full picture.

## Architecture

- **Server page**: `apps/web/src/app/[locale]/(app)/dashboard/settings/page.tsx`
  loads everything once via `loadDashboardSettingsData(locale)` and renders
  `<SettingsTabs>`. On a data-source failure it shows `<ConnectionErrorState>`.
- **Loader**: `apps/web/src/features/dashboard/settings/settings-data.ts`
  (server) + `settings-types.ts` (pure helpers/types, client- and test-safe —
  imported by client components & unit tests without pulling the server bundle).
- **Tabs orchestrator**: `tabs/SettingsTabs.tsx` — active tab is **local state**
  for instant switching; the URL `?tab=` syncs via `window.history.replaceState`
  (Next-integrated, no server refetch). Each tab is a code-split `dynamic()`
  import.
- **Tabs**: `tabs/PlanTab.tsx`, `tabs/ConnectionsTab.tsx`, `tabs/StoresTab.tsx`,
  `tabs/PrivacyTab.tsx` + sub-component folders (`plan/`, `connections/`,
  `stores/`, `privacy/`, `shared/`).
- **Legacy routes** (`plans-billing`, `insights-connections`, `shopify-store`,
  `smart-merch`, `privacy`) are 301 redirects to `?tab=<id>` (test:
  `__tests__/features/dashboard/settings/legacy-redirects.test.ts`).
- **Gating**: `tabs/shared/SettingsUpgradeGate.tsx` (wraps `FeatureLockCta`) is
  shown when `summary.entitlements` lacks the feature (Connections needs
  `stage_link_insights`; Stores needs `shopify_integration` or `smart_merch`).
- **Reusable**: `tabs/shared/ConfirmDialog.tsx` (destructive confirms),
  `components/sl/{StickyTabs,SubHead,FieldInput}.tsx`.

## Change log by phase

### Initial redesign

- 4-tab page, sticky tab bar with live badges (plan / `N/3` connections /
  `N/2` stores), legacy redirects, full en/es i18n. PRs #392, #395, #401, #412.

### Phase 1 — frontend fixes (#440, hotfix #441)

- **i18n**: switching language preserves `?tab=` (`AppTopbar` now appends
  `useSearchParams()`).
- **Tab freeze**: instant switching (local state + `history.replaceState`)
  instead of `router.replace` which refetched billing/shopify/merch/insights on
  every click.
- **Free gating** on Connections + Stores with an upgrade CTA.
- **Stores connect fixed**: `ShopifyCard`/`PrintfulCard` call the real client
  functions (`@/lib/api/shopify`, `@/lib/api/merch`) with the correct payload
  field names (`storeDomain`/`storefrontToken`/`selectionMode`,
  `provider`/`apiToken`). The prior `{ domain, token, mode }` was rejected by
  the backend DTO → "Could not save". Disconnect now has a confirm modal +
  "Disconnecting…" state + connected/disconnected toggle.
- **Plan portal in a new tab**: `OpenPortalButton` + web proxy
  `app/api/billing/[artistId]/portal/route.ts` (`window.open`). Manual/admin
  grants (`summary.manualAccess.isActive`) no longer render the upgrade-checkout
  button that produced `?error=checkout`.
- **#441 hotfix**: added `/api/billing/` to the auth middleware matcher
  (`middleware.ts`) — the new portal proxy was 500ing because `withAuth()` threw
  without the middleware running.
- **Privacy**: green auto-clearing confirmation on personal-data save.

### Phase 3 — backend/data (#442, #443)

- **#442 usage panel**: real data instead of hardcoded placeholders.
  `buildUsage(plan, artist)` derives **languages** (distinct locales =
  `baseLocale` ∪ translation locales) and **photos** (`galleryImageUrls.length`)
  from already-loaded artist data. Metrics without real backing (smart-link
  resolutions, page counts, storage bytes) are omitted, not faked.
- **#443 Spotify metrics note**: honest amber note when a platform returns a
  valid connection but no metric numbers (see Spotify below). YouTube
  unaffected.

## Known limitations / external config (NOT code bugs)

### Plan price reads from Stripe — fix in Stripe, not code

The Plan tab shows the **real** Stripe price (`stripe.prices.retrieve`), so it
can never drift from what the user is charged. If Pro+ shows the wrong amount,
fix the price object in Stripe (or repoint the env):

- `STRIPE_PRICE_PRO_ID` = `price_1TI9LkROEH7z8GjB8KaQkaJZ`
- `STRIPE_PRICE_PRO_PLUS_ID` = `price_1TI9MAROEH7z8GjBsEG8sTYA`
- Stripe prices are immutable: to change an amount, create a new price and
  repoint the env var in Railway, then redeploy.

### Spotify followers/popularity not available

Diagnosed via a controlled Spotify Web API test with the prod app's
client-credentials: `GET /artists/{id}` returns **200 + name** but **omits
`followers`/`popularity`** for our app (`StageLink Insights`, **Development
mode**). Our provider reads the fields correctly; Spotify simply doesn't return
them for public client-credentials access. The Quota Extension that would lift
this now requires an **organization with ≥250k MAUs** (Spotify policy, May
2025), which we don't qualify for yet. The Redirect URI is irrelevant
(client-credentials doesn't use it). UI shows an honest "metrics restricted"
note (#443) rather than a silent "—". Revisit when we hit 250k MAUs.

### Usage panel — deferred metrics

Storage-in-bytes, smart-link resolution counts, and multi-page counts need new
backend queries; deferred as the panel is informational. Languages + photos are
real today.

### Tab loading is already instant

Settings tabs switch instantly (Phase 1); Analytics & EPK already use local
state; sidebar page navigation already has per-route `loading.tsx` skeletons.
No global spinner was added (would be redundant).

## Manual test checklist (prod, logged in)

- Language switch on `?tab=connections` keeps the tab.
- Tab switching is instant (no freeze).
- Free account → Connections + Stores show the upgrade gate; Pro shows the UI.
- Stores (Pro): Shopify/Printful validate + save connect for real; disconnect
  opens the confirm modal → "Disconnecting…" → toggles to disconnected.
- Plan: manual-grant accounts show "plan granted manually" (no broken checkout);
  portal buttons open Stripe in a new tab (accounts with a Stripe customer).
- Privacy: personal-data save shows a green confirmation; cookie toggles persist
  (`sl_consent`/`sl_ac`); export downloads; delete modal requires the email.
- Plan usage panel: real photo count + real active-language count (no `0`/`1`
  placeholders).
- Connections: Spotify validate shows the amber "metrics restricted" note (not
  empty); YouTube shows its numbers.
- Mobile < 720px: grids stack, tab bar scrolls, no horizontal overflow.
