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

# ---- Stage 2: Install all dependencies (includes devDeps like husky) ----
FROM base AS deps
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

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/

# Copy prisma schema (needed for prisma generate + prisma migrate deploy at runtime)
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Install production deps with --ignore-scripts to avoid husky (devDep) crashing
# the prepare lifecycle hook. We then run prisma generate explicitly below.
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Regenerate Prisma client for this platform (since we skipped postinstall scripts)
RUN pnpm --filter @stagelink/api exec prisma generate

# Copy compiled output
COPY --from=builder /app/apps/api/dist ./apps/api/dist

WORKDIR /app/apps/api

EXPOSE 4001

# Run migrations with prisma binary directly (no pnpm wrapper), then start with exec
# so node becomes PID 1 and receives signals correctly.
CMD ["sh", "-c", "/app/node_modules/.bin/prisma migrate deploy && exec node dist/main"]
