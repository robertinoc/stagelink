# Security Audit E4 - Advanced Hardening

Fecha: 2026-05-08

Estado: cerrado con fixes aplicados.

## Alcance

E4 cubre hardening avanzado sobre controles que ya existian en la plataforma:

| Tarea | Estado | Resultado |
| --- | --- | --- |
| T4.1 Rate limiting | Cerrado con fix | Se centralizo el limiter in-memory, se agregaron headers `X-RateLimit-*`/`Retry-After` y logging de abuso. |
| T4.2 Logging de seguridad | Cerrado con fix | Los bloqueos por rate limit y confirmaciones rechazadas de upload quedan logueados con contexto no sensible. |
| T4.3 Proteccion uploads | Cerrado con fix | `confirmUpload` ahora verifica el objeto real en S3/R2 con `HEAD` antes de marcarlo como `uploaded`. |
| T4.4 Anti-abuso / spam | Cerrado con nota | El endpoint backend de contact-form fue removido en `main`; se valido el flujo actual sin reintroducir superficie API. |
| T4.5 Multi-tenant hardening | Cerrado con nota | Ownership y tenant isolation siguen cubiertos por `MembershipService`/`OwnershipGuard`; se mantuvo el modelo fail-closed. |

## Fixes aplicados

### Rate limiting

Se creo `FixedWindowRateLimiter` como utilidad compartida para evitar drift entre
guards. Sigue siendo in-memory por decision pre-launch, pero ahora:

- devuelve metadata de limite, restantes, reset y retry;
- escribe headers de rate limit en respuestas protegidas;
- registra `warn` cuando un cliente excede el limite;
- mantiene cleanup periodico para evitar crecimiento indefinido del store.

Limites vigentes:

| Superficie | Limite | Key |
| --- | --- | --- |
| Public API general | 120 req / 60 s | IP |
| Upload intent | 20 req / 60 s | userId + IP |

### Upload protection

Antes, `POST /api/assets/:id/confirm` confiaba en que el cliente habia subido el
archivo despues de recibir el presigned URL. Ahora la API llama `HeadObject`
contra S3/R2 antes de cambiar el estado:

- rechaza objeto inexistente o vacio;
- rechaza objeto mayor al maximo configurado para el kind;
- rechaza mismatch de `Content-Type` cuando el storage lo reporta;
- solo despues actualiza `Asset.status = uploaded`.

Esto reduce abuso de intents, referencias rotas y confirmaciones falsas.

### Contact form anti-spam/XSS

Durante el rebase contra `main` se detecto que el endpoint backend
`POST /api/public/blocks/:blockId/contact` ya no existe. No se reintrodujo esa
superficie. El flujo actual queda asi:

- landing contact: vive en `apps/web/src/app/api/contact/route.ts`, ya tiene
  rate limiting, honeypot/timing check, validacion Zod y escape HTML;
- public artist contact block: usa EmailJS desde el cliente con validacion y
  recorte local de campos; no agrega endpoint backend multi-tenant nuevo.

Decision: mantener el diseno actual y no volver a agregar un endpoint backend de
contact form salvo que se decida reemplazar EmailJS por envio server-side.

## Multi-tenant

No se agrego una abstraccion nueva para tenancy. La auditoria confirmo que los
flujos sensibles de E4 siguen resolviendo tenant server-side:

- uploads validan `artistId` con `MembershipService.validateAccess(..., 'write')`;
- listados de assets requieren acceso `read`;
- subscribers/contact/smart links derivan `artistId` desde block/page/link, no
  desde el cliente;
- controladores privados relevantes siguen usando `OwnershipGuard` fail-closed.

## Backlog residual

- Migrar `FixedWindowRateLimiter` a store compartido Redis/Upstash/Vercel KV
  antes de trafico publico sostenido o paid acquisition.
- Definir alertas externas para volumen anormal de `429`, landing contact y
  upload confirmations rechazadas.
- Evaluar antivirus/content scanning para archivos si StageLink acepta tipos no
  imagen o aumenta el volumen de uploads.

## Validacion

Comandos ejecutados:

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @stagelink/types build
pnpm --filter @stagelink/api exec prisma generate
pnpm --filter @stagelink/api typecheck
pnpm --filter @stagelink/api exec jest src/common/guards/rate-limit.guard.spec.ts src/modules/assets/assets.service.spec.ts --runInBand
pnpm --filter @stagelink/api exec jest --runInBand
pnpm --filter @stagelink/api build
pnpm security:audit
```

Resultado:

- TypeScript check: passed.
- Tests focalizados: 7 passed.
- API unit suite: 34 suites / 283 tests passed.
- API build: passed.
- Dependency audit: no known vulnerabilities found.

## Decision

E4 queda cerrada para esta fase. No quedan blockers conocidos para pasar a E5
Infra & CI/CD Security. El unico riesgo deliberadamente aceptado es mantener el
rate limiting in-memory hasta la decision de launch publico ya registrada en
Final Check/T7-8.
