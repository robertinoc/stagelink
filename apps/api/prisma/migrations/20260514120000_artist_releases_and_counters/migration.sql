-- REQ-10 + REQ-11: add releases catalog and public counters to artists.
--
-- `releases` is a JSONB array of ArtistRelease objects:
--   { id, title, type, releaseDate, coverUrl, spotifyUrl, label, description }
-- See packages/types/src/artist.ts for the canonical TypeScript shape.
--
-- The two counter columns are nullable on purpose — null means "hide" on the
-- public landing page. Zero is treated identically to null in the FE.

ALTER TABLE "artists" ADD COLUMN "releases" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "artists" ADD COLUMN "eps_released_count" INTEGER;
ALTER TABLE "artists" ADD COLUMN "external_collabs_count" INTEGER;
