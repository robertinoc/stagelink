-- Migration: 20260509000000_add_artist_full_bio
-- Adds full_bio column to the artists table.
-- REQ-08: Full bio lives in My Profile (artist); EPK inherits via fallback chain.
-- Nullable so existing rows are unaffected. No length cap at DB level — validation
-- happens in the API DTO (5000 chars max).

ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "full_bio" TEXT;
