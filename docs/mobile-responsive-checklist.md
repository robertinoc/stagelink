# StageLink — Mobile Responsive QA Checklist

## Breakpoints to test

| Width   | Device                              |
| ------- | ----------------------------------- |
| 320px   | iPhone SE (1st/2nd gen)             |
| 375px   | iPhone 14, iPhone 6/7/8, SE 3rd gen |
| 390px   | iPhone 14 Pro / 15                  |
| 414px   | iPhone Plus / Max                   |
| 768px   | Tablet portrait                     |
| 1024px+ | Desktop                             |

## How to test

Open Chrome DevTools → **Toggle device toolbar** (`Cmd+Shift+M`), then manually type each width above in the dimensions field. Test interactions (scrolling, button taps, dropdowns) at each breakpoint.

## Dashboard sections to validate

| Section                | Route                                     | Key components                                                                          |
| ---------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------- |
| Dashboard home         | `/dashboard`                              | `DashboardWelcome`, card grid                                                           |
| My Page (block editor) | `/dashboard/page`                         | `BlockManager`, `BlockRow`, `BlockConfigForm`                                           |
| Analytics              | `/dashboard/analytics`                    | `AnalyticsDashboard`, `RangeSelector`, `SummaryCards`, `SparkBars`, `InsightsDashboard` |
| Profile                | `/dashboard/profile`                      | `ArtistProfileSettings`, `ProfileBasicInfo`, `ProfileGallerySection`                    |
| EPK                    | `/dashboard/epk`                          | `EpkEditor`, media grids, rider dialogs                                                 |
| Settings               | `/dashboard/settings`                     | `SettingsOverviewGrid`                                                                  |
| Help                   | `/dashboard/help`                         | `FaqItem` list                                                                          |
| Billing                | `/dashboard/billing` (settings sub-route) | Plans & pricing tables                                                                  |

---

## Common overflow culprits checklist

**Containers**

- [ ] No fixed `width: Npx` on containers (use `w-full`, `max-w-full`)
- [ ] No `min-width` that exceeds mobile viewport without wrapping
- [ ] No `width: 100vw` inside padded containers (use `w-full` instead)
- [ ] `overflow-hidden` on cards that contain truncated/wrapping content
- [ ] `min-w-0` on flex children that should shrink (prevents text overflow pushing width)

**Grids**

- [ ] All grids have responsive prefixes (`grid-cols-1 md:grid-cols-N`)
- [ ] No bare `grid-cols-2` or higher without at least an `sm:` prefix

**Flex layouts**

- [ ] All flex rows either wrap (`flex-wrap`) or scroll internally (`overflow-x-auto`)
- [ ] Flex children with `flex-1` also have `min-w-0` when they contain truncated text

**Tables**

- [ ] All tables wrapped in `overflow-x-auto` div
- [ ] `w-full` set on `<table>` element

**Charts & embeds**

- [ ] All charts use `width="100%"` or a responsive wrapper (no fixed pixel widths)
- [ ] Video embeds (YouTube/Vimeo) use `padding-top: 56.25%` aspect-ratio wrapper
- [ ] Music embeds (Spotify/SoundCloud) use `width="100%"` on `<iframe>`
- [ ] No `<svg>` with fixed `width` attribute that isn't also `viewBox`-capable (use `className="w-full"` instead)

**Forms & inputs**

- [ ] All `<input>`, `<select>`, `<textarea>` have `w-full`
- [ ] Label/input pairs stack vertically on mobile

**Modals & dialogs**

- [ ] Modals are scrollable on mobile (`overflow-y-auto max-h-[90vh]`)
- [ ] Dialog content does not have a fixed width wider than 100vw minus safe margins
- [ ] Type picker grids inside dialogs use `grid-cols-1 sm:grid-cols-2`

**Touch targets**

- [ ] Interactive elements are at least 44×44 CSS px
- [ ] Adequate spacing between tappable items (min 8px)

---

## What NOT to do

- **Do not** add `overflow-x: hidden` to `body`, `html`, or layout wrappers as a blanket fix — this hides broken layouts instead of fixing them, breaks sticky positioning, and can hide important scrollable content
- **Do not** use fixed pixel widths on containers
- **Do not** skip `flex-wrap` on horizontal flex layouts that contain text labels
- **Do not** put `shrink-0` on the only flex child in a row — the parent will overflow

---

## Acceptance criteria

- [ ] No horizontal scroll at 320px, 375px, 390px, 414px on any dashboard section
- [ ] Charts resize fluidly from 320px to full width — no horizontal bar appears
- [ ] Tables scroll internally (not causing page-wide scroll)
- [ ] Embeds (YouTube/Vimeo/Spotify/SoundCloud) maintain aspect ratio on all widths
- [ ] Action button rows wrap cleanly — no clipping at page edge
- [ ] Desktop layout (1024px+) is visually unchanged
- [ ] TypeScript check (`pnpm --filter @stagelink/web typecheck`) passes

---

## Phase 4 fixes applied (2025-05-16)

The following issues were identified and fixed:

| File                                       | Issue                                                                                                                                                                     | Fix                                                                                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppShell.tsx`                             | Main content flex column had no `min-w-0`, causing content to extend beyond viewport width; desktop `p-6` applied even on mobile                                          | Added `min-w-0` to content column; reduced padding to `p-4` on mobile (`p-4 sm:p-6`)                                                                                            |
| `BlockManager.tsx` — `BlockRow`            | Card had no `overflow-hidden`; action buttons row was nested inside the top flex row, causing overflow when buttons wrapped; block type icon/thumbnail missing `shrink-0` | Added `overflow-hidden w-full max-w-full` to Card; moved action buttons to a separate full-width row below the content row with `flex-wrap`; added `shrink-0` to icon/thumbnail |
| `BlockManager.tsx` — `CreateBlockDialog`   | Block type picker used `grid-cols-2` without responsive prefix — overflows on 320px inside the modal                                                                      | Changed to `grid-cols-1 sm:grid-cols-2`                                                                                                                                         |
| `AnalyticsDashboard.tsx` — `RangeSelector` | The `flex gap-1` container holding the date range buttons had no `flex-wrap`, causing the entire range selector to overflow on 375px and below                            | Added `flex-wrap` to the range button container                                                                                                                                 |
| `ProfileBasicInfo.tsx`                     | Artist category picker used bare `grid-cols-2` — overflows on very narrow screens                                                                                         | Changed to `grid-cols-1 sm:grid-cols-2`                                                                                                                                         |
