# Visibility Model

Status: Privacy Plan - visibility and exposure UX baseline.
Date: 2026-05-14

This model defines how StageLink should label public, private, connected, and
analytics-derived information.

## Visibility Labels

| Label                    | Meaning                                                            | Example surfaces                                         |
| ------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------- |
| Public                   | Visible to anyone once published or shared                         | artist page, public links, published EPK                 |
| Public when published    | Not live yet, but intended for a public surface                    | onboarding name/username/avatar, page blocks, EPK fields |
| Private                  | Visible only to authenticated user/team/admins with a valid reason | account details, billing, DSAR records                   |
| Only visible to you/team | Tenant-scoped workspace data                                       | drafts, analytics dashboards, integration settings       |
| Shared with integrations | Sent to or read from a connected provider                          | Spotify/YouTube/SoundCloud/Shopify/Printful settings     |
| Optional analytics       | Collected only after valid analytics consent where required        | public page analytics, PostHog browser events            |

## Current UX Improvements

- Onboarding now shows step-level public/private notes.
- Privacy Settings includes "How your data is used" and integration cards.
- Privacy Settings is reachable from dashboard settings and the expanded
  Settings sidebar.

## Exposure Hotspots

| Surface                | Risk                                                                         | UX requirement                                                   |
| ---------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Artist profile         | Users may not realize profile fields feed public page, EPK, and Insights     | Add field-level visibility badges in future profile editor work. |
| EPK                    | Booking, management, rider, location, and availability data can be sensitive | Show strong but calm publish/share labels.                       |
| Public page blocks     | Links, embeds, contact blocks, and merch can expose business details         | Show public/draft state clearly in builder.                      |
| Analytics dashboard    | Metrics are private to workspace but derived from visitor behavior           | Avoid over-specific low-volume breakdown labels.                 |
| Connected integrations | Users may not know what provider data StageLink reads                        | Keep provider cards and settings helper text updated.            |

## Future UI Requirements

- Add `Public` / `Draft` badges to page-builder and EPK publish controls.
- Add "Visible on public page" labels to profile fields reused publicly.
- Add "Used for Insights" labels near Spotify/YouTube/SoundCloud references.
- Add a "View as public" preview before first publication.
- Add provider disconnect copy that distinguishes local disconnect from provider
  account revocation.
