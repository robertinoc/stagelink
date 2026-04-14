-- CreateEnum
CREATE TYPE "shopify_selection_mode" AS ENUM ('collection', 'products');

-- AlterEnum
ALTER TYPE "block_type" ADD VALUE 'shopify_store';

-- CreateTable
CREATE TABLE "shopify_connections" (
    "id" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "store_domain" TEXT NOT NULL,
    "storefront_token" TEXT NOT NULL,
    "store_name" TEXT,
    "is_connected" BOOLEAN NOT NULL DEFAULT false,
    "selection_mode" "shopify_selection_mode" NOT NULL DEFAULT 'collection',
    "collection_handle" TEXT,
    "product_handles" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shopify_connections_artist_id_key" ON "shopify_connections"("artist_id");

-- CreateIndex
CREATE INDEX "shopify_connections_store_domain_idx" ON "shopify_connections"("store_domain");

-- AddForeignKey
ALTER TABLE "shopify_connections" ADD CONSTRAINT "shopify_connections_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
