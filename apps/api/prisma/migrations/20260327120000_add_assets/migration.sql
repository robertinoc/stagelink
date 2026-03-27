-- =============================================================
-- Migration: add_assets
-- Adds the assets table and references on artists.
-- Handles circular FK by creating assets first, then adding
-- the avatar/cover FK columns on artists.
-- =============================================================

-- 1. Create enums
CREATE TYPE "asset_kind" AS ENUM ('avatar', 'cover');
CREATE TYPE "asset_status" AS ENUM ('pending', 'uploaded', 'failed', 'deleted');

-- 2. Create assets table (artist_id FK added after)
CREATE TABLE "assets" (
    "id"                TEXT        NOT NULL,
    "artist_id"         TEXT        NOT NULL,
    "kind"              "asset_kind" NOT NULL,
    "storage_provider"  TEXT        NOT NULL DEFAULT 's3',
    "bucket"            TEXT        NOT NULL,
    "object_key"        TEXT        NOT NULL,
    "original_filename" TEXT,
    "mime_type"         TEXT        NOT NULL,
    "size_bytes"        INTEGER     NOT NULL,
    "delivery_url"      TEXT,
    "status"            "asset_status" NOT NULL DEFAULT 'pending',
    "created_by_user_id" TEXT       NOT NULL,
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- 3. Indexes on assets
CREATE UNIQUE INDEX "assets_object_key_key" ON "assets"("object_key");
CREATE INDEX "assets_artist_id_kind_idx" ON "assets"("artist_id", "kind");

-- 4. FK: assets.artist_id → artists.id
ALTER TABLE "assets"
    ADD CONSTRAINT "assets_artist_id_fkey"
    FOREIGN KEY ("artist_id") REFERENCES "artists"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. FK: assets.created_by_user_id → users.id
ALTER TABLE "assets"
    ADD CONSTRAINT "assets_created_by_user_id_fkey"
    FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Add avatar/cover reference columns to artists
ALTER TABLE "artists"
    ADD COLUMN "avatar_asset_id" TEXT,
    ADD COLUMN "cover_asset_id"  TEXT;

-- 7. Unique constraints (one avatar / one cover per artist)
CREATE UNIQUE INDEX "artists_avatar_asset_id_key" ON "artists"("avatar_asset_id");
CREATE UNIQUE INDEX "artists_cover_asset_id_key"  ON "artists"("cover_asset_id");

-- 8. FK: artists.avatar_asset_id → assets.id
ALTER TABLE "artists"
    ADD CONSTRAINT "artists_avatar_asset_id_fkey"
    FOREIGN KEY ("avatar_asset_id") REFERENCES "assets"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 9. FK: artists.cover_asset_id → assets.id
ALTER TABLE "artists"
    ADD CONSTRAINT "artists_cover_asset_id_fkey"
    FOREIGN KEY ("cover_asset_id") REFERENCES "assets"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
