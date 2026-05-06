# Final QA Task 7 - Evidence Artifact Workflow

Status: implemented
Last checked: 2026-05-06

## Scope

Add a manual GitHub Actions workflow that captures final QA evidence artifacts
without changing the normal push/PR CI pipeline.

This closes the Section 9 follow-up for a reusable final QA evidence trail.

## Workflow

Workflow file:

```text
.github/workflows/final-qa-evidence.yml
```

Trigger:

```text
workflow_dispatch
```

Inputs:

| Input           | Default                 | Purpose                                     |
| --------------- | ----------------------- | ------------------------------------------- |
| `base_url`      | `https://stagelink.art` | Public URL to validate.                     |
| `demo_artist`   | `free-artist-qa`        | Published demo artist used by public flows. |
| `run_final_e2e` | `true`                  | Runs `pnpm test:e2e:final` when enabled.    |
| `run_dry_runs`  | `true`                  | Records performance/data dry-run evidence.  |

## Evidence Captured

The workflow uploads one artifact named:

```text
final-qa-evidence-<github-run-id>
```

The artifact can include:

- `summary.md`;
- `dry-run-evidence.md`;
- Playwright HTML report;
- Playwright test results.

## Safety

The workflow is manual only and does not run on pull requests or push events.

Default evidence is production-safe:

- `pnpm test:e2e:final` uses only smoke, auth UI, public, mobile and public
  accessibility projects.
- Performance evidence uses `pnpm perf:load -- --dry-run`.
- Data evidence uses backup/restore dry-runs only.
- No live stress test is run.
- No live backup or restore is run.

## How To Run

1. Open GitHub Actions.
2. Select `Final QA Evidence`.
3. Click `Run workflow`.
4. Keep defaults for production public evidence, or set a staging/custom URL.
5. Download the `final-qa-evidence-<run-id>` artifact after completion.

## Validation

Local validation performed on 2026-05-06:

```bash
pnpm exec prettier --check .github/workflows/final-qa-evidence.yml docs/final-qa-task-7-evidence-workflow.md
pnpm typecheck
```

The workflow remains unexecuted until manually triggered from GitHub Actions.
