# StageLink - Security Audit E2.15: Security Monitoring / Incident Readiness

Fecha: 2026-05-13

Estado: cerrado con fixes y runbooks operativos.

## Alcance

E2.15 define la postura minima de monitoreo y respuesta ante incidentes para el
launch privado/MVP:

| Tarea                                      | Estado          | Resultado                                                                 |
| ------------------------------------------ | --------------- | ------------------------------------------------------------------------- |
| T2.15.1 Que logs mirar                     | Cerrado con fix | Eventos de seguridad quedan estructurados con `security_event=...`.       |
| T2.15.2 Alertas minimas                    | Cerrado con doc | Se define una matriz de alertas para auth, abuse, webhooks, uploads y CI. |
| T2.15.3 Runbooks de respuesta a incidentes | Cerrado con doc | Se documentan acciones para login attacks, uploads sospechosos y abuso.   |

## Fixes aplicados

### Eventos de seguridad estructurados

Se agrego `apps/api/src/common/utils/security-log.ts` para emitir logs
parseables y sanitizados:

```text
security_event=rate_limit.exceeded {"namespace":"upload-intent","path":"/api/assets/upload-intent","limit":20}
```

Propiedades:

- remueve saltos de linea, tabs y carriage returns;
- trunca campos a 256 caracteres;
- remueve querystrings de claves `path`/`url`;
- conserva metadata no sensible para buscar en Railway/Vercel logs.

### Rate-limit logs sin querystrings

Los guards de rate limit ya no loguean `req.originalUrl` crudo. Esto evita que
tokens, `code`, `state`, `returnTo` u otros query params queden en logs cuando
un endpoint es abusado.

Eventos actuales:

| Evento                        | Fuente                      | Uso operativo                                       |
| ----------------------------- | --------------------------- | --------------------------------------------------- |
| `rate_limit.exceeded`         | Public API + upload intents | Detectar abuso, scraping o token comprometido.      |
| `http.client_error`           | Global exception filter     | Detectar spikes de 401/403/404/429/validation.      |
| `http.error`                  | Global exception filter     | Detectar 5xx con `requestId` para triage.           |
| `asset.upload.intent`         | `AuditLog` DB               | Trazar creacion de intents por usuario/artista.     |
| `asset.upload.confirm`        | `AuditLog` DB               | Trazar assets confirmados.                          |
| `admin.*`                     | `AuditLog` DB               | Trazar mutaciones Behind/admin.                     |
| `stripe_webhook_events` table | DB                          | Trazar eventos Stripe, idempotencia y stale events. |
| `behind:role_audit`           | Upstash Redis               | Trazar cambios de roles Behind.                     |
| WorkOS Radar detections       | WorkOS dashboard            | Bot/brute force/challenge evidence.                 |

## Que logs mirar

### Railway API

Buscar:

- `security_event=http.error`
- `security_event=http.client_error`
- `security_event=rate_limit.exceeded`
- `Upload confirmation rejected`
- `Stripe webhook signature verification failed`
- `Failed to write audit log`
- `Failed to start application`

Primer filtro recomendado:

```text
security_event=
```

Despues acotar por `requestId`, `statusCode`, `namespace`, `path` o `userId`.

### Vercel web

Buscar:

- `[Auth callback error]`
- `[admin][...] Proxy request failed`
- `[blocks][proxy]`
- `[insights][...]`
- errores 4xx/5xx repetidos en route handlers;
- deploys fallidos y warnings de secrets visibles.

### WorkOS

Revisar:

- Radar -> Detections;
- Users -> user events para cuentas E2E/admin;
- Redirects y auth methods despues de cambios de dominio;
- brute force / bot detection challenges repetidos.

### Base de datos

Queries operativas:

```sql
-- Eventos admin recientes
select created_at, actor_id, action, entity_type, entity_id, metadata
from audit_logs
where action like 'admin.%'
order by created_at desc
limit 50;

-- Upload activity reciente
select created_at, actor_id, action, entity_id, metadata
from audit_logs
where action in ('asset.upload.intent', 'asset.upload.confirm')
order by created_at desc
limit 100;

-- Webhooks Stripe con errores o reintentos
select stripe_event_id, type, artist_id, processed_at, processing_error
from stripe_webhook_events
where processing_error is not null
order by processed_at desc
limit 50;
```

## Alertas minimas

Para launch privado se aceptan revisiones manuales diarias. Antes de trafico
publico sostenido, configurar alertas externas (Railway/Vercel/Logtail/Sentry o
similar) para:

