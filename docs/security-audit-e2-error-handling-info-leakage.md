# StageLink - Security Audit E2.14: Error Handling / Information Leakage

Fecha: 2026-05-13

Estado: cerrado con fixes aplicados.

## Alcance

E2.14 revisa manejo de errores e informacion expuesta:

| Tarea                       | Estado          | Resultado                                                                                    |
| --------------------------- | --------------- | -------------------------------------------------------------------------------------------- |
| T2.14.1 Stack traces        | Cerrado         | Stack traces quedan en logs server-side; clientes reciben envelope generico en 5xx.          |
| T2.14.2 DB errors           | Cerrado         | Errores no-HTTP/Prisma caen a `Internal server error` sin detalles SQL/DB en respuesta.      |
| T2.14.3 Auth errors         | Cerrado         | Auth devuelve mensajes genericos para token invalido/expirado y provisioning fallido.        |
| T2.14.4 Validation messages | Cerrado con fix | IDs malformados ya no se reflejan; mensajes se sanitizan/truncan antes de responder/loggear. |
| T2.14.5 404 vs 403 behavior | Cerrado         | Ownership mantiene 404 para recursos ajenos/no visibles y 403 para permisos insuficientes.   |

## Fixes aplicados

### 5xx genericos hacia clientes

`HttpExceptionFilter` ahora fuerza `message: "Internal server error"` para todo
status `>=500`, incluso si el codigo lanza `InternalServerErrorException` con un
mensaje especifico.

Impacto:

- stack traces y detalles internos quedan solo en logs;
- errores de DB/Prisma no exponen tablas, queries, constraints ni payloads;
- el cliente conserva `requestId`, `statusCode`, `error`, `timestamp` y `path`
  para soporte/debug.

### Path sin querystring

El envelope de error ya no devuelve query params en `path`.

Motivo: URLs de callback, redirect, magic links o integraciones pueden incluir
`code`, `state`, `token`, `returnTo` u otros valores sensibles.

Ejemplo:

- antes: `/api/test?token=secret&code=123`
- ahora: `/api/test`

### Request ID sanitizado

`RequestIdMiddleware` ya no reutiliza cualquier `X-Request-ID` entrante. Solo se
aceptan IDs alfanumericos con `._:-` y hasta 128 caracteres. Si llega un valor
con saltos de linea, tabs, caracteres raros o demasiado largo, se genera un UUID
nuevo.

Impacto: evita header/log injection y respuestas con correlation IDs controlados
arbitrariamente por el cliente.

### IDs malformados sin reflejo

`ParseCuidPipe` ya no responde `Invalid ID format: <valor>`. Responde siempre
`Invalid ID format`.

Impacto: evita reflejar payloads maliciosos en errores 400, incluyendo strings
con HTML/JS o probes de injection.

### Sanitizacion de mensajes 4xx

Los mensajes 4xx permitidos se mantienen utiles para UX/API contract, pero el
filtro:

- remueve `\r`, `\n` y tabs;
- trunca cada mensaje a 500 caracteres;
- mantiene solo extras allowlisted (`code`, `feature`, `effectivePlan`,
  `billingPlan`, `subscriptionStatus`, `requiredPlan`).

## Postura actual

El error envelope publico queda:

```json
{
  "requestId": "uuid-or-safe-client-id",
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid ID format",
  "timestamp": "2026-05-13T00:00:00.000Z",
  "path": "/api/resource/path"
}
```

Reglas:

- 4xx puede tener mensajes accionables pero sanitizados.
- 5xx siempre responde mensaje generico.
- `path` nunca incluye querystring.
- `requestId` es seguro para logs/respuesta.
- Extras solo salen si estan allowlisted.

## Riesgos residuales

No bloqueantes:

- Algunos mensajes 4xx de validacion siguen siendo descriptivos por UX y DX. Si
  StageLink entra en una fase de compliance mas estricta, se puede migrar a
  codigos de error estables (`VALIDATION_ERROR`, `RESOURCE_NOT_FOUND`, etc.) y
  mensajes localizados client-side.
- Logs server-side aun incluyen stack traces de 5xx, como corresponde para
  soporte. E2.15 debe definir retencion, acceso y alertas minimas.

## Validacion

Validaciones locales ejecutadas:

```bash
pnpm --filter @stagelink/types build
pnpm --filter @stagelink/api exec prisma generate
pnpm --filter @stagelink/api exec jest src/common/filters/http-exception.filter.spec.ts src/common/middleware/request-id.middleware.spec.ts src/common/pipes/parse-cuid.pipe.spec.ts --runInBand
pnpm --filter @stagelink/api exec jest --runInBand
pnpm --filter @stagelink/api typecheck
pnpm security:audit
pnpm exec prettier --check apps/api/src/common/filters/http-exception.filter.ts apps/api/src/common/filters/http-exception.filter.spec.ts apps/api/src/common/middleware/request-id.middleware.ts apps/api/src/common/middleware/request-id.middleware.spec.ts apps/api/src/common/pipes/parse-cuid.pipe.ts apps/api/src/common/pipes/parse-cuid.pipe.spec.ts apps/api/src/test/api-contract.integration-spec.ts docs/security-audit-e2-error-handling-info-leakage.md CLAUDE.md
```

Resultado: passed.

## Decision

E2.14 queda cerrado con fixes. No quedan blockers conocidos de error handling /
information leakage para pasar a E2.15 Security monitoring / incident readiness.
