-- =============================================================
-- Migration: block_engine
--
-- Changes:
--   1. Rename BlockType enum values to match @stagelink/types
--   2. Migrate `url` column data into `config` JSON before dropping
--   3. Drop `url` column (now lives inside config per block type)
--   4. Rename `metadata` → `config`
--   5. Rename `is_visible` → `is_published`
--
-- Safe operations:
--   - ALTER TYPE RENAME VALUE is supported in PostgreSQL 10+ — no data loss
--   - Column renames preserve data and indexes (Postgres references by OID)
--   - URL data is migrated into config before the column is dropped
-- =============================================================

-- Step 1: Rename BlockType enum values
ALTER TYPE "block_type" RENAME VALUE 'link'        TO 'links';
ALTER TYPE "block_type" RENAME VALUE 'music'       TO 'music_embed';
ALTER TYPE "block_type" RENAME VALUE 'video'       TO 'video_embed';
ALTER TYPE "block_type" RENAME VALUE 'fan_capture' TO 'email_capture';

-- Step 2a: Migrate url → config.embedUrl for music/video blocks
UPDATE "blocks"
SET "metadata" = jsonb_set(
    COALESCE("metadata"::jsonb, '{}'),
    '{embedUrl}',
    to_jsonb("url")
)
WHERE "url" IS NOT NULL
  AND "type" IN ('music_embed', 'video_embed');

-- Step 2b: Migrate url → config.items[0] for links blocks
UPDATE "blocks"
SET "metadata" = jsonb_set(
    COALESCE("metadata"::jsonb, '{}'),
    '{items}',
    jsonb_build_array(
        jsonb_build_object(
            'label', COALESCE("title", 'Link'),
            'url',   "url"
        )
    )
)
WHERE "url" IS NOT NULL
  AND "type" = 'links';

-- Step 3: Drop the now-redundant url column
ALTER TABLE "blocks" DROP COLUMN IF EXISTS "url";

-- Step 4: Rename metadata → config
ALTER TABLE "blocks" RENAME COLUMN "metadata" TO "config";

-- Step 5: Rename is_visible → is_published
ALTER TABLE "blocks" RENAME COLUMN "is_visible" TO "is_published";
