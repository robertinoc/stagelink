# Security Audit E3 - Hardening Critico

Fecha: 2026-05-08

Estado: completado con fixes aplicados

Alcance:

- T3.1 Fix auth/session issues
- T3.2 Implementar ownership checks
- T3.3 Sanitizacion inputs global
- T3.4 Fix secrets y `.env`
- T3.5 Configurar headers seguridad
- T3.6 Bloquear endpoints inseguros

## Resumen ejecutivo

E3 consolida los fixes criticos aplicados durante E2 y cierra el pendiente
operativo que quedaba antes de avanzar a hardening avanzado: el endpoint
`/api/admin/debug/headers`.

No se encontraron nuevos blockers criticos en auth, ownership, sanitizacion,
headers o CI/CD. La mayor parte del hardening critico ya habia sido aplicada
durante E2; este pase deja registro de cierre y aplica un fix defensivo sobre el
endpoint de diagnostico de Behind.

## Fix aplicado

### HC-001 - Endpoint debug headers deshabilitado por default y con redaccion

Riesgo: `/api/admin/debug/headers` era owner-only, pero devolvia headers
completos. En una ventana de diagnostico podia exponer cookies, authorization
headers, bypass tokens o firmas si un owner descargaba/compartia la respuesta.

Fix:

- El endpoint queda deshabilitado por default.
- Solo responde si `BEHIND_DEBUG_HEADERS_ENABLED=true`.
- La autorizacion usa `requireOwnerSession()`, alineada con el role system de
  Behind.
- La respuesta usa `Cache-Control: no-store`.
- Headers sensibles se devuelven como `[redacted]`.
- `apps/web/.env.example` documenta `BEHIND_DEBUG_HEADERS_ENABLED=false`.
- Se agregaron tests unitarios para el redactor y el flag.

Decision operativa:

- Mantener `BEHIND_DEBUG_HEADERS_ENABLED` unset/false en Vercel y local.
- Habilitarlo solo durante una ventana corta de diagnostico owner-only.
- Deshabilitar y redeployar al cerrar la ventana.

## Checklist E3

| Item                            | Estado           | Evidencia                                                                                                               |
| ------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------- |
| T3.1 Auth/session issues        | Cerrado          | `docs/security-audit-e2-auth-sessions.md`; callback errors saneados, returnTo sanitizado, inactive users bloqueados.    |
| T3.2 Ownership checks           | Cerrado          | `docs/security-audit-e2-authorization.md`; ownership/membership checks revisados y analytics privado cubierto.          |
| T3.3 Sanitizacion inputs global | Cerrado          | `docs/security-audit-e2-api-security.md`; ValidationPipe global, DTOs, sanitizacion de bloques/EPK y schemas revisados. |
| T3.4 Secrets y `.env`           | Cerrado con nota | `docs/security-audit-e2-secrets-config.md`; no secrets versionados, public/private env matrix documentada.              |
| T3.5 Security headers           | Cerrado          | `docs/security-audit-e2-infra-headers.md`; HSTS, baseline headers, CORS y CSP documentados/aplicados.                   |
| T3.6 Endpoints inseguros        | Cerrado con fix  | `/api/admin/debug/headers` deshabilitado por default y redaccion agregada.                                              |

## Notas para launch / T7-8

Preservar estos puntos para la tarea `T7-8: Lanzamiento productivo,
documentacion y backlog post-launch`:

- `WORKOS_API_KEY`: marcar/rotar como sensitive en Vercel cuando la UI lo
  permita sin romper environment scoping.
- Dependabot: revisar y mergear PRs de a uno con CI verde; no hacer batch merge
  de Next/Nest/test tooling sin smoke posterior.
- GitHub branch protection/rulesets: exigir CI verde antes de merge a `main`.
- Vercel Preview Authentication: se desactivo temporalmente para QA; decidir si
  vuelve a habilitarse antes de launch publico.
- Rate limiting: in-memory es aceptado para private QA/MVP; migrar a
  Redis/Upstash/Vercel KV antes de trafico publico sostenido o paid acquisition.
- Backups Railway: Hobby no incluye backups automaticos; activar Railway Pro y
  backups gestionados al launch publico o al llegar a ~100 usuarios.
- Stress real: ejecutar solo con ventana aprobada, monitoreo y criterios de
  stop/rollback.

## Validacion

Comandos ejecutados:

```bash
pnpm --filter @stagelink/web test -- admin-debug-headers
```

## Decision

E3 queda cerrada con un fix critico aplicado y backlog de launch preservado para
T7-8. No quedan blockers conocidos para avanzar a E4 Hardening Avanzado.
