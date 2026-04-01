-- Migration: 20260327235959_artist_profile_fields
-- Adds social link columns and SEO metadata columns to the artists table.
-- All columns are nullable so existing rows are unaffected.

ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "instagram_url"   TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "tiktok_url"      TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "youtube_url"     TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "spotify_url"     TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "soundcloud_url"  TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "website_url"     TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "contact_email"   TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "seo_title"       TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "seo_description" TEXT;
