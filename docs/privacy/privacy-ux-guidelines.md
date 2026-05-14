# Privacy UX Guidelines

Status: Privacy Plan - Privacy UX and transparency baseline.
Date: 2026-05-14

These guidelines define how StageLink should explain privacy inside the product:
clear, calm, creator-friendly, and easy to act on. They are for product,
design, engineering, and support.

## UX Principles

- Use plain language before legal language.
- Explain public/private states at the moment a user makes a publishing choice.
- Keep consent choices balanced: Accept, Reject, and Customize must all be easy
  to find.
- Make privacy actions discoverable from Settings, not hidden in support.
- Avoid fear-based copy. Tell artists what happens and what they control.
- Do not claim data is anonymous when it is only pseudonymous or aggregated.
- Prefer short summaries with optional detail over long legal blocks.

## Privacy Settings Architecture

Primary location: `/{locale}/dashboard/settings/privacy`.

Core groups:

| Group                            | Current implementation                                                             | UX goal                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Privacy overview                 | Trust card in `PrivacyRightsPanel`                                                 | Explain that StageLink separates private account data from published artist content.  |
| Cookie and analytics preferences | Dashboard controls backed by consent helpers                                       | Let users turn optional analytics/marketing on or off without hunting for the banner. |
| How your data is used            | Transparency cards for public page, EPK, analytics, integrations, account/security | Give a short, non-scary map of processing purposes.                                   |
| Integration transparency         | Provider cards for Spotify, YouTube, SoundCloud, Shopify, Printful                 | Explain what each provider is used for and what StageLink does not do.                |
| Correct personal data            | Existing first/last name form                                                      | Support rectification without support friction.                                       |
| Download my data                 | Existing export CTA                                                                | Keep portability easy to find.                                                        |
| Delete my account                | Existing deletion card and email confirmation                                      | Keep destructive action discoverable but protected.                                   |

## Component Inventory

| Component/surface                 | File                                                                  | Purpose                                                                                 | Privacy UX notes                                                         |
| --------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Consent banner and modal          | `apps/web/src/features/privacy/components/ConsentManager.tsx`         | Banner, preferences modal, floating privacy button                                      | Equal reject/customize/accept access; optional analytics off by default. |
| Privacy settings page             | `apps/web/src/app/[locale]/(app)/dashboard/settings/privacy/page.tsx` | Central privacy area                                                                    | Uses dashboard settings shell and authenticated user context.            |
| Privacy rights/transparency panel | `apps/web/src/features/privacy/components/PrivacyRightsPanel.tsx`     | Consent controls, data-use copy, integrations transparency, export/delete/rectification | Main transparency layer for authenticated users.                         |
| Settings overview card            | `apps/web/src/app/[locale]/(app)/dashboard/settings/page.tsx`         | Privacy entry point in settings grid                                                    | Keeps privacy discoverable next to billing and integrations.             |
| Settings sidebar child            | `apps/web/src/components/layout/AppSidebar.tsx`                       | Settings subnavigation                                                                  | Adds Privacy under expanded Settings.                                    |
| Onboarding privacy note           | `apps/web/src/features/onboarding/components/OnboardingWizard.tsx`    | Lightweight per-step privacy context                                                    | Shows public/private cue without interrupting setup.                     |

## Visual Language

Use:

- short cards for explanations;
- compact badges: `Public`, `Private`, `Optional`, `On`, `Off`,
  `You control it`;
- icons for privacy concepts: shield, sliders, eye, globe, analytics, links;
- calm copy and neutral status labels.

Avoid:

- scary warning blocks except for destructive account deletion;
- long legal paragraphs inside onboarding;
- consent banners where accept is visually dominant and reject is hidden;
- vague claims such as "we respect privacy" without explaining the control.

## Accessibility and Mobile

- Controls must be keyboard reachable.
- Consent and delete dialogs must have clear titles and descriptions.
- Buttons must not rely only on color.
- Privacy cards must stack cleanly on mobile.
- Text must stay short enough for English and Spanish.

## UX Risk Analysis

### Critical

- Hidden delete/export/opt-out controls would weaken DSAR and consent
  usability.
- Misleading visibility labels could cause accidental public exposure.

### High

- Public page and EPK publishing can expose contact, rider, booking, and
  availability details if labels are unclear.
- Product analytics preference remains partly governed by policy, not a full
  account-level opt-out.
- Integration wording can become stale as OAuth scopes or sync behavior changes.

### Medium

- Privacy Settings could become too dense as more providers are added.
- Onboarding privacy notes may be missed if users move quickly.
- Floating cookie settings button may be overlooked without the dashboard
  privacy entry.

### Low

- Future privacy dashboards or health scores may be useful but are not needed
  before the core controls are clear.

## Recommendations

1. Keep Privacy Settings as the central authenticated privacy home.
2. Add visibility badges to future profile, page-builder, and EPK publish
   controls.
3. Keep provider transparency copy updated with integration changes.
4. Add privacy QA to release checks for cookie banner, privacy settings, data
   export, delete account, and login.
5. Use English/Spanish message keys for all product privacy copy.

## Future TODOs

- Real-time public/private preview for artist page and EPK.
- A simple transparency center with provider and retention summaries.
- Account-level product analytics preference if StageLink chooses consent or
  preference-based product analytics.
- Advanced permissions management for connected integrations.
- Privacy health checklist for artists before publishing an EPK.