| Prioridad | Senal                                       | Umbral inicial sugerido                    | Accion                                              |
| --------- | ------------------------------------------- | ------------------------------------------ | --------------------------------------------------- |
| P0        | `security_event=http.error`                 | cualquier spike o error sostenido > 5 min  | Triage inmediato con `requestId`.                   |
| P0        | WorkOS brute force/bot challenge admin      | cualquier admin/owner afectado             | Revisar cuenta, sesiones y MFA.                     |
| P1        | `rate_limit.exceeded` en `upload-intent`    | > 10 eventos / 10 min para mismo userId/IP | Revocar sesiones si parece token comprometido.      |
| P1        | `rate_limit.exceeded` en `public`           | > 50 eventos / 10 min mismo IP             | Bloquear IP/WAF si disponible.                      |
| P1        | Stripe invalid signature / webhook failures | cualquier repeticion                       | Validar secret, endpoint y replay.                  |
| P1        | `Failed to write audit log`                 | cualquier repeticion                       | Revisar DB y no hacer cambios admin hasta resolver. |
| P2        | Upload confirmations rechazadas             | > 5 por userId en 10 min                   | Revisar abuso o bug cliente/storage.                |
| P2        | Dependabot/security audit fail en `main`    | cualquier fail                             | Bloquear release hasta resolver.                    |

## Runbooks

### Login attacks / WorkOS challenges

1. Abrir WorkOS -> Radar -> Detections.
2. Filtrar por email/IP si esta disponible.
3. Confirmar si afecta staging E2E, admin/owner o usuario real.
4. Para admin/owner: cerrar sesiones activas, cambiar password si aplica,
   revisar MFA posture y verificar `BEHIND_ADMIN_EMAILS`.
5. Si es staging E2E: completar challenge manual o relajar bot detection solo en
   Staging, documentando la decision.
6. Si es ataque real: mantener brute force/bot protection activo y bloquear IP
   en proveedor/WAF si se repite.

### Upload abuse / files sospechosos

1. Buscar `security_event=rate_limit.exceeded` con `namespace=upload-intent`.
2. Consultar `audit_logs` para `asset.upload.intent` y `asset.upload.confirm`
   del usuario/artista.
3. Revisar assets recientes en DB y object keys en R2/S3.
4. Si hay abuso: suspender usuario en Behind, revocar sesiones WorkOS y borrar
   objetos no deseados del bucket.
5. Si hay archivos maliciosos: mantenerlos fuera de superficies privadas,
   remover delivery/public reference y abrir tarea de AV/magic-byte scanning si
   el patron se repite.

### Public API abuse / scraping

1. Buscar `security_event=rate_limit.exceeded` con `namespace=public`.
2. Identificar IP/path y confirmar si es crawler legitimo.
3. Si impacta disponibilidad: bloquear IP en proveedor/WAF o subir proteccion
   en Vercel/Railway.
4. Si el trafico crece por marketing/launch, migrar rate limiter a Redis/Upstash
   antes de escalar instancias.

### Stripe webhook incident

1. Confirmar `STRIPE_WEBHOOK_SECRET` por environment.
2. Revisar `stripe_webhook_events` por errores, duplicados o stale events.
3. Reenviar eventos desde Stripe Dashboard si el error fue transitorio.
4. No procesar manualmente payloads sin signature verification.

### Admin/Behind incident

1. Revisar `audit_logs` para `admin.*`.
2. Revisar Redis `behind:role_audit` si el incidente involucra roles.
3. Verificar `BEHIND_ADMIN_EMAILS` en Vercel/Railway.
4. Remover Redis roles sospechosos, revocar sesiones WorkOS y rotar secrets si
   hay sospecha de compromiso.

## Backlog residual

No bloqueante para MVP/private QA:

- Agregar Sentry/Logtail/Datadog o equivalente para alertas automáticas.
- Migrar rate limiting in-memory a Redis/Upstash antes de trafico publico
  sostenido.
- Definir retencion formal de logs y acceso owner-only.
- Agregar vista Behind owner-only para `audit_logs` y `behind:role_audit`.
- Agregar AV/magic-byte scanning si se habilitan formatos no imagen o assets
  privados.

## Validacion

Validaciones locales ejecutadas:

```bash
pnpm --filter @stagelink/api exec jest src/common/utils/security-log.spec.ts src/common/guards/rate-limit.guard.spec.ts src/common/filters/http-exception.filter.spec.ts --runInBand
pnpm --filter @stagelink/api exec jest --runInBand
pnpm --filter @stagelink/api typecheck
pnpm security:audit
pnpm exec prettier --check apps/api/src/common/utils/security-log.ts apps/api/src/common/utils/security-log.spec.ts apps/api/src/common/filters/http-exception.filter.ts apps/api/src/common/guards/public-rate-limit.guard.ts apps/api/src/common/guards/upload-rate-limit.guard.ts apps/api/src/common/guards/rate-limit.guard.spec.ts docs/security-audit-e2-security-monitoring-incident-readiness.md CLAUDE.md
```

Resultado: passed.

## Decision

E2.15 queda cerrado con fixes y runbooks. StageLink tiene una postura minima de
monitoring/incident readiness para continuar hacia E6 Documentacion & cierre.
Las alertas automatizadas y observability externa quedan como backlog de launch
publico/T7-8.
