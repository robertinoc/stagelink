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
# Build shared packages first — @stagelink/types points to dist/ (not src/),
# so it must be compiled before the API build can resolve the module.
# --ignore-scripts on install skips the prepare script, so we build explicitly.
RUN pnpm --filter @stagelink/types build
RUN pnpm --filter @stagelink/api exec prisma generate
RUN pnpm --filter @stagelink/api build

WORKDIR /app/apps/api

ENV NODE_ENV=production
# Default port matches configuration.ts (PORT ?? 4001).
# Railway injects $PORT at runtime and the app reads process.env.PORT —
# this EXPOSE is documentation only, not a port binding.
EXPOSE 4001

# Direct node invocation — no shell wrapper, node is PID 1.
# Start command (migrations + start) is defined in railway.toml.
CMD ["node", "dist/main"]
