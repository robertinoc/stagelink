-- CreateEnum
CREATE TYPE "merch_provider" AS ENUM ('printful', 'printify');

-- AlterEnum
ALTER TYPE "block_type" ADD VALUE IF NOT EXISTS 'smart_merch';

-- CreateTable
CREATE TABLE "merch_provider_connections" (
    "id" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "provider" "merch_provider" NOT NULL DEFAULT 'printful',
    "api_token" TEXT NOT NULL,
    "store_id" TEXT,
    "store_name" TEXT,
    "is_connected" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merch_provider_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "merch_provider_connections_artist_id_key" ON "merch_provider_connections"("artist_id");

-- CreateIndex
CREATE INDEX "merch_provider_connections_provider_idx" ON "merch_provider_connections"("provider");

-- AddForeignKey
ALTER TABLE "merch_provider_connections" ADD CONSTRAINT "merch_provider_connections_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
