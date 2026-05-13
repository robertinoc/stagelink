# StageLink - Security Audit E6: Security Checklist

Fecha: 2026-05-13

Estado: baseline de cierre.

## Uso

Checklist operativa para validar que StageLink mantiene la postura de seguridad
alcanzada al cierre del Security Audit.

Estados:

- Done: cerrado y versionado/documentado.
- Accepted: riesgo aceptado para MVP/private QA.
- Backlog: no bloqueante hoy, revisar para launch/T7-8 o roadmap.

## Auth & Sessions

| Check                                                   | Estado   | Evidencia                                         |
| ------------------------------------------------------- | -------- | ------------------------------------------------- |
| Hosted auth delegado a WorkOS/AuthKit                   | Done     | `docs/security-audit-e2-auth-sessions.md`         |
| App no almacena passwords ni reset tokens propios       | Done     | `docs/security-audit-e2-auth-sessions.md`         |
| Return paths de login sanitizados                       | Done     | `docs/security-audit-e2-auth-sessions.md`         |
| API valida JWT con WorkOS JWKS                          | Done     | `docs/security-audit-e2-workos-authkit-config.md` |
| API exige claims minimos `sub=user_*` y `sid=session_*` | Done     | `docs/security-audit-e2-workos-authkit-config.md` |
| Usuarios suspendidos/deleted quedan bloqueados          | Done     | `docs/security-audit-e2-auth-sessions.md`         |
| MFA admin/operator definido                             | Accepted | Diferido a T7-8 / launch publico                  |
| Radar production bot/brute force activo                 | Done     | `docs/security-audit-e2-workos-authkit-config.md` |

## Authorization & Multi-Tenant

| Check                                               | Estado  | Evidencia                                               |
| --------------------------------------------------- | ------- | ------------------------------------------------------- |
| `JwtAuthGuard` global en API                        | Done    | `docs/security-audit-e1-discovery.md`                   |
| `OwnershipGuard` cubre recursos privados clave      | Done    | `docs/security-audit-e2-authorization.md`               |
| `MembershipService` valida artist-scoped access     | Done    | `docs/security-audit-e2-authorization.md`               |
| Missing membership devuelve 404 en tenant resources | Done    | `docs/security-audit-e2-authorization.md`               |
| Public analytics evita IDs cross-tenant             | Done    | `docs/security-audit-e2-authorization.md`               |
| DB row-level security habilitado                    | Backlog | App-level tenancy aceptado; revisar en Audit 360/futuro |

## API Security

| Check                                                  | Estado  | Evidencia                                               |
| ------------------------------------------------------ | ------- | ------------------------------------------------------- |
| `ValidationPipe` global con whitelist/forbid/transform | Done    | `docs/security-audit-e2-api-security.md`                |
| URLs externas limitadas a `http`/`https`               | Done    | `docs/security-audit-e2-api-security.md`                |
| Block configs y localized content con caps/allowlists  | Done    | `docs/security-audit-e2-api-security.md`                |
| SQL raw parametrizado                                  | Done    | `docs/security-audit-e2-api-security.md`                |
| 5xx generic hacia cliente                              | Done    | `docs/security-audit-e2-error-handling-info-leakage.md` |
| Error `path` sin querystring                           | Done    | `docs/security-audit-e2-error-handling-info-leakage.md` |
| `X-Request-ID` sanitizado                              | Done    | `docs/security-audit-e2-error-handling-info-leakage.md` |
| General authenticated API limiter                      | Backlog | Redis/shared limiter antes de trafico sostenido         |

## Frontend Security

| Check                                                 | Estado   | Evidencia                                     |
| ----------------------------------------------------- | -------- | --------------------------------------------- |
| Rendering de contenido publico revisado por XSS       | Done     | `docs/security-audit-e2-frontend-security.md` |
| JSON-LD usa `JSON.stringify()`                        | Done     | `docs/security-audit-e2-api-security.md`      |
| Redirect/query params revisados                       | Done     | `docs/security-audit-e2-frontend-security.md` |
| Secrets server-only no expuestos como `NEXT_PUBLIC_*` | Done     | `docs/security-audit-e2-secrets-config.md`    |
| Nuevos flows preferentemente via BFF/server actions   | Accepted | Mantener como criterio de arquitectura        |

## Uploads & Assets

| Check                                             | Estado   | Evidencia                                              |
| ------------------------------------------------- | -------- | ------------------------------------------------------ |
| Uploads usan presigned URLs                       | Done     | `docs/security-audit-e2-file-upload-asset-security.md` |
| Object key server-side                            | Done     | `docs/security-audit-e2-file-upload-asset-security.md` |
| MIME allowlist + size min/max por kind            | Done     | `docs/security-audit-e2-file-upload-asset-security.md` |
| `confirmUpload` verifica objeto real en S3/R2     | Done     | `docs/security-audit-e2-file-upload-asset-security.md` |
| Bucket publico limitado a media artistica publica | Accepted | `docs/assets-s3.md`                                    |
| Lifecycle cleanup de pending/viejos               | Backlog  | Storage roadmap / T7-8                                 |
| Magic-byte/AV scanning                            | Backlog  | Antes de formatos no imagen o assets privados          |

