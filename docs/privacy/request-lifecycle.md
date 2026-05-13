# DSAR Request Lifecycle

## Statuses

| Status      | Meaning                                                                     |
| ----------- | --------------------------------------------------------------------------- |
| `received`  | Request exists but has not been verified. Reserved for future manual flows. |
| `verified`  | Authenticated user identity has been verified by session.                   |
| `completed` | Request was processed successfully.                                         |
| `rejected`  | Request was not processed. Reserved for future manual flows.                |
| `failed`    | Processing failed. Reserved for future retry/manual review.                 |

## Current Automated Lifecycle

1. Authenticated user starts export, rectification, or erasure.
2. API creates `dsar_requests` with `verified` status.
3. API processes the request synchronously.
4. API updates status to `completed` and stores privacy-safe metadata.
5. API writes a security audit log.

## SLA Targets

- Self-service export: immediate JSON download.
- Self-service rectification: immediate update.
- Self-service erasure: immediate local deletion/anonymization.
- Manual provider follow-up, if needed: within 30 days for GDPR DSAR handling.

## Operational Review

Before public launch, StageLink should add an owner-only Behind view for
`dsar_requests` so support can review request volume, failures, and escalations.
