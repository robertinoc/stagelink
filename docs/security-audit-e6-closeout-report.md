# StageLink - Security Audit E6: Closeout Report

Fecha: 2026-05-13

Estado: cerrado.

## Objetivo

Este documento cierra formalmente el proyecto **Security Audit** de StageLink.
Consolida evidencia, fixes aplicados, decisiones aceptadas y backlog residual
para launch/T7-8.

Alcance de E6:

| Tarea                      | Estado  | Evidencia                                |
| -------------------------- | ------- | ---------------------------------------- |
| T6.1 Security audit report | Cerrado | Este documento.                          |
| T6.2 Security checklist    | Cerrado | `docs/security-audit-e6-checklist.md`    |
| T6.3 Security architecture | Cerrado | `docs/security-audit-e6-architecture.md` |
| T6.4 Security baseline     | Cerrado | `docs/security-audit-e6-baseline.md`     |
| T6.5 Update `CLAUDE.md`    | Cerrado | Indice y notas recientes actualizadas.   |

## Resumen ejecutivo

La auditoria de seguridad cubrio el stack real de StageLink:

- Next.js web app en Vercel;
- NestJS API en Railway;
- WorkOS/AuthKit/Radar para auth;
- PostgreSQL/Prisma;
- S3/R2-compatible storage para assets;
- Stripe webhooks/billing;
- Upstash Redis para roles Behind;
- GitHub Actions, Vercel y Railway como capa CI/CD e infra.

Resultado:

- E1 Discovery: cerrado.
- E2 Security Audit: cerrado de E2.1 a E2.15.
- E3 Critical Hardening: cerrado.
- E4 Advanced Hardening: cerrado.
- E5 Infra & CI/CD Security: cerrado.
- E6 Documentation & closeout: cerrado con este PR.

StageLink queda apto para continuar hacia Audit 360 / Privacy Plan y luego T7-8
Launch Productivo, con backlog residual documentado y no bloqueante para MVP /
private QA.

## Secciones cerradas

| Seccion                       | Estado            | Resultado principal                                                                          |
| ----------------------------- | ----------------- | -------------------------------------------------------------------------------------------- |
| E1 Setup & Discovery          | Cerrado           | Stack, arquitectura, flujos criticos y servicios externos mapeados.                          |
| E2.1 Auth & Sessions          | Cerrado con fixes | WorkOS AuthKit, callback/returnTo, JWT validation y usuarios inactivos endurecidos.          |
| E2.2 Authorization            | Cerrado con fix   | Ownership, IDOR/BOLA y aislamiento multi-tenant revisados; analytics cross-tenant corregido. |
| E2.3 API Security             | Cerrado con fixes | Validacion, XSS/injection, URLs y rate limits revisados.                                     |
| E2.4 Frontend Security        | Cerrado con fixes | Rendering, token exposure y redirects revisados.                                             |
| E2.5 DB & Data Security       | Cerrado con fixes | Roles, sensitive data y exposicion cross-user revisados.                                     |
| E2.6 Secrets & Config         | Cerrado con fixes | `.env`, hardcoded secrets y public/private vars revisadas.                                   |
| E2.7 Infra & Headers          | Cerrado con fixes | HSTS, headers, CORS y CSP baseline documentados.                                             |
| E2.8 Dependencies             | Cerrado con fixes | Vulnerability scan, upgrades y Dependabot revisados.                                         |
| E2.9 Repo & CI/CD             | Cerrado con fixes | GitHub Actions, artifacts y secrets CI endurecidos.                                          |
| E2.10 Webhooks Security       | Cerrado con fixes | Stripe signature verification, replay/idempotency y errores genericos.                       |
| E2.11 Upload / Asset Security | Cerrado con fixes | MIME, size, signed URLs, public/private posture y ownership.                                 |
| E2.12 WorkOS/Radar/AuthKit    | Cerrado con fixes | Redirects, issuer, auth methods, Radar y MFA posture documentados.                           |
| E2.13 Behind/Admin            | Cerrado con fixes | Owner/admin roles, access control, search exposure y auditability.                           |
| E2.14 Error Handling          | Cerrado con fixes | 5xx genericos, paths sin querystrings, request IDs seguros.                                  |
| E2.15 Monitoring / Incidents  | Cerrado con fixes | `security_event=...`, alertas minimas y runbooks operativos.                                 |
| E3 Critical Hardening         | Cerrado           | Auth/session, ownership, sanitizacion, secrets, headers y endpoints inseguros.               |
| E4 Advanced Hardening         | Cerrado           | Rate limiting, uploads, anti-abuse y tenancy avanzado.                                       |
| E5 Infra & CI/CD Security     | Cerrado           | Timeouts, workflow inputs, secret management, env separation y storage posture.              |

## Fixes mas importantes

### Auth y sesiones

- AuthKit signup/signin usan rutas dedicadas y return paths seguros.
- Backend valida JWTs contra WorkOS JWKS y exige claims minimos de usuario y
  sesion.
- Usuarios suspendidos o soft-deleted quedan bloqueados aunque el token sea
  criptograficamente valido.
- WorkOS callback no expone errores crudos al usuario.

### Autorizacion y tenancy

- Recursos privados quedan protegidos por `OwnershipGuard` y/o
  `MembershipService`.
- Tenant resources no autorizados mantienen comportamiento 404 para reducir
  enumeracion.
- Public analytics descarta IDs de block/smartLink que no pertenecen al artista
  o no estan activos.
- Behind/admin usa owner/admin roles y mutaciones owner-only.

