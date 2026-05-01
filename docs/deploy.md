# StageLink — Guía de Deploy

## Arquitectura

```
                    Cloudflare (DNS + CDN + SSL)
                           │
            ┌──────────────┼──────────────┐
            │              │              │
    stagelink.link  Railway API URL   stagelink.art
            │              │              │
          Vercel        Railway       301 redirect
         (Next.js)     (NestJS)       to canonical
```

| Servicio              | Plataforma | URL de producción                                                                            |
| --------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| Frontend (`apps/web`) | Vercel     | `https://stagelink.link`                                                                     |
| Backend (`apps/api`)  | Railway    | `https://stagelink-production-18c8.up.railway.app` hasta configurar un dominio custom de API |
| DNS / CDN / SSL       | Cloudflare | gestiona todos los dominios                                                                  |

---

## Entornos

| Entorno        | Frontend                                 | Backend                                                                  |
| -------------- | ---------------------------------------- | ------------------------------------------------------------------------ |
| **Production** | `stagelink.link`                         | `stagelink-production-18c8.up.railway.app` o futuro `api.stagelink.link` |
| **Staging**    | `staging.stagelink.link` (Vercel branch) | Railway staging service                                                  |
| **Preview**    | `stagelink-git-{branch}.vercel.app`      | — (usa API de staging)                                                   |
| **Local**      | `localhost:4000`                         | `localhost:4001`                                                         |

### Dominios de producción

| Dominio              | Rol                                                                   |
| -------------------- | --------------------------------------------------------------------- |
| `stagelink.link`     | Dominio canónico de producción, indexable.                            |
| `www.stagelink.link` | Redirect permanente a `stagelink.link`.                               |
| `stagelink.art`      | Dominio alternativo de marca, redirect permanente a `stagelink.link`. |
| `www.stagelink.art`  | Redirect permanente a `stagelink.link`.                               |

---

## Vercel (Frontend)

### Configuración inicial

