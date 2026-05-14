# Integrations Transparency

Status: Privacy Plan - integrations transparency UX baseline.
Date: 2026-05-14

This document defines how StageLink should explain connected providers in UI.

## Product Rule

Every integration settings area should explain:

- what access is requested or configured;
- why StageLink needs it;
- what data is read or displayed;
- what StageLink does not do;
- where to disconnect or remove the reference.

## Current Dashboard Transparency

Privacy Settings now includes provider transparency cards for:

| Provider   | Current user-facing explanation                                                                                                               | Key limitation to preserve                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Spotify    | Used for artist Insights such as public profile references, follower signals, monthly listeners, top markets, and top tracks where available. | StageLink does not post to or manage Spotify accounts.           |
| YouTube    | Used for channel Insights like subscriber, view, and video performance signals.                                                               | StageLink does not upload, edit, or delete videos.               |
| SoundCloud | Currently a public profile reference while full sync remains on roadmap.                                                                      | No full SoundCloud account management is active today.           |
| Shopify    | Used to show selected storefront products on public pages.                                                                                    | StageLink does not collect card details or run Shopify checkout. |
| Printful   | Used to validate Smart Merch products and make selected merch available in blocks.                                                            | Saved API token is not exposed publicly.                         |

## Integration Settings UX Requirements

- Show provider role before asking for tokens or URLs.
- Keep token hints explicit: stored server-side, not shown publicly.
- Explain public output, such as merch cards or platform metrics.
- Give disconnect controls clear labels.
- Avoid vague "connect account" copy when the current flow is only a public URL
  or API token reference.
- Update Privacy Settings copy when provider scopes change.

## Future TODOs

- Add provider-specific "What we read / What we do not do" accordions inside
  each integration settings page.
- Add disconnect confirmation copy that explains local deletion and provider-side
  revocation limits.
- Add OAuth scope preview before any future Spotify/YouTube/SoundCloud OAuth
  consent screen.
- Add a connected provider summary to data export.