## Webhooks & Billing

| Check                                                | Estado  | Evidencia                                     |
| ---------------------------------------------------- | ------- | --------------------------------------------- |
| Stripe webhook usa raw body + signature verification | Done    | `docs/security-audit-e2-webhooks-security.md` |
| Replay tolerance explicita                           | Done    | `docs/security-audit-e2-webhooks-security.md` |
| Idempotencia por `stripe_event_id`                   | Done    | `docs/security-audit-e2-webhooks-security.md` |
| Stale events no pisan estados mas nuevos             | Done    | `docs/security-audit-e2-webhooks-security.md` |
| Shopify inbound webhooks inexistentes hoy            | Done    | `docs/security-audit-e2-webhooks-security.md` |
| `STRIPE_WEBHOOK_SECRET` sensible por env confirmado  | Backlog | Launch checklist                              |

## Behind / Admin

| Check                                           | Estado   | Evidencia                                         |
| ----------------------------------------------- | -------- | ------------------------------------------------- |
| Behind separado por host `behind.stagelink.art` | Done     | `docs/security-audit-e2-admin-behind-security.md` |
| Owner immutable via `BEHIND_ADMIN_EMAILS`       | Done     | `docs/security-audit-e2-admin-behind-security.md` |
| Admin read-only para postura actual             | Accepted | `docs/security-audit-e2-admin-behind-security.md` |
| Mutaciones owner-only en web edge y API         | Done     | `docs/security-audit-e2-admin-behind-security.md` |
| Role changes auditados en Redis                 | Done     | `docs/security-audit-e2-admin-behind-security.md` |
| API admin mutations auditadas en DB             | Done     | `docs/security-audit-e2-admin-behind-security.md` |
| Server-side pagination/search                   | Backlog  | Behind V2                                         |
| Owner-only audit viewer                         | Backlog  | Behind V2                                         |

## Infra, CI/CD & Dependencies

| Check                                        | Estado  | Evidencia                                        |
| -------------------------------------------- | ------- | ------------------------------------------------ |
| GitHub token read-only por defecto           | Done    | `docs/security-audit-e5-infra-ci-cd-security.md` |
| `actions/checkout` sin persisted credentials | Done    | `docs/security-audit-e2-repo-ci-cd.md`           |
| CI jobs tienen timeouts                      | Done    | `docs/security-audit-e5-infra-ci-cd-security.md` |
| Playwright artifacts excluyen `.auth`        | Done    | `docs/security-audit-e2-repo-ci-cd.md`           |
| `pnpm security:audit` en CI                  | Done    | `.github/workflows/ci.yml`                       |
| Dependabot activo                            | Done    | `docs/security-audit-e2-dependencies.md`         |
| Branch protection/ruleset exige CI verde     | Backlog | GitHub settings                                  |
| Pinning de GitHub Actions por SHA            | Backlog | Compliance futuro                                |

## Monitoring & Incident Readiness

| Check                                     | Estado  | Evidencia                                                          |
| ----------------------------------------- | ------- | ------------------------------------------------------------------ |
| Logs estructurados `security_event=...`   | Done    | `docs/security-audit-e2-security-monitoring-incident-readiness.md` |
| Runbooks de incidentes documentados       | Done    | `docs/security-audit-e2-security-monitoring-incident-readiness.md` |
| Alertas minimas definidas                 | Done    | `docs/security-audit-e2-security-monitoring-incident-readiness.md` |
| Observability externa/alertas automaticas | Backlog | T7-8 / launch publico                                              |
| Retencion formal de logs                  | Backlog | T7-8 / privacy/security ops                                        |

## Data Recovery / Launch Readiness

| Check                                 | Estado   | Evidencia                                                    |
| ------------------------------------- | -------- | ------------------------------------------------------------ |
| Data validation read-only documentada | Done     | `docs/final-qa-staging-data-validation.md`                   |
| Restore drill tooling existe          | Done     | `docs/final-qa-task-6-restore-drill.md`                      |
| Railway backups automaticos           | Accepted | Diferido por plan Hobby hasta Pro/public launch/100 usuarios |
| DB staging dedicada                   | Backlog  | Necesaria antes de pruebas destructivas/stress reales        |
| Stress real con ventana y monitoreo   | Backlog  | Requiere aprobacion y observability abierta                  |

## Decision

Checklist cerrada para Security Audit. Los items `Backlog` no deben perderse:
son insumos directos para T7-8 Launch Productivo y ajustes posteriores al Audit
360 / Privacy Plan.
