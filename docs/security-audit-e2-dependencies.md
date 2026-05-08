# Security Audit E2.8 - Dependencies

Fecha: 2026-05-08

Estado: completado con fixes aplicados

Alcance:

- T2.8.1 Vulnerabilities scan
- T2.8.2 Paquetes inseguros

## Resumen ejecutivo

El primer `pnpm audit --audit-level high` detecto 31 vulnerabilidades:

- 2 critical
- 9 high
- 19 moderate
- 1 low

Despues de aplicar upgrades y overrides acotados, `pnpm audit --audit-level
moderate` devuelve:

```text
No known vulnerabilities found
```

## Fixes aplicados

### Direct dependencies

- `next`: actualizado a rango parchado `^15.5.15` (lock resuelve `15.5.18`).
- `next-intl`: actualizado a `^4.9.2` para cerrar open redirect/prototype
  pollution reportados por audit.
- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`: actualizados a
  `^11.1.18`.
- `@nestjs/config`: actualizado a `^4.0.2` para alinear peer dependencies con
  Nest 11.

### Transitive dependency overrides

Se agregaron overrides pnpm para dependencias transitivas vulnerables cuando el
paquete padre todavia no las resuelve en un rango parchado:

- `@angular-devkit/core>ajv`: `8.18.0`
- `brace-expansion`: `1.1.13`
- `dompurify`: `3.4.0`
- `fast-xml-parser`: `5.7.0`
- `handlebars`: `4.7.9`
- `lodash`: `4.18.0`
- `picomatch`: `4.0.4`
- `postcss`: `8.5.10`
- `protobufjs`: `7.5.5`

Nota: se evito un override global de `path-to-regexp` porque rompia WorkOS
AuthKit (`tokensToRegexp`). El upgrade de Nest resuelve el path vulnerable sin
forzar ese paquete para consumidores que dependen de APIs antiguas.

## Hardening operativo

- Se agrego script raíz `pnpm security:audit` como alias de
  `pnpm audit --audit-level moderate`.
- Se agrego job `Dependency audit` al CI para bloquear PRs con vulnerabilidades
  conocidas a nivel moderate o superior.
- Se agrego `.github/dependabot.yml` semanal para npm/pnpm, agrupando updates de
  Next, Nest, testing y observabilidad.

## Validacion

Comandos ejecutados:

```bash
pnpm audit --audit-level moderate
pnpm --filter @stagelink/types build
pnpm --filter @stagelink/api db:generate
pnpm --filter @stagelink/api typecheck
pnpm --filter @stagelink/web typecheck
pnpm --filter @stagelink/api test
pnpm --filter @stagelink/web test
WORKOS_API_KEY=placeholder \
WORKOS_CLIENT_ID=placeholder \
WORKOS_COOKIE_PASSWORD=placeholder_password_32_chars_minimum_ok \
WORKOS_REDIRECT_URI=http://localhost:4000/api/auth/callback \
NEXT_PUBLIC_APP_URL=http://localhost:4000 \
NEXT_PUBLIC_API_URL=http://localhost:4001 \
API_URL=http://localhost:4001 \
pnpm --filter @stagelink/web build
```

Resultado:

- audit: passed, no known vulnerabilities
- API typecheck: passed
- Web typecheck: passed
- API tests: 279 passed
- Web tests: 135 passed
- Web production build: passed

## Backlog residual

- Revisar Dependabot PRs semanalmente y mergear solo con CI verde.
- Si vuelve a aparecer una vulnerabilidad por paquete transitivo, preferir upgrade
  del paquete padre antes que override global.
- Mantener especial cuidado con `path-to-regexp` por compatibilidad de WorkOS
  AuthKit.

## Decision

E2.8 queda cerrada. No quedan vulnerabilidades conocidas por `pnpm audit` a nivel
moderate/high/critical.
