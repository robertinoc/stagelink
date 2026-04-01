-- Migrate any existing 'actress' records to 'actor'
UPDATE "artists" SET "category" = 'actor' WHERE "category" = 'actress';

-- Recreate enum without 'actress'
-- PostgreSQL doesn't support removing enum values directly,
-- so we rename old → temp, create new, migrate, drop temp

ALTER TYPE "artist_category" RENAME TO "artist_category_old";

CREATE TYPE "artist_category" AS ENUM (
  'musician', 'dj', 'actor', 'painter',
  'visual_artist', 'performer', 'creator', 'band', 'producer', 'other'
);

ALTER TABLE "artists" ALTER COLUMN "category" DROP DEFAULT;

ALTER TABLE "artists"
  ALTER COLUMN "category" TYPE "artist_category"
  USING "category"::text::"artist_category";

ALTER TABLE "artists" ALTER COLUMN "category" SET DEFAULT 'other';

DROP TYPE "artist_category_old";
