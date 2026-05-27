# StageLink Audit 360 - S2 Functional Audit

Status: implemented with focused functional fixes
Last checked: 2026-05-27

## Scope

S2 covers:

- T2.1 Auth (signup/login)
- T2.2 Onboarding Flow
- T2.3 Dashboard UX + Logic
- T2.4 Artist Page (Public Profile)
- T2.5 EPK Module
- T2.6 Integrations (Spotify/YouTube/SoundCloud/etc.)
- T2.7 Analytics/Insights
- T2.8 Billing & Plans
- T2.9 Smart Merch
- T2.10 FAQ/Help

This pass reviewed the authenticated app route contracts, onboarding, dashboard
surfaces, settings/integrations, billing, analytics, EPK, page builder, and help
surface. Public artist page, API integration, billing, EPK, merch, and insights
modules already have targeted coverage and were left structurally intact.

## Findings

| ID     | Severity | Area              | Finding                                                                                                                                     | Action                                                                                                                                           |
| ------ | -------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| S2-001 | P1       | Dashboard routing | Several authenticated pages treated a failed `/api/auth/me` request as "no artist" and redirected to onboarding, or rendered `null`.        | Added a shared recoverable connection state and used it in Dashboard, Profile, My Page, EPK, Analytics, Billing, Settings, Help, and Onboarding. |
| S2-002 | P1       | Onboarding        | Onboarding rendered the creation wizard when account status could not be confirmed, which could confuse existing users during API downtime. | Onboarding now blocks with a refreshable connection state until account setup can be confirmed.                                                  |
| S2-003 | P2       | Help/FAQ          | Help guide entries and common-search chips used non-functional `#` actions.                                                                 | Guide links and common searches now jump to the matching FAQ sections.                                                                           |
| S2-004 | P2       | Billing/help      | Billing Enterprise contact and Help email/feature request used hardcoded legacy contact targets instead of the central support URL.         | Reused `SUPPORT_URL` for contact paths.                                                                                                          |
| S2-005 | P2       | Onboarding copy   | The username step still previewed `stagelink.io/...` while production is `stagelink.art`.                                                   | Updated the preview copy and test coverage to use `stagelink.art`.                                                                               |

## Notes By Task

### T2.1 Auth

AuthKit routing, login, signup, callback, signout, suspended account handling,
and Behind sign-in already have dedicated implementation and prior security QA.
No auth route changes were required in this pass.

### T2.2 Onboarding

Fixed API-unavailable behavior before the wizard starts. Username preview now
matches the canonical production domain.

### T2.3 Dashboard UX + Logic

Dashboard surfaces now distinguish account/API lookup failures from true
missing-artist onboarding state.

### T2.4 Artist Page

Public artist page SSR, loading, error, not-found, analytics quality flags, and
public page tests exist. No code change in this pass.

### T2.5 EPK Module

EPK dashboard now avoids onboarding redirects when account lookup is unavailable.
Feature limits still come from billing summary.

### T2.6 Integrations

Settings/connections now inherit the same recoverable failure behavior through
the settings loader. SoundCloud remains intentionally positioned as a coming
soon connection while SoundCloud insights components exist separately.

### T2.7 Analytics/Insights

Analytics now redirects unauthenticated access to login, redirects true
missing-artist users to onboarding, and shows a recoverable state when account
lookup fails.

### T2.8 Billing & Plans

Billing now avoids accidental onboarding redirects on account lookup failure and
uses the central support contact for Enterprise/sales intent.

### T2.9 Smart Merch

Smart Merch remains gated through settings/store tabs and entitlements. No
behavioral change was required in this pass.

### T2.10 FAQ/Help

Help guide and search shortcut controls now perform real in-page navigation
instead of no-op `#` actions.

## Verification

Local checks for this S2 PR:

```bash
pnpm --filter @stagelink/web test -- StepUsername.test.tsx
pnpm --filter @stagelink/web typecheck
```