1. Ir a [vercel.com/new](https://vercel.com/new) → importar repo `robertinoc/stagelink`
2. **Framework**: Next.js (auto-detectado)
3. **Root Directory**: `apps/web`
4. **Install Command**: `cd ../.. && pnpm install --frozen-lockfile` (ya en `vercel.json`)
5. **Build Command**: `next build` (auto)
6. **Output Directory**: `.next` (auto)

### Variables de entorno en Vercel

Configurar en Vercel Dashboard → Settings → Environment Variables:

| Variable                   | Production                                                                               | Preview        | Development             |
| -------------------------- | ---------------------------------------------------------------------------------------- | -------------- | ----------------------- |
| `NEXT_PUBLIC_APP_URL`      | `https://stagelink.link`                                                                 | URL de preview | `http://localhost:4000` |
| `NEXT_PUBLIC_API_URL`      | `https://stagelink-production-18c8.up.railway.app` o futuro `https://api.stagelink.link` | API de staging | `http://localhost:4001` |
| `NEXT_PUBLIC_POSTHOG_KEY`  | tu key                                                                                   | —              | —                       |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://app.posthog.com`                                                                | —              | —                       |
| `WORKOS_CLIENT_ID`         | tu client ID                                                                             | —              | —                       |
| `WORKOS_API_KEY`           | tu API key                                                                               | —              | —                       |
| `WORKOS_REDIRECT_URI`      | `https://stagelink.link/api/auth/callback`                                               | —              | —                       |

### Preview deployments automáticos

Vercel crea automáticamente un deploy por cada PR y push a cualquier rama.
URL del preview: `https://stagelink-git-{branch-name}-{user}.vercel.app`

Estos orígenes están permitidos en el CORS del API gracias al patrón:
`/^https:\/\/stagelink[a-z0-9-]*\.vercel\.app$/`

---

## Railway (Backend)

### Configuración inicial

1. Ir a [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Seleccionar el repo `robertinoc/stagelink`
3. **Root Directory**: `/` (raíz del monorepo — Railway usa `railway.json`)
4. Railway detecta el `railway.json` de la raíz y usa esa configuración
5. Si el servicio ya existía, revisar en Deployment Details que no queden overrides operativos:
   - `startCommand` debe quedar en `pnpm start`
   - `preDeployCommand` debe quedar vacío
   - `dockerfilePath` debe ser `apps/api/Dockerfile`

### Variables de entorno en Railway

Configurar en Railway Dashboard → Variables:

```bash
NODE_ENV=production
APP_URL=https://stagelink-production-18c8.up.railway.app
FRONTEND_URL=https://stagelink.link
CORS_ALLOWED_ORIGINS=https://stagelink.link,https://www.stagelink.link,https://stagelink.art,https://www.stagelink.art,https://staging.stagelink.link

# PostgreSQL (Railway puede proveer una DB directamente)
DATABASE_URL=postgresql://...      # Pooler / runtime
DIRECT_URL=postgresql://...        # Conexión directa para migraciones Prisma

# WorkOS
WORKOS_CLIENT_ID=
WORKOS_API_KEY=
SECRETS_ENCRYPTION_KEY=replace-with-32-plus-char-secret

# Stripe (T5)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# PostHog (opcional)
POSTHOG_KEY=
POSTHOG_HOST=https://app.posthog.com

# AWS S3
AWS_S3_BUCKET=stagelink-assets
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

### Flujo de deploy en Railway

```
git push origin main
       │
       ▼
Railway detecta el push y usa `railway.json`
       │
       ▼
build Dockerfile: apps/api/Dockerfile
       │
       ▼
startCommand: pnpm start                       ← node dist/main
       │
       ▼
Healthcheck: GET /api/health → 200 OK
       │
       ▼
Tráfico enrutado al nuevo deploy
```

### Migraciones en Railway

Las migraciones Prisma no se ejecutan en cada arranque del contenedor.

Motivo:

- el servicio no debe quedar caído solo porque `DIRECT_URL` esté temporalmente inaccesible
- `prisma migrate deploy` depende de conexión directa estable a la base
- no conviene duplicar migraciones en `preDeployCommand` y `startCommand`

Flujo recomendado:

1. deploy del servicio con `pnpm start`
2. correr migraciones aparte cuando haga falta

En Railway:

- `preDeployCommand`: vacío
- `startCommand`: `pnpm start`

Comando:

```bash
pnpm db:migrate:prod
```

Si usás Supabase:

- `DATABASE_URL` debe apuntar al pooler
- `DIRECT_URL` debe apuntar a la conexión directa

### Staging en Railway

Para tener un ambiente de staging:

1. Crear un nuevo Service en el mismo Railway Project
2. Conectar la rama `develop` o `staging`
3. Agregar las mismas variables de entorno apuntando a URLs de staging

### PostgreSQL en Railway

Railway ofrece PostgreSQL como addon:

1. Railway Dashboard → New Service → Database → Add PostgreSQL
2. Copiar la `DATABASE_URL` generada a las variables del servicio API

---

## Cloudflare

### Registros DNS a crear

Configurar en Cloudflare Dashboard → DNS → Records:

| Tipo                | Nombre    | Contenido                      | Proxy                                                |
| ------------------- | --------- | ------------------------------ | ---------------------------------------------------- |
| `CNAME`             | `www`     | `cname.vercel-dns.com`         | ✅ Proxied                                           |
| `CNAME`             | `staging` | `cname.vercel-dns.com`         | ✅ Proxied                                           |
| `CNAME`             | `api`     | `{tu-servicio}.up.railway.app` | ✅ Proxied, cuando se configure `api.stagelink.link` |
| `A` / Vercel record | `@`       | destino indicado por Vercel    | ✅ Proxied                                           |

> **Nota**: Para `@` (dominio raíz), Vercel requiere agregar el dominio en su dashboard y te dará la IP exacta.

### Configuración SSL en Cloudflare

1. SSL/TLS → Mode: **Full (strict)**
2. Edge Certificates → Always Use HTTPS: **On**
3. Edge Certificates → Minimum TLS Version: **TLS 1.2**

### Cache básica para el API

En Cloudflare → Rules → Cache Rules:

```
If URL path starts with /api/
Then: Cache Level = Bypass
```

Esto evita que Cloudflare cachee respuestas del API (importante para CORS y auth).

### Dominios personalizados en Vercel y Railway

**Vercel**:

- Dashboard → Domain → Add `stagelink.link`, `www.stagelink.link`, `stagelink.art`, and `www.stagelink.art`
- Vercel te dará el CNAME a apuntar (normalmente `cname.vercel-dns.com`)
- `www.stagelink.link`, `stagelink.art` y `www.stagelink.art` deben redirigir de forma permanente al dominio canónico `https://stagelink.link`

**Railway**:

- Actual: usar `https://stagelink-production-18c8.up.railway.app` como `NEXT_PUBLIC_API_URL`
- Futuro: Dashboard → Settings → Networking → Custom Domain → Add `api.stagelink.link`
- Railway te dará el CNAME a apuntar (normalmente `{service}.up.railway.app`)

---

## Variables de entorno por entorno

### Regla general

| Variable              | Local                   | Preview            | Production                                                                        |
| --------------------- | ----------------------- | ------------------ | --------------------------------------------------------------------------------- |
| `NODE_ENV`            | `development`           | `preview`          | `production`                                                                      |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4001` | API de staging     | `https://stagelink-production-18c8.up.railway.app` o `https://api.stagelink.link` |
| `DATABASE_URL`        | docker local            | Railway staging DB | Railway prod DB                                                                   |

### Nunca commitear

- `.env` / `.env.local` — están en `.gitignore`
- Claves reales de AWS, Stripe, WorkOS
- `DATABASE_URL` con credenciales reales

---

## Healthcheck

El endpoint `/api/health` es público y retorna:

```json
{
  "status": "ok",
  "timestamp": "2026-03-25T11:00:00.000Z",
  "environment": "production",
  "version": "0.1.0",
  "uptime": 3600
}
```

Railway lo usa como healthcheck (`healthcheckPath: "/api/health"` en `railway.json`).

## WorkOS callback

El callback de autenticación vive en el frontend Next.js, no en NestJS:

```env
WORKOS_REDIRECT_URI=https://stagelink.link/api/auth/callback
```

Si todavía no tenés un dominio custom listo para la API, `NEXT_PUBLIC_API_URL` puede apuntar al dominio público de Railway. Lo importante es que `WORKOS_REDIRECT_URI` siempre apunte al frontend.
También sirve para monitoring externo (UptimeRobot, BetterStack, etc.).

---

## Debugging de deploys

### Vercel

```bash
# Ver logs del último deploy
vercel logs

# Ver estado de builds
gh workflow list  # Si usás GitHub Actions
```

### Railway

```bash
# Railway CLI
npm install -g @railway/cli
railway login
railway logs           # Logs en tiempo real
railway status         # Estado del servicio
railway variables      # Ver variables de entorno
```

### CORS en producción

Si hay errores de CORS en producción:

1. Verificar que `FRONTEND_URL` en Railway apunta a la URL correcta de Vercel
2. Para orígenes adicionales: agregar a `CORS_ALLOWED_ORIGINS` (comma-separated)
3. Los preview de Vercel (`*.vercel.app`) ya están permitidos automáticamente

### Prisma migrations en producción

```bash
# Ver estado de migraciones
railway run pnpm --filter @stagelink/api exec prisma migrate status

# Aplicar migraciones pendientes manualmente
railway run pnpm --filter @stagelink/api db:migrate:prod
```

---

## Preview deployments — Flujo completo

```
Developer abre PR
       │
       ▼
Vercel auto-deploys preview
URL: https://stagelink-git-{branch}.vercel.app
       │
       ▼
Frontend preview usa NEXT_PUBLIC_API_URL apuntando al dominio real del API
(staging Railway si está configurado, o al dominio público de Railway)
       │
       ▼
PR mergeado → deploy automático a producción
```

---

## Docker (alternativa para Fly.io)

Si preferís Fly.io en lugar de Railway:

```bash
# Instalar Fly CLI
brew install flyctl

# Login
flyctl auth login

# Crear app (desde apps/api/)
cd apps/api
flyctl launch --name stagelink-api --dockerfile Dockerfile

# Deploy
flyctl deploy

# Variables de entorno
flyctl secrets set NODE_ENV=production
flyctl secrets set DATABASE_URL=postgresql://...
flyctl secrets set FRONTEND_URL=https://stagelink.link
```

El `Dockerfile` en `apps/api/` está optimizado para esta opción con build multi-stage.
