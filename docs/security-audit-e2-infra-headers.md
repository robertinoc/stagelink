# Security Audit E2.7 - Infra & Headers

Fecha: 2026-05-08

Estado: completado con fixes aplicados

Alcance:

- T2.7.1 HTTPS / HSTS
- T2.7.2 Security headers
- T2.7.3 CORS config

## Resumen ejecutivo

La auditoria encontro una base razonable en Vercel y CORS del API, pero faltaban
tres hardenings de bajo riesgo:

1. HSTS global en el frontend web.
2. Headers de seguridad baseline en el API Railway/Nest.
3. CORS del API no contemplaba los headers `X-SL-AC` y `X-SL-QA` que el frontend
   usa para calidad de analytics y QA.

Se aplicaron fixes sin activar una CSP bloqueante. Para launch se deja CSP en
modo report-only para observar compatibilidad con embeds, WorkOS, PostHog y Next.

## Hallazgos y fixes

### IH-001 - HSTS global en web

Riesgo: `behind.stagelink.art` ya tenia HSTS via `next.config.ts`, pero el header
no estaba aplicado globalmente a todo el deployment web.

Fix:

- `apps/web/vercel.json` agrega
  `Strict-Transport-Security: max-age=31536000; includeSubDomains`.

Resultado: los dominios servidos por Vercel quedan con politica HTTPS persistente
despues de la primera visita.

### IH-002 - API sin baseline completo de security headers

Riesgo: el API dependia principalmente de CORS y no emitia headers defensivos
basicos en respuestas propias.

Fix:

- `apps/api/src/main.ts` agrega middleware baseline:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security` cuando la request llega por HTTPS/proxy HTTPS

Resultado: API y web comparten una postura minima consistente.

### IH-003 - CORS no incluia headers de calidad analytics/QA

Riesgo: `apps/web/src/lib/analytics/track.ts` envia `X-SL-AC` y `X-SL-QA` en
requests browser hacia el API. Si el browser hace preflight, esos headers podian
quedar bloqueados por `Access-Control-Allow-Headers`.

Fix:

- Se movio la configuracion CORS testeable a `apps/api/src/config/cors.ts`.
- `CORS_ALLOWED_HEADERS` ahora incluye:
  - `X-Request-ID`
  - `X-SL-AC`
  - `X-SL-QA`
- Se agrego cobertura en `apps/api/src/config/cors.spec.ts`.

Resultado: el flujo de analytics/QA queda alineado con la politica CORS.

### IH-004 - CSP en modo observacion

Riesgo: StageLink renderiza embeds y usa servicios externos legitimos. Activar
una CSP estricta directamente podia romper videos, Spotify, SoundCloud, PostHog,
WorkOS o scripts de Next.

Fix:

- `apps/web/vercel.json` agrega `Content-Security-Policy-Report-Only` con una
  baseline conservadora:
  - `object-src 'none'`
  - `base-uri 'self'`
  - `form-action 'self'`
  - `frame-ancestors 'none'`
  - allowlist de frames para YouTube, Vimeo, Spotify y SoundCloud
  - `connect-src 'self' https: wss:`

Decision: mantener report-only hasta revisar logs/console en staging y produccion.
Pasar a CSP enforce queda para E3/E4 hardening si no aparecen falsos positivos.

## CORS posture

Permitido:

- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`
- Vercel previews de StageLink (`https://stagelink*.vercel.app`)
- `localhost` y `127.0.0.1` solo en `NODE_ENV=development`
- requests sin `Origin` para server-to-server, curl y health checks

Rechazado:

- origenes desconocidos en produccion
- localhost en produccion

## Backlog residual

- Revisar CSP report-only en staging/prod antes de convertirla en bloqueante.
- Si se crea un dominio custom para API, confirmar que HSTS y CORS siguen
  correctos desde ese dominio.
- Considerar acotar mas el patron de previews de Vercel si Vercel ofrece un
  hostname estable que incluya owner/project slug obligatorio.

## Decision

E2.7 queda cerrada con fixes. No quedan blockers conocidos para avanzar a E2.8
Dependencies.
