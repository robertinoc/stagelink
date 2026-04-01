-- =============================================================
-- T4-3: Fan Email Capture — Subscriber model enrichment
--
-- Changes:
--   1. Add SubscriberStatus enum (active | unsubscribed)
--   2. Add fan_capture_submit to EventType enum
--   3. Enrich subscribers table:
--      - artist_id  (denormalised for efficient per-artist queries)
--      - page_id    (nullable — which page hosted the block)
--      - status     (active | unsubscribed)
--      - ip_hash    (SHA-256 of submitter IP — privacy-preserving)
--      - consent_text (snapshot of consent label shown at submit time)
--      - source_page_path (URL path at submit time, optional)
--      - locale     (visitor locale, optional)
--      - updated_at
--   4. Change unique constraint: blockId+email → artistId+email
--      (same fan can't subscribe twice to same artist, regardless of block)
-- =============================================================

-- 1. Add SubscriberStatus enum
CREATE TYPE "subscriber_status" AS ENUM ('active', 'unsubscribed');

-- 2. Add fan_capture_submit to EventType enum
ALTER TYPE "event_type" ADD VALUE IF NOT EXISTS 'fan_capture_submit';

-- 3. Enrich subscribers table

-- 3a. Add artist_id (backfill from block→page→artist join)
ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "artist_id" TEXT;

UPDATE "subscribers" s
SET "artist_id" = p."artist_id"
FROM "blocks" b
JOIN "pages" p ON b."page_id" = p."id"
WHERE s."block_id" = b."id";

-- Make artist_id NOT NULL after backfill
ALTER TABLE "subscribers" ALTER COLUMN "artist_id" SET NOT NULL;

-- 3b. Add page_id (nullable — backfilled from block→page)
ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "page_id" TEXT;

UPDATE "subscribers" s
SET "page_id" = b."page_id"
FROM "blocks" b
WHERE s."block_id" = b."id";

-- 3c. Add status column (default active)
ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "status" "subscriber_status" NOT NULL DEFAULT 'active';

-- 3d. Add ip_hash (nullable — not always available)
ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "ip_hash" TEXT;

-- 3e. Add consent_text snapshot (nullable — the label shown to the user)
ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "consent_text" TEXT;

-- 3f. Add source_page_path (nullable — pathname at submit time)
ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "source_page_path" TEXT;

-- 3g. Add locale (nullable — visitor locale)
ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "locale" TEXT;

-- 3h. Add updated_at
ALTER TABLE "subscribers" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 4. Change unique constraint: drop [block_id, email], add [artist_id, email]
ALTER TABLE "subscribers" DROP CONSTRAINT IF EXISTS "subscribers_block_id_email_key";
CREATE UNIQUE INDEX IF NOT EXISTS "subscribers_artist_id_email_key" ON "subscribers"("artist_id", "email");

-- 5. Add indexes for efficient per-artist queries
CREATE INDEX IF NOT EXISTS "subscribers_artist_id_created_at_idx" ON "subscribers"("artist_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "subscribers_artist_id_status_idx" ON "subscribers"("artist_id", "status");
