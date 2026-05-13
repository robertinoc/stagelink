# Consent Implementation Notes

Status: implementation notes for Privacy Plan E2.

## What Changed

- Replaced the old opt-out analytics consent model with explicit opt-in.
- Added granular consent categories: necessary, analytics, marketing.
- Added versioned and expiring consent storage.
- Added a modern banner and preferences modal in English and Spanish.
- Blocked PostHog initialization until analytics consent.
- Blocked client-side public link tracking before analytics consent.
- Blocked API-side public analytics persistence before analytics consent.
- Added best-effort PostHog withdrawal cleanup.
- Added documentation and validation notes under `/docs/privacy`.

## Files Changed

| Area                             | Files                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consent state                    | `apps/web/src/lib/analytics/consent.ts`                                                                                                                                     |
| Consent UI                       | `apps/web/src/features/privacy/components/ConsentManager.tsx`                                                                                                               |
| Analytics init                   | `apps/web/src/lib/analytics/PostHogProvider.tsx`, `apps/web/src/lib/analytics/posthog.ts`                                                                                   |
| Client tracking                  | `apps/web/src/lib/analytics/track.ts`                                                                                                                                       |
| Public routing/header forwarding | `apps/web/src/app/go/[id]/route.ts`                                                                                                                                         |
| API analytics gating             | `apps/api/src/modules/public/public-pages.service.ts`, `apps/api/src/modules/public/public-subscribe.service.ts`, `apps/api/src/modules/smart-links/smart-links.service.ts` |
| Translations                     | `apps/web/src/i18n/messages/en.json`, `apps/web/src/i18n/messages/es.json`                                                                                                  |
| Tests                            | `apps/web/src/__tests__/lib/analytics/consent.test.ts`, `apps/api/src/modules/public/public-pages.service.spec.ts`                                                          |

## Compliance Checklist

### GDPR

- [x] No non-essential analytics before opt-in.
- [x] Reject non-essential is available at the same layer as accept.
- [x] Granular categories exist.
- [x] Necessary category is explained and cannot be disabled.
- [x] Consent timestamp is stored.
- [x] Consent version is stored.
- [x] Consent expiration exists.
- [x] Consent withdrawal updates runtime behavior.
- [x] PostHog is not initialized before analytics consent.
- [ ] Server-side consent audit log is not implemented.
- [ ] Geo-aware consent is not implemented.
- [ ] Third-party embed click-to-load controls are not implemented.

### CCPA/CPRA

- [x] Marketing category defaults off.
- [x] No sale/share posture remains supportable if marketing pixels are absent.
- [ ] If advertising/retargeting is added, add "Do Not Sell or Share" analysis
      and UI as needed.

### Browser Testing

- [ ] Fresh browser: no `sl_consent` -> banner appears, PostHog not initialized.
- [ ] Reject: `sl_consent` exists, `sl_ac=0`, app still works.
- [ ] Accept: `sl_consent` exists, `sl_ac=1`, PostHog initializes.
- [ ] Customize analytics off: no analytics requests.
- [ ] Customize analytics on: analytics requests allowed.
- [ ] Withdraw after accept: PostHog capture disabled/reset and future events stop.
- [ ] Private browsing/storage-restricted mode does not break app.

### Mobile Testing

- [ ] Banner fits narrow viewports.
- [ ] Preferences modal scrolls within viewport.
- [ ] Switches are tappable.
- [ ] Reject/accept/customize actions remain visible.
- [ ] Floating Privacy button does not block core mobile actions.

## Future Improvements

- Geo-aware consent mode.
- Google Consent Mode if Google tags are ever added.
- IAB TCF compatibility only if ad-tech partners require it.
- Server-side consent audit log for authenticated users.
- Footer/settings entry points in addition to the floating Privacy button.
- Click-to-load placeholders for high-risk third-party embeds.
- Global Privacy Control support.
- Consent analytics that do not track users before consent.
