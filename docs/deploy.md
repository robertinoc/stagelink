# StageLink — Guía de Deploy

## Arquitectura

```
                    Cloudflare (DNS + CDN + SSL)
                           │
            ┌──────────────┼──────────────┐
            │              │              │
    app.stagelink.io  api.stagelink.io  stagelink.io
            │              │              │
          Vercel        Railway         Vercel
         (Next.js)     (NestJS)       (marketing)
```

| Servicio              | Plataforma | URL de producción           |
| --------------------- | ---------- | --------------------------- |
| Frontend (`apps/web`) | Vercel     | `https://app.stagelink.io`  |
| Backend (`apps/api`)  | Railway    | `https://api.stagelink.io`  |
| DNS / CDN / SSL       | Cloudflare | gestiona todos los dominios |

---

## Entornos

| Entorno        | Frontend                               | Backend                 |
| -------------- | -------------------------------------- | ----------------------- |
| **Production** | `app.stagelink.io`                     | `api.stagelink.io`      |
| **Staging**    | `staging.stagelink.io` (Vercel branch) | Railway staging service |
| **Preview**    | `stagelink-git-{branch}.vercel.app`    | — (usa API de staging)  |
| **Local**      | `localhost:4000`                       | `localhost:4001`        |

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

| Variable                   | Production                                   | Preview                    | Development             |
| -------------------------- | -------------------------------------------- | -------------------------- | ----------------------- |
| `NEXT_PUBLIC_APP_URL`      | `https://app.stagelink.io`                   | URL de preview             | `http://localhost:4000` |
| `NEXT_PUBLIC_API_URL`      | `https://api.stagelink.io`                   | `https://api.stagelink.io` | `http://localhost:4001` |
| `NEXT_PUBLIC_POSTHOG_KEY`  | tu key                                       | —                          | —                       |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://app.posthog.com`                    | —                          | —                       |
| `WORKOS_CLIENT_ID`         | tu client ID                                 | —                          | —                       |
| `WORKOS_API_KEY`           | tu API key                                   | —                          | —                       |
| `WORKOS_REDIRECT_URI`      | `https://app.stagelink.io/api/auth/callback` | —                          | —                       |

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
3. **Root Directory**: `/` (raíz del monorepo — Railway lee `railway.json`)
4. Railway detecta el `railway.json` y usa los comandos definidos ahí

### Variables de entorno en Railway

Configurar en Railway Dashboard → Variables:

```bash
NODE_ENV=production
PORT=4001                          # Railway lo sobreescribe automáticamente
APP_URL=https://api.stagelink.io
FRONTEND_URL=https://app.stagelink.io
CORS_ALLOWED_ORIGINS=https://app.stagelink.io,https://staging.stagelink.io

# PostgreSQL (Railway puede proveer una DB directamente)
DATABASE_URL=postgresql://...

# WorkOS (cuando se implemente auth — T2)
WORKOS_CLIENT_ID=
WORKOS_API_KEY=
WORKOS_REDIRECT_URI=https://api.stagelink.io/api/auth/callback

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
Railway detecta el push
       │
       ▼
pnpm install --frozen-lockfile
pnpm --filter @stagelink/api build
       │
       ▼
pnpm --filter @stagelink/api db:migrate:prod   ← prisma migrate deploy
pnpm --filter @stagelink/api start             ← node dist/main
       │
       ▼
Healthcheck: GET /api/health → 200 OK
       │
       ▼
Tráfico enrutado al nuevo deploy
```

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

| Tipo    | Nombre    | Contenido                   | Proxy      |
| ------- | --------- | --------------------------- | ---------- |
| `CNAME` | `app`     | `cname.vercel-dns.com`      | ✅ Proxied |
| `CNAME` | `api`     | `{tu-servicio}.railway.app` | ✅ Proxied |
| `CNAME` | `staging` | `cname.vercel-dns.com`      | ✅ Proxied |
| `A`     | `@`       | IP de Vercel (ver paso 3)   | ✅ Proxied |

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

- Dashboard → Domain → Add `app.stagelink.io`
- Vercel te dará el CNAME a apuntar (normalmente `cname.vercel-dns.com`)

**Railway**:

- Dashboard → Settings → Networking → Custom Domain → Add `api.stagelink.io`
- Railway te dará el CNAME a apuntar (normalmente `{service}.up.railway.app`)

---

## Variables de entorno por entorno

### Regla general

| Variable              | Local                   | Preview                    | Production                 |
| --------------------- | ----------------------- | -------------------------- | -------------------------- |
| `NODE_ENV`            | `development`           | `preview`                  | `production`               |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4001` | `https://api.stagelink.io` | `https://api.stagelink.io` |
| `DATABASE_URL`        | docker local            | Railway staging DB         | Railway prod DB            |

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
Frontend preview usa NEXT_PUBLIC_API_URL=https://api.stagelink.io
(staging Railway si está configurado, o producción)
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
flyctl secrets set FRONTEND_URL=https://app.stagelink.io
```

El `Dockerfile` en `apps/api/` está optimizado para esta opción con build multi-stage.
