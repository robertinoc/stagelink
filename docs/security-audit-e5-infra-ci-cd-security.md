# Security Audit E5 - Infra & CI/CD Security

Fecha: 2026-05-13

Estado: cerrado con fixes aplicados.

## Alcance

E5 revisa la seguridad operativa alrededor de GitHub Actions, secrets,
separacion de ambientes y storage.

| Tarea                         | Estado               | Resultado                                                                                                                |
| ----------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| T5.1 Hardening GitHub Actions | Cerrado con fix      | Se agregaron timeouts por job y se mantuvo token read-only por defecto.                                                  |
| T5.2 Secret management infra  | Cerrado con fix/nota | El workflow manual evita interpolar inputs directamente en shell; quedan decisiones operativas para UI de Vercel/GitHub. |
| T5.3 Environment separation   | Cerrado con decision | Dev/staging/prod quedan documentados; staging E2E sigue separado via GitHub Environment `staging`.                       |
| T5.4 Storage security         | Cerrado con doc/fix  | `assets-s3.md` refleja el estado real: confirmacion con `HEAD`, bucket publico deliberado y backlog de lifecycle.        |

## Fixes aplicados

### CI job timeouts

Se agregaron `timeout-minutes` a todos los jobs de `.github/workflows/ci.yml` y
al workflow manual `.github/workflows/final-qa-evidence.yml`.

Motivo: evitar runners colgados por dependencias externas, Playwright,
instalacion de browsers, Postgres service o cambios futuros en scripts.

Limites actuales:

| Job                   | Timeout |
| --------------------- | ------- |
| Dependency audit      | 10 min  |
| TypeScript check      | 15 min  |
| API unit tests        | 20 min  |
| Web unit tests        | 20 min  |
| API integration tests | 20 min  |
| Build                 | 20 min  |
| E2E staging           | 20 min  |
| Smoke production      | 10 min  |
| Final QA Evidence     | 30 min  |

### Workflow manual hardened

`final-qa-evidence.yml` recibia inputs manuales (`base_url`, `demo_artist`) y
los interpolaba directamente dentro de scripts shell. Aunque el workflow requiere
ejecucion manual por alguien con acceso al repo, el patron era evitable.

Fix:

- los inputs pasan a variables `env`;
- el shell usa `$INPUT_BASE_URL` / `$INPUT_DEMO_ARTIST`;
- los reportes usan `printf` en vez de interpolacion directa;
- el paso de dry-run usa `set -euo pipefail`.

Resultado: se reduce el riesgo de shell injection accidental en un workflow de
evidencia.

### Dependency audit drift

El primer run del PR detecto una vulnerabilidad nueva en `protobufjs <=7.5.5`,
transitiva via `posthog-js` -> OpenTelemetry exporter.

Fix:

- `main` ya incorporo el fix con `protobufjs` overrideado a `>=7.5.6`;
- E5 conserva esa postura y valida que el lockfile quede alineado con `main`;
- no se agrega un override extra para `@protobufjs/utf8` porque el arbol actual
  resuelve contra la version parchada de `protobufjs`.

Resultado: `pnpm security:audit` vuelve a pasar sin vulnerabilidades conocidas.

### Storage documentation aligned

`docs/assets-s3.md` estaba desactualizado respecto al hardening de E4 y al
dominio productivo actual.

Cambios:

- el flujo ya no documenta `objectKey` como respuesta publica esperada;
- `confirmUpload` documenta la verificacion `HEAD` contra S3/R2;
- CORS incluye `https://stagelink.art`;
- se aclara que R2/MinIO usan `AWS_S3_ENDPOINT`;
- se agrega postura de seguridad de launch para bucket/CDN publico.

## Secret management posture

Controles versionados actuales:

- GitHub token global queda `contents: read`.
- Jobs que comentan/anotan tests elevan permisos solo localmente.
- `pull_request_target` no se usa.
- `actions/checkout` usa `persist-credentials: false`.
- Secrets de staging E2E solo corren en `push` a `main` bajo environment
  `staging`.
