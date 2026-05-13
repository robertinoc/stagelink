# StageLink - Security Audit E6: Security Baseline

Fecha: 2026-05-13

Estado: baseline operativo post-auditoria.

## Objetivo

Definir la postura minima que StageLink debe conservar despues del Security
Audit. Si un cambio futuro reduce alguno de estos controles, debe tratarse como
regresion de seguridad.

## Baseline por area

### Auth

- WorkOS/AuthKit sigue siendo el unico proveedor de credenciales.
- StageLink no implementa password storage ni password reset tokens propios.
- Login/signup usan URLs WorkOS server-generated.
- `returnTo` y callbacks se sanitizan.
- API valida JWT WorkOS con JWKS, issuer permitido y claims minimos.
- Usuarios suspendidos o soft-deleted no pueden usar la API.
- Radar production mantiene bot detection y brute force protection activos.

### Sessions and tokens

- WorkOS session cookie queda bajo AuthKit/Next.js.
- Nuevos flujos sensibles deben preferir BFF/server actions para no mover
  bearer tokens a componentes cliente cuando sea practico.
- `WORKOS_API_KEY`, `WORKOS_COOKIE_PASSWORD` y `WORKOS_CLIENT_ID` se mantienen
  por environment y nunca se exponen como secretos publicos.

### Authorization

- Toda ruta privada API requiere JWT salvo `@Public()` deliberado.
- Recursos artist-scoped deben pasar por `OwnershipGuard` o
  `MembershipService.validateAccess()`.
- Recursos identificados por `pageId`, `blockId`, `smartLinkId` o `assetId`
  deben resolver su parent artist server-side.
- Missing membership debe preferir 404 para reducir enumeracion de tenant data.
- Behind/admin mutations deben ser owner-only.

### Input validation

- Mantener `ValidationPipe` global con whitelist/forbid/transform.
- Nuevos DTOs deben limitar:
  - string length;
  - enum/value sets;
  - URL protocols;
  - array sizes;
  - nested config shape.
- No usar `IsUrl()` generic para URLs renderizadas publicamente sin restringir
  protocolos.

### Error handling

- 5xx hacia clientes siempre deben ser genericos.
- Error envelope no debe incluir querystrings.
- `requestId` debe ser seguro para logs y respuestas.
- 4xx puede ser descriptivo, pero debe estar sanitizado/truncado.
- Stack traces quedan solo server-side.

### Logging and monitoring

- Eventos de seguridad deben usar `security_event=...`.
- No loguear querystrings ni tokens.
- Logs utiles minimos:
  - requestId;
  - method;
  - sanitized path;
  - status code;
  - namespace para rate limits;
  - userId/artistId solo cuando no sea sensible.
- Runbooks E2.15 son la referencia operativa hasta conectar observability
  externa.

### Rate limiting

- Mantener:
  - public API: `PublicRateLimitGuard`;
  - upload intents: `UploadRateLimitGuard`;
  - web SmartLink redirect limiter.
- Respuestas 429 deben incluir headers `X-RateLimit-*` y `Retry-After`.
- Migrar a Redis/Upstash/Vercel KV antes de trafico publico sostenido o
  multiples instancias.

### Uploads

- Presigned PUT URL es el unico camino de browser a storage.
- Backend genera object key y filename canonico.
- Cliente nunca controla storage path.
- Intent valida kind, MIME y size.
- Confirm valida ownership y objeto real en S3/R2 antes de `uploaded`.
- Bucket publico solo para media artistica publica.

### Webhooks

- Webhooks inbound deben:
  - verificar firma sobre raw body;
  - rechazar missing/invalid signature antes de writes;
  - tener replay tolerance;
  - persistir idempotency key;
  - responder errores genericos.
- Stripe es el unico inbound webhook productivo actual.
- Cualquier webhook Shopify/futuro debe copiar esta baseline.

### Secrets

- No versionar `.env` reales.
- Mantener `.env.example` sin secretos reales.
- Variables server-only nunca deben tener prefijo `NEXT_PUBLIC_`.
- Secrets sensibles deben estar marcados sensitive en Vercel/Railway/GitHub
  cuando la plataforma lo permita.
- `BEHIND_ADMIN_EMAILS` debe existir en ambientes deployados como bootstrap
  owner.

### CI/CD

- CI debe correr:
  - dependency audit;
  - typecheck;
  - API unit;
  - web unit;
  - API integration;
  - build;
  - E2E/smoke cuando aplique.
- GitHub Actions token global debe quedar read-only.
- Jobs deben tener timeout.
- Artifacts no deben incluir `.auth` ni storage state sensible.
- Dependabot debe permanecer activo.

### Data and recovery

- Railway Hobby backups automaticos quedan diferidos por decision operativa.
- Antes de public launch amplio o primeros 100 usuarios:
  - activar Railway Pro/backups o alternativa equivalente;
  - probar restore drill sobre DB descartable;
  - mantener row-count/integrity validation.
- Stress/destructive tests requieren staging DB dedicada y ventana aprobada.

## Regression triggers

Abrir review de seguridad si un PR:

- agrega una ruta `@Public()`;
- agrega una nueva integracion externa;
- agrega un webhook inbound;
- agrega nuevo tipo de upload;
- agrega secrets/env vars;
- cambia WorkOS redirect/session/JWT behavior;
- modifica `OwnershipGuard`, `MembershipService` o admin guards;
- agrega `dangerouslySetInnerHTML`;
- agrega raw SQL;
- modifica CI secrets/artifacts/workflow permissions;
- expone nuevos datos en public pages/EPK.

## Launch gates pendientes

Antes de launch publico sostenido:

1. Activar branch protection/ruleset con CI obligatorio.
2. Confirmar backups automaticos o recovery plan real.
3. Definir MFA para owners/admins.
4. Conectar observability externa/alertas.
5. Migrar rate limiting a shared store si se escala infraestructura.
6. Confirmar `STRIPE_WEBHOOK_SECRET` sensible por environment.
7. Definir DB staging dedicada para pruebas destructivas/stress/restore.

## Decision

Este baseline queda vigente hasta que Audit 360, Privacy Plan o T7-8 lo
reemplacen por una version mas estricta.
