# =============================================================
# StageLink API — Multi-stage Docker build
# Used by Railway (railway.json → builder: DOCKERFILE) and
# any other Docker-based hosting (Fly.io, etc.).
# Build context = repo root (monorepo).
# =============================================================

# ---- Stage 1: Base ----
FROM node:20-alpine AS base
# Install OpenSSL (required by Prisma on Alpine/musl)
RUN apk add --no-cache openssl
RUN npm install -g pnpm@latest --ignore-scripts
WORKDIR /app

# ---- Stage 2: Install all dependencies ----
FROM base AS deps
# Disable husky in CI/Docker (it's a devDep not available in --prod installs)
ENV HUSKY=0
# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile

# ---- Stage 3: Build ----
FROM deps AS builder
COPY . .
# Generate Prisma client then compile TypeScript
RUN pnpm --filter @stagelink/api exec prisma generate
RUN pnpm --filter @stagelink/api build

# ---- Stage 4: Production runtime ----
FROM base AS runner
ENV NODE_ENV=production
# Disable husky — not installed in production deps
ENV HUSKY=0

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/

# Copy prisma schema before install (needed for @prisma/client postinstall → generate)
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Install production deps only
# prisma is a regular dependency so `prisma migrate deploy` is available
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output
COPY --from=builder /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api

EXPOSE ${PORT:-4001}

# Run migrations then start
CMD ["sh", "-c", "pnpm db:migrate:prod && node dist/main"]