- Smoke productivo corre bajo environment `production`.
- Artifacts Playwright excluyen rutas `.auth`.
- Build usa placeholders de WorkOS no sensibles.

Decisiones operativas fuera del repo:

- Vercel: mantener `WORKOS_API_KEY`, `WORKOS_COOKIE_PASSWORD`, `DATABASE_URL`,
  `DIRECT_URL`, `STRIPE_*`, `AWS_SECRET_ACCESS_KEY`,
  `SECRETS_ENCRYPTION_KEY`, provider secrets y Redis tokens como sensitive.
- GitHub: mantener `E2E_AUTH_EMAIL`, `E2E_AUTH_PASSWORD`, `STAGING_URL` y
  `PRODUCTION_URL` en environments, no como variables globales planas.
- Railway: mantener API/backend secrets solo en el servicio backend; no duplicar
  secrets de browser en Railway salvo que el backend los use.

## Environment separation

Estado actual documentado:

| Environment     | Frontend                        | Backend/API             | DB                            | Uso                                |
| --------------- | ------------------------------- | ----------------------- | ----------------------------- | ---------------------------------- |
| Dev/local       | localhost                       | localhost               | local Docker/Postgres         | Desarrollo y tests locales.        |
| Staging/preview | Vercel Preview o staging domain | API configurada para QA | Pendiente DB staging dedicada | E2E, QA y pruebas no destructivas. |
| Production      | `stagelink.art`                 | Railway production API  | Railway production Postgres   | Usuarios reales y smoke post-main. |

Decision:

- El plan Railway Hobby limita backups y ambientes administrados. Una DB staging
  real sigue pendiente para T7-8 / upgrade Pro / primeros usuarios.
- Mientras tanto, staging E2E debe seguir siendo no destructivo o usar usuarios
  demo/controlados.
- Cualquier stress test real queda sujeto a ventana aprobada y monitoreo abierto.

## Storage security posture

Estado actual:

- Uploads usan presigned PUT de corta duracion.
- El backend genera object keys tenant-scoped.
- El cliente no recibe credenciales AWS/R2.
- `confirmUpload` verifica existencia, size y `Content-Type` reportado por
  storage.
- Entrega publica de assets es una decision deliberada para media artistica.

Pendientes no bloqueantes:

- Lifecycle rule para limpiar objetos `pending` o assets viejos.
- Cleanup job DB para intents no confirmados.
- Magic-byte validation/worker si se aceptan formatos mas riesgosos que imagen.
- CDN/custom domain dedicado para assets si se quiere ocultar proveedor final.

## Backlog residual para T7-8 / launch

- Configurar branch protection/ruleset en GitHub para exigir CI verde antes de
  mergear a `main`.
- Evaluar pinning por SHA de third-party GitHub Actions cuando StageLink entre
  en una etapa de compliance mas estricta.
- Confirmar en Vercel que todos los secrets server-only esten marcados como
  sensitive cuando la UI lo permita sin romper scoping por environment.
- Crear DB staging real antes de pruebas destructivas, stress o restore drills.
- Definir lifecycle rules del bucket R2/S3 antes de trafico publico sostenido.

## Validacion

Validaciones locales ejecutadas:

```bash
pnpm exec prettier --check .github/workflows/ci.yml .github/workflows/final-qa-evidence.yml docs/assets-s3.md docs/security-audit-e5-infra-ci-cd-security.md CLAUDE.md
pnpm security:audit
```

Resultado: passed.

Tambien se valido que los YAML parseen correctamente:

```bash
ruby -e 'require "yaml"; YAML.load_file(".github/workflows/ci.yml"); YAML.load_file(".github/workflows/final-qa-evidence.yml"); puts "yaml ok"'
```

Resultado: passed.

## Decision

E5 queda cerrada para esta fase con hardening versionado y decisiones operativas
documentadas. No quedan blockers conocidos de infra/CI/CD para pasar a E6
Documentacion & cierre, con los pendientes de branch protection, Railway Pro/DB
staging y lifecycle storage registrados para launch/T7-8.
