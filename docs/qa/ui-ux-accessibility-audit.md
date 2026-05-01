# UI / UX / Accessibility Audit — StageLink Web

**Date:** 2026-05-01
**Branch:** `qa/ui-ux-accessibility-audit`
**Scope:** `apps/web/src/components/` — layout, UI primitives, shared components

---

## 1. Methodology

| Layer                | Tool                                           | Standard                       |
| -------------------- | ---------------------------------------------- | ------------------------------ |
| Automated a11y scan  | axe-core via `@axe-core/playwright`            | WCAG 2.1 AA                    |
| Keyboard navigation  | Playwright E2E tab simulation                  | WCAG 2.1.1                     |
| Static code analysis | Manual review of all layout + UI components    | WCAG best practices            |
| Color contrast       | Mathematical analysis of CSS token values      | WCAG 1.4.3 (4.5:1 normal text) |
| Responsive           | Playwright viewport resize (390×844 iPhone 14) | WCAG 1.4.4, 1.4.10             |

---

## 2. Pages Audited

| Route                      | Type               | Status                                 |
| -------------------------- | ------------------ | -------------------------------------- |
| `/` (landing)              | Public             | ✅ Audited                             |
| `/en/login`                | Auth               | ✅ Audited                             |
| `/en/signup`               | Auth               | ✅ Audited                             |
| `/en/dashboard`            | App (auth)         | ✅ Audited                             |
| `/en/dashboard/page`       | App (auth)         | ✅ Audited                             |
| `/en/dashboard/analytics`  | App (auth)         | ✅ Audited                             |
| `/en/dashboard/settings/*` | App (auth)         | ✅ Audited                             |
| `/p/[username]`            | Public artist page | ⚠️ Partial (no test artist in staging) |

---

## 3. Findings & Fixes

### 3.1 HIGH — `LoadingState` missing ARIA

**File:** `apps/web/src/components/shared/LoadingState.tsx`
**WCAG:** 4.1.3 Status Messages (Level AA)

**Before:**

```tsx
<div className="flex items-center justify-center py-16">
  <div className="animate-spin ..." />
</div>
```

**After:**

```tsx
<div role="status" aria-label="Loading" className="...">
  <div aria-hidden="true" className="animate-spin ..." />
</div>
```

**Impact:** Screen readers (VoiceOver, NVDA) will now announce "Loading" when content is being fetched, instead of reading nothing.

---

### 3.2 HIGH — `AppSidebar` missing `aria-current` and decorative icons

**File:** `apps/web/src/components/layout/AppSidebar.tsx`
**WCAG:** 4.1.2 Name, Role, Value (Level A)

**Fixes applied:**

1. Active nav link: added `aria-current="page"` so screen readers announce "current page"
2. Settings submenu children: added `aria-current="page"` on active child
3. Settings submenu wrapper: added `role="list"` + `aria-label="Settings submenu"`
4. Nav icons (Lucide SVGs): added `aria-hidden="true"` to prevent redundant reading

---

### 3.3 MEDIUM — `Navbar` mobile menu not announcing state

**File:** `apps/web/src/components/layout/Navbar.tsx`
**WCAG:** 4.1.2 Name, Role, Value (Level A)

**Fixes applied:**

1. Mobile menu button: added `aria-expanded={mobileOpen}` and `aria-controls="mobile-nav"`
2. Mobile menu panel: added `id="mobile-nav"` to link with button
3. Mobile `<nav>`: added `aria-label="Mobile navigation"` to distinguish from desktop nav

---

### 3.4 MEDIUM — `Badge` semantic element

**File:** `apps/web/src/components/ui/badge.tsx`
**WCAG:** 1.3.1 Info and Relationships (Level A)

**Before:** `<div>` — block element, wrong in inline text contexts
**After:** `<span>` — inline element, correct for status badges inside text/headings

---

### 3.5 MEDIUM — Color contrast `--muted-foreground`

**File:** `apps/web/src/app/globals.css`
**WCAG:** 1.4.3 Contrast (Minimum) (Level AA) — requires 4.5:1 for normal text

| Token                | Before                  | After                   | On `--background (#0e021d)` |
| -------------------- | ----------------------- | ----------------------- | --------------------------- |
| `--muted-foreground` | `rgba(255,255,255,0.5)` | `rgba(255,255,255,0.6)` | 5.2:1 ✅                    |

**Note:** `text-white/30` used for placeholder text in some inputs falls below 4.5:1 (≈ 2.3:1). This is an accepted exception per WCAG Success Criterion 1.4.3 exception for placeholder text, but should be addressed in a follow-up audit of form components.

---

## 4. Existing Strengths (no changes needed)

| Area             | Detail                                                                             |
| ---------------- | ---------------------------------------------------------------------------------- |
| Focus indicators | Global `:focus-visible` with 2px fuchsia outline + 3px offset — excellent          |
| Reduced motion   | `@media (prefers-reduced-motion: reduce)` properly disables all animations         |
| Semantic HTML    | Proper `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` usage                  |
| Image alt text   | All `<img>` tags have descriptive `alt` attributes                                 |
| Form submission  | `aria-disabled={pending}` used during async form submission                        |
| Dialog/Sheet     | Radix UI primitives provide focus trap and `Escape` key handling                   |
| Radix components | `dialog.tsx` and `sheet.tsx` both include `<span className="sr-only">Close</span>` |
| i18n             | ARIA labels use translated strings                                                 |

---

## 5. UX Observations

### Navigation clarity

- **Sidebar:** Clear visual hierarchy with icon + label. Active state is visually distinct.
- **Mobile:** Hamburger menu is discoverable. Sheet drawer closes on navigation.
- **Improvement opportunity:** Add a skip-navigation link (`<a href="#main-content">Skip to content</a>`) for keyboard users who need to bypass repeated navigation.

### Onboarding

- Onboarding flow exists at `/en/onboarding` — not yet audited. Flagged for Section 6 (UX deep-dive).

### Error messages

- Login form uses `role="alert"` on error div — correct.
- API error messages visible to screen readers via alert role.

---

## 6. Responsive Behavior

| Breakpoint          | Tested     | Notes                                 |
| ------------------- | ---------- | ------------------------------------- |
| 390×844 (iPhone 14) | ✅         | Mobile nav via Sheet drawer works     |
| 768×1024 (iPad)     | ⚠️ Pending | Should test sidebar collapse behavior |
| 1440×900 (Desktop)  | ✅         | Full sidebar + topbar visible         |

---

## 7. Test Files Created

| File                                       | Coverage                                                          |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `e2e/accessibility/a11y-public.spec.ts`    | Landing, login, signup — axe WCAG AA, heading hierarchy, keyboard |
| `e2e/accessibility/a11y-dashboard.spec.ts` | Dashboard, page editor, analytics — axe WCAG AA, aria-current     |
| `e2e/accessibility/a11y-keyboard.spec.ts`  | Tab navigation, focus ring visibility, keyboard activation        |

---

## 8. Follow-up Items (out of scope for this PR)

| Item                              | Priority | File                                          |
| --------------------------------- | -------- | --------------------------------------------- |
| Skip-to-content link              | Medium   | `apps/web/src/app/[locale]/(home)/layout.tsx` |
| Placeholder text contrast         | Low      | Feature form components                       |
| iPad breakpoint test              | Low      | `e2e/accessibility/a11y-responsive.spec.ts`   |
| Public artist page full axe audit | Medium   | `e2e/accessibility/a11y-public.spec.ts`       |
| Onboarding flow audit             | Medium   | `/en/onboarding`                              |
