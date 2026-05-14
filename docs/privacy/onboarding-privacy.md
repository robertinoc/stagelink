# Onboarding Privacy UX

Status: Privacy Plan - onboarding transparency baseline.
Date: 2026-05-14

StageLink onboarding should build trust without turning setup into a legal
screen. The current UX adds a small localized privacy note below the onboarding
card and changes the note by step.

## Current Onboarding Model

File: `apps/web/src/features/onboarding/components/OnboardingWizard.tsx`

| Step        | Data                 | Privacy cue           | User expectation                                     |
| ----------- | -------------------- | --------------------- | ---------------------------------------------------- |
| Artist name | display name         | Public when published | This can appear on the public artist page.           |
| Username    | public URL slug      | Public when published | This becomes part of the public StageLink URL.       |
| Categories  | artist category tags | Private setup         | Used to set up the profile and can be changed later. |
| Avatar      | optional image       | Public when published | Optional image can appear across public surfaces.    |

## Copy Strategy

Good onboarding privacy copy should:

- appear close to the data entry step;
- use one short sentence;
- explain public/private impact;
- avoid GDPR/legal terms;
- remind users they can edit later when true.

Avoid:

- blocking setup with policy text;
- asking broad consent during onboarding for unrelated processing;
- hiding public URL implications until after setup;
- implying a profile is live before it is published.

## Remaining UX Gaps

- Page builder and EPK publishing should also show clear visibility labels.
- The profile editor should show which fields feed public page, EPK, and
  Insights.
- If integrations become OAuth-based, onboarding should not ask for broad
  provider access before the user understands why.

## Recommended Future Improvements

- Add localized onboarding strings to the shared i18n message files instead of a
  local copy map.
- Add a "preview what fans see" step before first publication.
- Add small `Public`, `Private`, and `Used for Insights` badges to profile
  fields.
- Add a first-run privacy checklist after onboarding, not during it.
