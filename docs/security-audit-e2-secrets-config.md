# Security Audit E2.6 - Secrets & Config

Fecha: 2026-05-08

Estado: completado con fixes aplicados

Alcance:

- T2.6.1 Auditoria `.env`
- T2.6.2 Secrets hardcodeados
- T2.6.3 Variables publicas vs privadas

## Resumen ejecutivo

La auditoria no encontro `.env` reales versionados. Solo existen ejemplos:

- `apps/api/.env.example`
- `apps/web/.env.example`
- `infra/docker/.env.example`

Se aplicaron fixes de configuracion para reducir exposicion accidental y cerrar el
pendiente de owner/admin hardcodeado detectado en E2.2.

## Hallazgos y fixes

### SC-001 - Owner/admin de Behind configurado por env

Riesgo: el API usaba el email owner de Behind hardcodeado en `AdminOwnerGuard` y
`AdminService`, duplicando configuracion y dificultando rotaciones o co-owners.

Fix:

- Se agrego `apps/api/src/modules/admin/admin.config.ts`.
- `BEHIND_ADMIN_EMAILS` pasa a ser la allowlist server-side para endpoints admin
  del API.
- `AdminOwnerGuard` y `AdminService` usan el helper compartido.
- Se agrego test unitario para parsing/fallback.
- `apps/api/.env.example` y `apps/web/.env.example` documentan
  `BEHIND_ADMIN_EMAILS`.

Decision: se conserva un fallback bootstrap al owner actual para no romper dev ni
deploys existentes. Para produccion, `BEHIND_ADMIN_EMAILS` debe quedar seteada en
Vercel y Railway con la misma lista.

### SC-002 - Server route usando public API URL como primera opcion

Riesgo: `/go/[id]` es un route handler server-side, pero usaba
`NEXT_PUBLIC_API_URL` directamente. Esa variable es publica y correcta para
cliente, pero server-side conviene preferir `API_URL` para poder apuntar a una URL
privada/interna sin exponerla al bundle.

Fix:

- `apps/web/src/app/go/[id]/route.ts` ahora resuelve
  `API_URL ?? NEXT_PUBLIC_API_URL ?? localhost`.

Resultado: mantiene compatibilidad local y habilita configuracion privada para
runtime server-side.

### SC-003 - Ejemplos `.env` incompletos

Riesgo: variables server-only usadas por rutas web no estaban documentadas en
`apps/web/.env.example`, y `DIRECT_URL` faltaba en `apps/api/.env.example`.

Fix:

- `apps/web/.env.example` agrega `BEHIND_ADMIN_EMAILS`, `RESEND_API_KEY`,
  `CONTACT_FORM_TO`, `UPSTASH_REDIS_KV_REST_API_URL`,
  `UPSTASH_REDIS_KV_REST_API_TOKEN`.
- `OPENAI_API_KEY` queda explicitamente marcada como server-only.
- `NEXT_PUBLIC_API_URL` queda marcada como public config.
- `apps/api/.env.example` agrega `DIRECT_URL`.

## Matriz public/private

Public config, puede estar en browser:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_APP_ENV`
- `NEXT_PUBLIC_IMAGES_HOSTNAME`

Server-only, nunca usar con `NEXT_PUBLIC_`:

- `API_URL`
- `WORKOS_API_KEY`
- `WORKOS_COOKIE_PASSWORD`
- `WORKOS_REDIRECT_URI`
- `DATABASE_URL`
- `DIRECT_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `SECRETS_ENCRYPTION_KEY`
- `SHOPIFY_STOREFRONT_TOKEN`
- `SPOTIFY_CLIENT_SECRET`
- `YOUTUBE_DATA_API_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`
- `UPSTASH_REDIS_KV_REST_API_TOKEN`
- `BEHIND_ADMIN_EMAILS`

Shared non-secret identifiers:

- `WORKOS_CLIENT_ID`
- `AWS_S3_BUCKET`
- `AWS_S3_REGION`
- `AWS_S3_PUBLIC_BASE_URL`
- `SPOTIFY_CLIENT_ID`
- `SOUNDCLOUD_CLIENT_ID`

## CI/CD y logs

Revisado:

- GitHub Actions usa secrets para staging E2E y smoke productivo.
- El build usa placeholders no sensibles para WorkOS en CI.
- Los ejemplos de DB en docs usan credenciales ficticias/dev.
- No se detectaron tokens reales por patrones comunes (`sk_live`, `whsec`,
  `ghp_`, claves privadas, AWS access keys).

Nota: los reportes/logs de CI deben seguir evitando imprimir valores de
`DATABASE_URL`, tokens bearer o API keys. Mantener placeholders en docs y comandos
de ejemplo.

## Backlog residual

- Configurar `BEHIND_ADMIN_EMAILS` en Railway API si todavia no esta seteada,
  usando la misma allowlist que Vercel web.
- En una etapa posterior, eliminar el fallback bootstrap cuando el dashboard
  Behind tenga gestion formal de owners y break-glass.
- Revisar `CONTACT_FORM_TO` antes de launch publico si se quiere mover soporte a
  un alias dedicado.

## Decision

E2.6 queda cerrada con fixes. No se encontraron secrets reales commiteados ni
variables privadas expuestas intencionalmente al cliente.