### API, input validation y XSS/injection

- `ValidationPipe` global mantiene whitelist/forbid/transform.
- URLs externas relevantes quedan restringidas a `http`/`https`.
- Localized content y block configs tienen caps/allowlists.
- Mensajes 4xx se sanitizan y 5xx se vuelven genericos.

### Uploads/assets

- Object keys los genera el servidor.
- Extension canonica deriva del MIME validado, no del filename original.
- Upload intents tienen min/max size por kind.
- `confirmUpload` verifica objeto real en S3/R2 con `HEAD`.
- Bucket/CDN publico queda aceptado solo para media artistica publica.

### Webhooks/billing

- Stripe webhooks usan raw body + signature verification.
- Replay tolerance explicita: 300s.
- Idempotencia por `stripe_webhook_events.stripe_event_id`.
- Stale events no pisan estados mas nuevos.

### Infra, CI/CD y secrets

- GitHub Actions mantiene token read-only por defecto.
- `actions/checkout` usa `persist-credentials: false`.
- Jobs tienen timeouts.
- Artifacts Playwright excluyen `.auth`.
- Workflow manual de Final QA evita interpolar inputs directamente en shell.
- Dependabot y `pnpm security:audit` quedan activos.

### Monitoring e incident readiness

- Logs de seguridad estructurados con `security_event=...`.
- Rate-limit y exception logs no guardan querystrings.
- Runbooks definidos para login attacks, uploads sospechosos, API abuse,
  webhooks y Behind/admin incidents.

## Riesgos aceptados

Estos puntos no bloquean MVP/private QA, pero deben revisarse antes de trafico
publico sostenido:

| Prioridad | Riesgo / decision aceptada                                                                                                                       | Target                          |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------- |
| P1        | Rate limiting sigue in-memory. Migrar a Redis/Upstash/Vercel KV antes de paid acquisition o trafico sostenido.                                   | T7-8 / Launch                   |
| P1        | MFA global esta diferido; definir MFA para owners/admins antes de operadores externos o public launch amplio.                                    | WorkOS / Launch                 |
| P1        | Observability externa/alertas automaticas aun no esta conectada. Hay runbooks y logs, pero alertas son manuales.                                 | T7-8                            |
| P1        | Railway Hobby no tiene backups automaticos. Activar Railway Pro/backups al public launch o primeros 100 usuarios, segun decision ya documentada. | T7-8                            |
| P1        | DB staging dedicada sigue pendiente. Pruebas destructivas, stress y restore drills reales quedan bloqueados hasta tener ambiente dedicado.       | T7-8                            |
| P1        | Confirmar `STRIPE_WEBHOOK_SECRET` por environment y marcado sensible antes de billing real.                                                      | Launch checklist                |
| P2        | Branch protection/ruleset debe exigir CI verde antes de merge a `main`.                                                                          | GitHub settings                 |
| P2        | Asset lifecycle cleanup para objetos pending/viejos no esta automatizado.                                                                        | Storage roadmap                 |
| P2        | Magic-byte/AV scanning queda diferido mientras solo se acepten imagenes publicas controladas.                                                    | Upload roadmap                  |
| P2        | Behind user search sigue client-side para MVP/admin-only; server-side pagination/search cuando crezca la base.                                   | Behind V2                       |
| P2        | Vista owner-only de `audit_logs` / `behind:role_audit` pendiente.                                                                                | Behind V2                       |
| P3        | DB row-level security no esta habilitado; app-level tenancy es suficiente hoy.                                                                   | Audit 360 / future architecture |

## No-go conditions para launch publico amplio

Antes de abrir StageLink a trafico publico sostenido, no deberian quedar sin
decision:

- backups automaticos o recovery plan real sobre DB productiva;
- monitoreo externo con alertas para `security_event=http.error`,
  `rate_limit.exceeded`, webhook failures y WorkOS admin detections;
- decision MFA para owners/admins;
- rate limiting compartido si hay mas de una instancia o paid acquisition;
- branch protection/ruleset con CI obligatorio;
- staging DB o ambiente dedicado para pruebas destructivas/stress/restore.

## Evidencia principal

Documentos fuente:

- `docs/security-audit-e1-discovery.md`
- `docs/security-audit-e2-auth-sessions.md`
- `docs/security-audit-e2-authorization.md`
- `docs/security-audit-e2-api-security.md`
- `docs/security-audit-e2-frontend-security.md`
- `docs/security-audit-e2-db-data-security.md`
- `docs/security-audit-e2-secrets-config.md`
- `docs/security-audit-e2-infra-headers.md`
- `docs/security-audit-e2-dependencies.md`
- `docs/security-audit-e2-repo-ci-cd.md`
- `docs/security-audit-e2-webhooks-security.md`
- `docs/security-audit-e2-file-upload-asset-security.md`
- `docs/security-audit-e2-workos-authkit-config.md`
- `docs/security-audit-e2-admin-behind-security.md`
- `docs/security-audit-e2-error-handling-info-leakage.md`
- `docs/security-audit-e2-security-monitoring-incident-readiness.md`
- `docs/security-audit-e3-critical-hardening.md`
- `docs/security-audit-e4-advanced-hardening.md`
- `docs/security-audit-e5-infra-ci-cd-security.md`

## Decision final

El proyecto **Security Audit** queda cerrado para esta fase. Los hallazgos
criticos fueron corregidos o convertidos en decisiones/backlog explicito. El
siguiente paso logico es continuar con **Audit 360** y **Privacy Plan** antes de
volver a T7-8 Launch Productivo.
