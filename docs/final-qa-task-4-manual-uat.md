# Final QA Task 4 - Manual UAT Pass

Status: implemented for Codex-assisted UAT evidence
Last checked: 2026-05-02

## Scope

Run a UAT pass with at least one artist/operator perspective and record the
findings in the Section 9 UAT table.

This task focuses on product friction and release confidence. It complements,
but does not replace, a final subjective product-owner pass before launch.

## Evidence

Production UAT automation was run against the canonical production domain:

```bash
PLAYWRIGHT_BASE_URL=https://stagelink.art \
E2E_DEMO_ARTIST=free-artist-qa \
CI=true \
PLAYWRIGHT_OUTPUT_DIR=/tmp/stagelink-task4-uat-results \
PLAYWRIGHT_HTML_REPORT=/tmp/stagelink-task4-uat-report \
pnpm test:e2e:uat
```

Result:

| Check              | Result                              |
| ------------------ | ----------------------------------- |
| Auth entry UI      | Passed                              |
| Public artist flow | Passed with optional skips          |
| Mobile public flow | Passed with optional skips          |
| Public a11y checks | Passed                              |
| Total              | 17 passed, 7 skipped, 0 failed      |
| Report             | `/tmp/stagelink-task4-uat-report/`  |
| Raw results        | `/tmp/stagelink-task4-uat-results/` |

The first local attempt failed before reaching StageLink because Chromium could
not launch inside the macOS sandbox. The same command was rerun outside the
sandbox and passed.

## Persona Coverage

| Persona            | Flow                                                       | Result |
| ------------------ | ---------------------------------------------------------- | ------ |
| New artist         | Landing, pricing, signup and login entry points            | Passed |
| Fan / visitor      | Published demo artist profile, public content and CTAs     | Passed |
| Mobile visitor     | Public profile and public journey under mobile viewport    | Passed |
| Keyboard user      | Public navigation, focus ring and mobile menu reachability | Passed |
| Screen reader/a11y | Public WCAG checks and landmarks                           | Passed |

## Findings

No P0 or P1 UAT issues were found in this pass.

Recorded Section 9 entries:

| ID      | Persona       | Flow                      | Severity | Status |
| ------- | ------------- | ------------------------- | -------- | ------ |
| UAT-004 | New artist    | Landing to auth entry     | P3       | closed |
| UAT-005 | Fan / visitor | Public artist inspection  | P3       | closed |
| UAT-006 | Operator      | Product-owner copy review | P2       | open   |

`UAT-006` is intentionally open as a subjective product review item. It is not
a launch blocker unless the product owner finds P0/P1 friction.

## Closure Criteria

Task 4 is closed when:

- this UAT evidence is merged;
- there are no open P0/P1 UAT issues in Section 9;
- the product owner understands that final subjective copy/trust review remains
  available as a non-blocking launch polish pass.
