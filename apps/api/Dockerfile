# =============================================================
# StageLink API — Single-stage build for Railway
# Build context = repo root (monorepo).
#
# We use a single stage (no multi-stage copy of node_modules)
# because pnpm uses symlinks in its virtual store that break
# when copied between Docker stages via COPY --from=builder.
# =============================================================

FROM node:20-alpine

# OpenSSL required by Prisma on Alpine/musl
RUN apk add --no-cache openssl

RUN npm install -g pnpm@latest --ignore-scripts

WORKDIR /app

# Disable husky (devDep, would crash install)
ENV HUSKY=0

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/

# Install all deps (pnpm symlinks stay intact — no cross-stage copy)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source and compile
COPY . .
RUN pnpm --filter @stagelink/api exec prisma generate
RUN pnpm --filter @stagelink/api build

WORKDIR /app/apps/api

ENV NODE_ENV=production
EXPOSE 4001

# Run migrations then start (prisma via absolute path, exec → node is PID 1)
CMD ["sh", "-c", "/app/node_modules/.bin/prisma migrate deploy && exec node dist/main"]
