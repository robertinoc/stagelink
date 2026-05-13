# DSAR Compliance Checklist

## GDPR

- [x] Access request supported.
- [x] Rectification request supported for account name fields.
- [x] Erasure request supported with anonymization/deletion strategy.
- [x] Portability supported through structured JSON.
- [x] Consent withdrawal supported through cookie preferences.
- [x] Authenticated-only flows.
- [x] Privacy-safe request logging.
- [x] Rate limiting on DSAR endpoints.
- [ ] WorkOS step-up authentication for destructive actions.
- [ ] Provider-side deletion automation.
- [ ] Admin DSAR dashboard.

## CCPA/CPRA

- [x] Right to know/access mapped to JSON export.
- [x] Right to delete mapped to erasure endpoint.
- [x] Right to correct mapped to update endpoint.
- [x] Opt-out for analytics/marketing tracking handled through consent UI.
- [ ] Formal "Do Not Sell/Share" statement in public policy once marketing tools exist.

## Testing Checklist

- [ ] Authenticated user can download JSON export.
- [ ] Unauthenticated user cannot access `/api/privacy/export`.
- [ ] Export does not include third-party tokens or raw object keys.
- [ ] User can update first and last name.
- [ ] Delete button requires exact email confirmation.
- [ ] Deletion signs the user out.
- [ ] Deleted account cannot access dashboard again.
- [ ] Public page disappears for sole-owner deleted workspaces.
- [ ] Shared workspace membership removal does not delete co-owned data.
- [ ] Rate limit returns 429 after abuse threshold.

## Edge Cases

- User with no artist workspace.
- User with shared artist membership.
- User with active Stripe subscription.
- User with uploaded assets.
- User with insights connections.
- User with fan subscribers.
