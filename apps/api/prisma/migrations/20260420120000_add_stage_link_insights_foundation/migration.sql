-- CreateEnum
CREATE TYPE "insights_platform" AS ENUM ('spotify', 'youtube', 'soundcloud');

-- CreateEnum
CREATE TYPE "insights_connection_method" AS ENUM ('oauth', 'reference');

-- CreateEnum
CREATE TYPE "insights_connection_status" AS ENUM ('pending', 'connected', 'needs_reauth', 'error');

-- CreateEnum
CREATE TYPE "insights_sync_status" AS ENUM ('never', 'pending', 'success', 'partial', 'error');

-- CreateTable
CREATE TABLE "artist_platform_insights_connections" (
    "id" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "platform" "insights_platform" NOT NULL,
    "connection_method" "insights_connection_method" NOT NULL DEFAULT 'reference',
    "status" "insights_connection_status" NOT NULL DEFAULT 'pending',
    "external_account_id" TEXT,
    "external_handle" TEXT,
    "external_url" TEXT,
    "display_name" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "scopes" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "last_sync_started_at" TIMESTAMP(3),
    "last_synced_at" TIMESTAMP(3),
    "last_sync_status" "insights_sync_status" NOT NULL DEFAULT 'never',
    "last_sync_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artist_platform_insights_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artist_platform_insights_snapshots" (
    "id" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "platform" "insights_platform" NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL,
    "profile" JSONB NOT NULL DEFAULT '{}',
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "top_content" JSONB NOT NULL DEFAULT '[]',
    "notes" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artist_platform_insights_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "artist_platform_insights_connections_artist_id_platform_key" ON "artist_platform_insights_connections"("artist_id", "platform");

-- CreateIndex
CREATE INDEX "artist_platform_insights_connections_platform_status_idx" ON "artist_platform_insights_connections"("platform", "status");

-- CreateIndex
CREATE INDEX "artist_platform_insights_connections_artist_id_last_synced_at_idx" ON "artist_platform_insights_connections"("artist_id", "last_synced_at");

-- CreateIndex
CREATE INDEX "artist_platform_insights_snapshots_artist_id_platform_captured_at_idx" ON "artist_platform_insights_snapshots"("artist_id", "platform", "captured_at" DESC);

-- CreateIndex
CREATE INDEX "artist_platform_insights_snapshots_connection_id_captured_at_idx" ON "artist_platform_insights_snapshots"("connection_id", "captured_at" DESC);

-- AddForeignKey
ALTER TABLE "artist_platform_insights_connections" ADD CONSTRAINT "artist_platform_insights_connections_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_platform_insights_snapshots" ADD CONSTRAINT "artist_platform_insights_snapshots_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artist_platform_insights_snapshots" ADD CONSTRAINT "artist_platform_insights_snapshots_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "artist_platform_insights_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
