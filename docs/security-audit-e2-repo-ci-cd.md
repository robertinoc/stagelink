# Security Audit E2.9 - Repo & CI/CD

Fecha: 2026-05-08

Estado: completado con fixes aplicados

Alcance:

- T2.9.1 GitHub Actions audit
- T2.9.2 Secrets exposure CI

## Resumen ejecutivo

La auditoria reviso los workflows versionados en `.github/workflows`, la
configuracion de Dependabot y el flujo reciente de artifacts Playwright usado por
E2E staging.

Resultado: no se encontraron blockers criticos. El pipeline no usa
`pull_request_target`, los secrets de WorkOS/E2E solo se inyectan en jobs de
`push` a `main` con environment `staging`, y el build usa placeholders no
sensibles. Se aplicaron hardenings defensivos para reducir permisos y exposicion
accidental en artifacts.

## Workflows revisados

- `.github/workflows/ci.yml`
- `.github/workflows/final-qa-evidence.yml`
- `.github/dependabot.yml`

## Hallazgos y fixes

### CI-001 - Permisos del token demasiado amplios a nivel workflow

Riesgo: `ci.yml` definia `checks: write` y `pull-requests: write` para todo el
workflow. Aunque eran permisos necesarios para anotaciones JUnit y comentarios de
coverage, no todos los jobs los necesitan.

Fix:

- El token global queda en `contents: read`.
- `api-tests` y `web-tests` piden `checks: write` y `pull-requests: write`
  solo para anotaciones/comentarios.
- `api-integration-tests` pide `checks: write` solo para anotaciones JUnit.
- Jobs de audit, typecheck, build, E2E y smoke quedan read-only.

Resultado: se reduce blast radius del `GITHUB_TOKEN` sin romper el pipeline.

### CI-002 - Coverage comments corrian tambien fuera de PR

Riesgo: los pasos de coverage comment intentaban correr en `push` a `main`,
donde no hay PR que comentar. No exponia secrets, pero usaba permisos de PR sin
necesidad y podia generar ruido operativo.

Fix:

- `Comment API coverage` y `Comment web coverage` ahora corren solo cuando
  `github.event_name == 'pull_request'`.

### CI-003 - Checkout persistia credenciales en jobs que no hacen push

Riesgo: `actions/checkout` deja el token persistido en la config git por defecto.
StageLink no necesita hacer push desde estos workflows.

Fix:

- Todos los `actions/checkout@v4` en workflows revisados usan
  `persist-credentials: false`.

Resultado: si un paso posterior ejecutara comandos git por error, no tendria
credenciales persistidas listas para usar.

### CI-004 - Artifacts Playwright requerian defensa adicional

Riesgo: el setup auth ya tiene trace/screenshot/video desactivado, pero el upload
general de artifacts seguia tomando directorios amplios (`playwright-report/` y
`test-results/`). Una futura reorganizacion podria terminar incluyendo estado de
auth si se escribe dentro de esos directorios.

Fix:

- Los artifacts E2E y smoke excluyen explicitamente rutas `.auth` debajo de
  `playwright-report/` y `test-results/`.
- Se mantiene la evidencia Playwright necesaria para debugging.

## Estado de secrets en CI

Revisado:

- Secrets de staging:
  - `STAGING_URL`
  - `E2E_DEMO_ARTIST`
  - `E2E_AUTH_EMAIL`
  - `E2E_AUTH_PASSWORD`
  - `E2E_RUN_ONBOARDING`
  - `E2E_RUN_UPLOAD`
- Secrets de produccion:
  - `PRODUCTION_URL`

Controles actuales:

- Los secrets E2E no corren en `pull_request`.
- Los secrets E2E corren solo en `push` a `main` y bajo environment `staging`.
- Smoke productivo corre despues de E2E y bajo environment `production`.
- GitHub enmascara secrets en logs, pero Playwright traces pueden capturar typed
  values; por eso el proyecto `setup` mantiene trace/screenshot/video apagados.
- El artifact viejo que contenia evidencia sensible fue eliminado manualmente y
  la password E2E fue rotada.

## Dependabot

Estado:

- Dependabot esta configurado semanalmente.
- Limite abierto: 5 PRs.
- Grupos: Next, Nest, test tooling y observabilidad.

Decision operativa:

- No mergear todos los PRs de Dependabot juntos.
- Revisar y mergear uno por uno con CI verde.
- Mantener especial cuidado con upgrades de Next y Auth/WorkOS-adjacent tooling
  porque afectan E2E, redirects y build/runtime.

## Backlog residual

- Marcar/rotar `WORKOS_API_KEY` como sensitive en Vercel cuando la UI lo permita
  sin romper environment scoping.
- Evaluar pinning por SHA de GitHub Actions para una etapa de hardening avanzado.
- Evaluar branch protection/rulesets en GitHub para exigir CI verde antes de
  merge a `main`.
- Rehabilitar Vercel Preview Authentication si los preview deploys deben volver
  a ser privados; para QA se desactivo temporalmente.

## Validacion

Validaciones realizadas:

```bash
gh run view 25549456025 --json status,conclusion,jobs,url,updatedAt
```

Resultado observado antes de aplicar este hardening:

- CI `main`: success
- E2E tests (staging): success
- Smoke tests (production): success
- Build, TypeScript, unit, integration y dependency audit: success

## Decision

E2.9 queda cerrada con hardening aplicado. No quedan blockers conocidos en repo o
CI/CD para avanzar dentro de la auditoria de seguridad.
