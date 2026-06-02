# Audit 360 — S1 Product & Positioning Audit

Date: 2026-06-02

Scope:

- T1.1 Audit Landing Page Messaging
- T1.2 Audit Value Proposition vs Product Reality
- T1.3 Audit Pricing Communication
- T1.4 Audit Competitive Positioning

## Executive Summary

S1 found that StageLink's product surface is broader than its public positioning. The landing page
still read mostly like a music-focused link-in-bio product, while the implemented product now
includes public artist pages, EPK editing, smart links, fan capture, connected platform insights,
multi-language public content, Shopify merch blocks, Printful Smart Merch, billing gates, and
privacy-aware analytics.

The main implemented fix was to move the public narrative from "one link for music" to
"booking-ready artist hub/workspace": one public artist presence for fans, bookers, press, and
collaborators.

## Findings Implemented

### S1-001 — Landing Messaging Understated Product Reality

Area: T1.1 Landing Page Messaging, T1.2 Value Proposition vs Product Reality

The hero, feature cards, problem framing, and CTA leaned on broad "music/story/one link" language.
That was not wrong, but it made StageLink look closer to generic link-in-bio tools than the product
it has become.

Implemented:

- Repositioned the landing hero around artist page, Press Kit, merch, and insights in one link.
- Replaced unsupported social-proof style copy with product-specific proof of audience and use case.
- Expanded the feature set from four broad benefits to six concrete product capabilities:
  artist page, booking-ready EPK, analytics, platform signals, merch, and localization.
- Updated EN/ES landing translations together to preserve i18n consistency.

### S1-002 — Pricing Did Not Explain Which Workflow Each Plan Buys

Area: T1.3 Pricing Communication

The pricing page listed plan features but did not explain who each plan is for or the practical
upgrade moment. Pro+ also bundled platform analytics copy without clarifying that current connected
insights rely on safe public platform data rather than private Spotify for Artists or YouTube
Analytics reports.

Implemented:

- Added plan-specific "best for" copy.
- Added billing scope copy for USD/month pricing and Stripe-managed checkout/billing.
- Added a plan scope note clarifying the current connected-platform data boundary.
- Added Pro+ feature rows for SoundCloud signals, multi-language pages, Shopify merch, and Smart
  Merch to better match the product's current entitlements and shipped surfaces.
- Linked pricing CTAs to localized signup instead of rendering inert buttons.

### S1-003 — Competitive Positioning Needed a Sharper Contrast

Area: T1.4 Competitive Positioning

StageLink already had an FAQ comparison against link-in-bio tools, but the pricing and landing
sections did not consistently carry that contrast through the page.

Implemented:

- Added pricing-page positioning copy: "More than link-in-bio, lighter than a custom website."
- Reframed the landing strip as "a product workspace, not just a link list."
- Clarified StageLink's category as a maintained workspace for public page, EPK, merch, fan capture,
  and performance signal.

## Audit Notes

### T1.1 Landing Page Messaging

The landing page now leads with the product bundle that matters most: artist page, EPK, merch, and
insights. The page still keeps the emotional artist tone, but the concrete workflow is visible in the
first viewport and repeated across the strip, problem section, features, how-it-works, and CTA.

### T1.2 Value Proposition vs Product Reality

The public narrative now reflects already-shipped or modeled product areas:

- Public artist pages and smart links
- EPK builder, templates, contacts, rider, media, and gallery
- Analytics and smart link performance
- Connected platform insights using public platform signals
- Shopify merch blocks and Printful Smart Merch
- Multi-language public page content and SEO

### T1.3 Pricing Communication

Pricing now explains both plan fit and scope. The remaining pricing risk is that public price labels
are still duplicated in marketing translations instead of being sourced from the same billing catalog
shown in the authenticated dashboard.

### T1.4 Competitive Positioning

The strongest current position is:

> StageLink is more than link-in-bio and lighter than a custom website: a maintained artist
> workspace for page, EPK, merch, fan capture, and performance signal.

## Remaining Product & Positioning Backlog

- Source public pricing display from the billing catalog or Stripe product metadata instead of static
  marketing translation strings.
- Add a compact public comparison table against "link-in-bio", "custom website", and "press kit PDF"
  once the desired competitive stance is final.
- Add screenshots or short motion previews of EPK, insights, and merch surfaces to make the feature
  claims visually inspectable.
- Replace remaining generic dashboard/auth marketing copy (`Your digital stage`, `Join thousands`)
  with the same positioning language after auth/onboarding conversion data is reviewed.
