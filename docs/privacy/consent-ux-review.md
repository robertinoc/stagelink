# Consent UX Review

Status: Privacy Plan - consent UX baseline and validation.
Date: 2026-05-14

This review covers cookie/analytics consent UX and the new dashboard-level
preference controls.

## Current Consent UX

Files:

- `apps/web/src/features/privacy/components/ConsentManager.tsx`
- `apps/web/src/features/privacy/components/PrivacyRightsPanel.tsx`
- `apps/web/src/lib/analytics/consent.ts`

Current behavior:

- necessary cookies are always on;
- analytics and marketing are off by default;
- banner shows Reject, Customize, and Accept;
- preferences modal includes category details and reject/save/accept actions;
- dashboard Privacy Settings lets users turn analytics and marketing on/off;
- Reject optional tracking is available from dashboard;
- PostHog browser initialization depends on analytics consent.

## UX Compliance Check

| Check                                      | Status                                                           |
| ------------------------------------------ | ---------------------------------------------------------------- |
| Reject visible from banner                 | Pass                                                             |
| Customize visible from banner              | Pass                                                             |
| Accept visible from banner                 | Pass                                                             |
| Optional categories off by default         | Pass                                                             |
| Consent settings discoverable after banner | Improved: floating privacy button and dashboard Privacy Settings |
| No forced consent for account usage        | Pass                                                             |
| Withdrawal possible                        | Pass for optional cookie/browser analytics                       |
| Product analytics account-level preference | Gap: lawful-basis/preference model still pending                 |

## Dark Pattern Risks

| Risk                                          | Severity | Current mitigation                                                             |
| --------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| Accept visually overwhelms reject             | Medium   | Reject is present in banner and modal; future visual QA should confirm parity. |
| Floating settings button missed               | Medium   | Privacy Settings now includes consent controls.                                |
| Users think all analytics stops               | High     | Dashboard copy distinguishes optional analytics from necessary/security logs.  |
| Future marketing pixels added without consent | High     | Marketing category remains off and documented as future-only.                  |

## Recommendations

- Keep Reject non-essential visible wherever Accept all appears.
- Do not pre-check analytics/marketing.
- Retest banner and dashboard consent after SDK or copy changes.
- Add Global Privacy Control support if marketing/advertising expands.
- Add account-level product analytics preference if StageLink chooses a
  preference/consent model for authenticated product analytics.
