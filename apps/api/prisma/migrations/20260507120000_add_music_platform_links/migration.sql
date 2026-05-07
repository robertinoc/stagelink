-- Migration: 20260507120000_add_music_platform_links
-- Adds streaming platform and music store URL columns to the artists table.
-- REQ-06: Apple Music, Amazon Music, Deezer, Tidal
-- REQ-07: Beatport, Traxsource
-- All columns are nullable so existing rows are unaffected.

ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "apple_music_url"  TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "amazon_music_url" TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "deezer_url"       TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "tidal_url"        TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "beatport_url"     TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "traxsource_url"   TEXT;
