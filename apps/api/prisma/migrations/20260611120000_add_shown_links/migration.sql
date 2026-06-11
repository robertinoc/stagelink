-- Add shown_links column to artists table.
-- Stores an array of link-key strings (e.g. ["spotifyUrl","instagramUrl"]) that
-- should appear on the public artist page.
-- Empty array = legacy mode: show every non-null link (backward compat).
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "shown_links" JSONB NOT NULL DEFAULT '[]';
