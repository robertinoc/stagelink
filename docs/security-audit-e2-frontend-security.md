# Security Audit E2.4 - Frontend Security

Fecha: 2026-05-07

Estado: completado con fixes aplicados

Alcance:

- T2.4.1 XSS / rendering user content
- T2.4.2 Exposure de tokens/secrets
- T2.4.3 Query params / redirects

## Resumen ejecutivo

La auditoria frontend encontro dos riesgos corregibles antes de continuar con la siguiente seccion:

1. El JSON-LD de paginas publicas usaba `dangerouslySetInnerHTML` con `JSON.stringify()` directo sobre contenido controlado por artistas. React escapa texto normal, pero un script JSON-LD necesita escaping adicional para secuencias como `</script>`.
2. El editor de bloques pasaba el `session.accessToken` desde un Server Component hacia componentes cliente para operar Smart Links. Aunque el token venia de WorkOS y no se persistia en storage, exponerlo al runtime del browser ampliaba innecesariamente el blast radius.

Ambos puntos fueron corregidos. No se encontraron redirects abiertos explotables en los flujos revisados.

## Hallazgos y fixes

### FS-001 - JSON-LD script injection hardening

Riesgo: XSS por cierre prematuro de `<script type="application/ld+json">` si campos de artista contenian secuencias como `</script><script>...`.

Fix:

- Se agrego `serializeJsonLd()` en `apps/web/src/lib/json-ld.ts`.
- El serializer escapa `<`, `>`, `&`, U+2028 y U+2029 antes de insertar JSON-LD con `dangerouslySetInnerHTML`.
- Se agrego test unitario en `apps/web/src/__tests__/lib/json-ld.test.ts`.

Resultado: el contenido conserva el mismo JSON al parsear, pero no puede cerrar el script tag.

### FS-002 - Access token expuesto al cliente en Smart Links

Riesgo: el page builder pasaba `session.accessToken` a `BlockManager`, `BlockConfigForm` y `SmartLinkForm`. Esto permitia que el browser tuviera acceso al bearer token para llamar APIs protegidas.

Fix:

- Se agregaron route handlers BFF en Next.js:
  - `apps/web/src/app/api/artists/[artistId]/smart-links/route.ts`
  - `apps/web/src/app/api/smart-links/[smartLinkId]/route.ts`
- Esas rutas resuelven la sesion server-side con `getSession()` y forwardean el bearer token al API Nest desde el servidor.
- `apps/web/src/lib/api/smart-links.ts` ahora usa `fetch('/api/...')` sin token.
- `BlockManager`, `BlockConfigForm`, `SmartLinkForm` y el page builder dejaron de recibir/pasar `accessToken` en el arbol cliente.
- EPK mantiene lectura server-side con `apps/web/src/lib/api/smart-links-server.ts`.

Resultado: los access tokens de WorkOS quedan server-side para Smart Links y bloques.

### FS-003 - Logging de metadata sensible

Riesgo: `completeOnboardingAction()` registraba metadata del token (`accessTokenLength`, `accessTokenLooksJwt`). No exponia el token completo, pero no aportaba valor operativo suficiente para produccion.

Fix:

- Se elimino el log de metadata del token en onboarding.

Resultado: menor superficie de exposicion en logs.

## Redirects y query params revisados

### Auth `returnTo`

`/api/auth/signin?returnTo=...` usa `sanitizeAuthReturnTo()`:

- permite solo paths relativos internos;
- rechaza URLs absolutas;
- rechaza protocol-relative URLs (`//evil.example`);
- rechaza backslashes.

Estado: sano.

### Smart Link redirect `/go/[id]`

El handler:

- encodea `smartLinkId`;
- envia `from` como query param al backend para validacion adicional;
- valida la URL resuelta con `new URL()`;
- permite solo protocolos `http:` y `https:`;
- responde con `Cache-Control: no-store`.

Estado: aceptado. La validacion de destino queda duplicada backend + frontend redirect handler como defensa en profundidad.

### Billing / Stripe redirects

Los redirects a checkout/portal usan URLs devueltas por backend/Stripe. El `returnUrl` se arma server-side con `NEXT_PUBLIC_APP_URL` o headers de Vercel y los errores vuelven a dashboard billing interno.

Estado: aceptado. Mantener `NEXT_PUBLIC_APP_URL=https://stagelink.art` en produccion.

### Behind sign-in

`/api/auth/behind-signin` evita query params de `returnTo` y usa `returnTo: '/behind'` server-side.

Estado: sano.

## Tokens, secrets y configuracion publica

Revisado:

- `OPENAI_API_KEY`: solo en route handler server-side de traduccion.
- WorkOS secrets/cookie password: server-side.
- Upstash/Redis secrets: server-side.
- `NEXT_PUBLIC_API_URL` y `NEXT_PUBLIC_APP_URL`: public config, no secrets.
- Smart Links: token removido del cliente.

Estado: sin exposicion directa de secrets detectada en frontend.

## Backlog residual

- Mantener `dangerouslySetInnerHTML` bajo regla estricta: solo permitido con serializers dedicados y test.
- Considerar eliminar o limitar `/api/admin/debug/headers` antes de launch publico si ya no se usa para diagnostico. Actualmente es owner-only, pero devuelve headers completos.
- Revisar en E2.6 Secrets & Config que no existan `.env` reales commiteados ni valores sensibles en docs/logs.

## Decision

E2.4 queda cerrada con fixes. No bloquea avanzar a E2.5 DB & Data Security.
