# Transparency Copy

Status: Privacy Plan - product transparency copy baseline.
Date: 2026-05-14

This document captures StageLink's preferred user-facing privacy language.
Public policy language can be more formal; product UI should stay short,
friendly, and precise.

## Tone Rules

- Say "what happens" instead of "pursuant to".
- Say "you control it" only when the control exists.
- Say "public when published" instead of "publicly disclosed".
- Say "optional analytics" instead of "tracking technologies" in product UI.
- Avoid "anonymous" unless re-identification is not reasonably possible.

## Approved UI Copy Patterns

| Context                | Preferred copy                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| Public profile         | "This can appear on your public page when you publish."                                           |
| Private account data   | "This stays private and is used to run your account."                                             |
| EPK                    | "EPK content can include booking and rider details. Publish only what you are ready to share."    |
| Analytics              | "We count visits, clicks, and fan capture totals to help you understand your page."               |
| Optional analytics off | "Public tracking stays off unless you allow analytics."                                           |
| Integrations           | "StageLink uses this provider only for the feature you connect."                                  |
| Provider limits        | "StageLink does not post to or manage this account."                                              |
| Export                 | "Download a structured copy of your StageLink data."                                              |
| Delete                 | "This is irreversible. Some security, billing, and legal records may remain for limited periods." |

## Current Product Copy Surfaces

- Consent banner and modal: `privacy.consent`.
- Privacy dashboard: `dashboard.settings.privacy`.
- Onboarding note: `OnboardingWizard.tsx`.
- Settings navigation: `dashboard.settings.navigation.privacy`.

## Copy Risks

| Risk                                                                   | Severity | Fix                                                                    |
| ---------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| Claiming analytics is anonymous while stable identifiers exist         | High     | Use "aggregated" or "pseudonymous" only where accurate.                |
| Saying providers are disconnected when only local settings are removed | High     | Say what local disconnect does and whether provider revocation exists. |
| Saying deletion removes everything                                     | Critical | Keep limited-retention caveat for billing/security/provider logs.      |
| Overloading onboarding                                                 | Medium   | Keep one sentence per step.                                            |

## Spanish Copy Notes

Spanish UI currently uses a familiar LATAM tone (`gestioná`, `podés`, `activá`).
Keep it consistent and avoid mixing formal Spanish with heavily legal wording.
