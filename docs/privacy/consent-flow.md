# Consent Flow

Status: implemented baseline.

## First Visit

1. Browser loads StageLink.
2. `ConsentManager` reads `sl_consent`.
3. If no current valid record exists:
   - banner is shown;
   - analytics and marketing stay disabled;
   - PostHog is not initialized;
   - public analytics events are not persisted.

## User Choices

### Accept All

Enables:

- Necessary
- Analytics
- Marketing

Effects:

- Writes `sl_consent`.
- Writes `sl_ac=1`.
- Dispatches `stagelink:consent-changed`.
- `PostHogProvider` initializes PostHog.
- Client-side link tracking and backend public analytics are allowed.

### Reject Non-Essential

Enables:

- Necessary only

Effects:

- Writes `sl_consent`.
- Writes `sl_ac=0`.
- Dispatches `stagelink:consent-changed`.
- PostHog remains disabled or is opted out/reset if previously initialized.
- Public pages, auth, onboarding, and dashboard still work.

### Customize Preferences

Users can toggle:

- Analytics
- Marketing

Necessary remains on and disabled in the UI.

## Reopening Settings

After a choice is saved, a small Privacy button remains available so users can
reopen preferences and withdraw consent.

Future UX improvement:

- Add a footer/settings link that calls the same preferences modal.

## Tracking Blocking Rules

| Flow                            | Before analytics consent     | After analytics consent      |
| ------------------------------- | ---------------------------- | ---------------------------- |
| PostHog browser init            | Blocked                      | Allowed                      |
| Public link-click PostHog event | Blocked                      | Allowed                      |
| Public link-click API event     | Blocked                      | Allowed                      |
| Public page view local DB event | Blocked                      | Allowed                      |
| Public page view PostHog event  | Blocked                      | Allowed                      |
| SmartLink resolution analytics  | Blocked                      | Allowed                      |
| Fan capture subscriber creation | Allowed when form rules pass | Allowed when form rules pass |
| Fan capture analytics event     | Blocked                      | Allowed                      |
| WorkOS/AuthKit cookies          | Allowed                      | Allowed                      |

## Multilingual UX

Consent UI strings live in:

- `apps/web/src/i18n/messages/en.json`
- `apps/web/src/i18n/messages/es.json`

Namespace:

- `privacy.consent`

## Accessibility Notes

- Banner uses `role="region"` and an accessible label.
- Preferences use the existing Radix Dialog implementation.
- Optional categories use `role="switch"` and `aria-checked`.
- Reject, customize, and accept are presented with comparable visual access.

## Known Limitations

- Geo-aware consent is not implemented yet; the GDPR-first posture applies
  globally.
- Consent records are cookie-based, not server-side audit records.
- Current floating Privacy button should eventually be complemented by footer
  and account settings entry points.
