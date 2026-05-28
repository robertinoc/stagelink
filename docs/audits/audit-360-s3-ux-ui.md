# Audit 360 — S3 UX/UI Audit

Date: 2026-05-28

Scope:

- T3.1 Audit Navigation & IA
- T3.2 Audit Forms & Validation UX
- T3.3 Audit States (loading/empty/error)
- T3.4 Audit Visual Hierarchy
- T3.5 Audit Mobile Experience
- T3.6 Audit Design Consistency

## Executive Summary

S3 focused on the private dashboard shell and Settings surface because those are the repeated
workflows artists use after onboarding. The main UX issue found was navigation drift: Settings was
rebuilt as a tabbed page, but the sidebar still linked to legacy subroutes and used hash-based active
state. That made sidebar IA feel inconsistent, especially on mobile where the drawer closes after a
redirect instead of landing directly on the chosen panel.

## Findings Implemented

### S3-001 — Settings Sidebar Links Pointed at Legacy Routes

Area: T3.1 Navigation & IA, T3.6 Design Consistency

The Settings sidebar submenu linked to legacy standalone routes such as
`/dashboard/settings/plans-billing` and `/dashboard/settings/shopify-store`. Those routes redirect
to `?tab=...`, while `SettingsTabs` now treats the query param as the canonical state. The sidebar
also tried to detect submenu activity through hash state, which no longer matches the page model.

Implemented:

- Sidebar Settings submenu now links directly to `?tab=plan`, `?tab=connections`, `?tab=stores`,
  and `?tab=privacy`.
- Active submenu state is resolved from the current query param, with legacy-route fallback so old
  URLs still highlight correctly while redirecting.
- Sidebar nav rendering was extracted out of the render body, removing a React Compiler warning and
  making the navigation component easier to reason about.

### S3-002 — Settings Tabs Had Extra State Sync and Tight Mobile Padding

Area: T3.5 Mobile Experience, T3.6 Design Consistency

The Settings tab component kept local state synchronized from the URL with an effect. Since the URL
is already the source of truth, this added avoidable state churn and an existing lint warning. On
mobile, the tab wrapper also added desktop-grade horizontal padding before the sticky tab bar,
leaving less room for labels.

Implemented:

- Settings tabs now derive active state directly from `?tab=`.
- The sticky tab bar uses responsive horizontal offsets/padding.
- Settings content uses smaller side padding on mobile while preserving the existing desktop rhythm.

## Audit Notes

### T3.2 Forms & Validation UX

No new form validation change was made in this section. The most relevant repeated forms already
surface inline save/error states from earlier S2/S6 work. Follow-up UX improvements should focus on
normalizing validation copy across Profile, EPK, Settings connections, and block configuration.

### T3.3 Loading/Empty/Error States

S2 and S6 already improved the largest error-state gaps. S3 verified the dashboard Settings path
degrades to `ConnectionErrorState` and the repeated tabs keep their own empty/locked states.

### T3.4 Visual Hierarchy

The Settings hierarchy is now more coherent because sidebar navigation, sticky tabs, and active
panel state all describe the same four sections.

## Remaining UX Backlog

- Normalize Settings connection/store forms around one shared field + validation component pattern.
- Audit mobile density in the larger Profile and EPK editors with browser screenshots.
- Reduce existing React Compiler warnings in older dashboard components.
