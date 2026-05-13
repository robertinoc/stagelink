# Cookie Policy Structure

Status: cookie classification and consent architecture. This is not final public
policy copy.

## Cookie Categories

### Strictly Necessary

Purpose:

- Authentication/session management.
- PKCE/state/CSRF protection.
- Locale and basic UI preferences.
- Security, rate limiting, and abuse prevention.

Consent posture:

- Required for the service.
- No opt-out inside the product, but users can control browser settings.

Examples to confirm:

- WorkOS session cookies.
- Auth callback/PKCE state cookies.
- `NEXT_LOCALE`.
- QA/internal cookies used only for testing should not be present in public
  shared URLs.

### Analytics

Purpose:

- Understand page visits, link clicks, public page performance, and product usage.
- Provide artists with dashboard metrics.
- Improve reliability and product decisions.

Current implementation notes:

- `sl_ac` stores analytics choice (`1` accepted, `0` rejected).
- Current docs describe absent cookie as default allow for basic analytics.
- PostHog client events are gated by analytics consent helpers.
- Local server-side analytics store consent state and quality flags.

Recommended launch posture:

- Strictly necessary operational counting may use legitimate interests only if it
  is minimal, proportionate, first-party, and transparent.
- Non-essential analytics, PostHog, cross-session behavior analytics, marketing
  analytics, or any third-party tracking should require opt-in consent for EU
  users.
- Consent choices should be granular: necessary, analytics, marketing.

### Marketing

Purpose:

- Campaign attribution, retargeting, advertising, or marketing pixels.

Current state:

- No confirmed marketing pixels should be assumed active.

Consent posture:

- Opt-in before activation.
- Include opt-out and preference controls.

## Consent UX Requirements

The cookie banner should:

- Explain categories in plain language.
- Offer Accept all, Reject non-essential, and Manage choices.
- Avoid pre-ticked non-essential categories for GDPR users.
- Persist consent with timestamp/version/category.
- Allow users to change choices later.
- Respect withdrawal of consent.
- Avoid firing non-essential scripts before consent.

## Policy Sections

Public Cookie Policy should include:

- What cookies and similar technologies are.
- Why StageLink uses them.
- Category table.
- Third-party providers.
- Consent and preference controls.
- Browser settings and opt-outs.
- Changes to the Cookie Policy.
- Contact details.

## Cookie Inventory TODO

Before publication, confirm actual cookies in production:

| Cookie/storage item | Category | Provider | Purpose | Lifetime | Notes |
| --- | --- | --- | --- | --- | --- |
| WorkOS session cookie | Necessary | WorkOS/StageLink | Auth session | TODO | Confirm exact name/lifetime |
| PKCE/state cookie | Necessary | StageLink/WorkOS | OAuth security | TODO | Confirm exact name/lifetime |
| `NEXT_LOCALE` | Necessary/preference | StageLink | Locale | TODO | Confirm lifetime |
| `sl_ac` | Analytics preference | StageLink | Analytics consent state | 365 days currently | Needs granular consent model |
| `sl_qa` | Necessary/internal QA | StageLink | QA traffic exclusion | Session | Do not use in public UX |
| PostHog cookies/local storage | Analytics | PostHog | Product analytics | TODO | Only after consent where required |

## Launch Blocker

If StageLink launches to EU users with PostHog or non-essential analytics active,
the default-allow/opt-out model should be replaced with opt-in consent or a
jurisdiction-aware consent layer.
