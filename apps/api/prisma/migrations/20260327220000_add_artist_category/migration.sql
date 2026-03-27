-- CreateEnum
CREATE TYPE "artist_category" AS ENUM (
  'musician', 'dj', 'actor', 'actress', 'painter',
  'visual_artist', 'performer', 'creator', 'band', 'producer', 'other'
);

-- AlterTable: add category column with default
ALTER TABLE "artists" ADD COLUMN "category" "artist_category" NOT NULL DEFAULT 'other';
