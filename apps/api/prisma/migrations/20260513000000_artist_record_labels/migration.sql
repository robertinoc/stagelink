-- Move record labels from EPK (plain text) to Artist (structured JSON array).
-- Each label item: { id, name, websiteUrl, logoUrl }.

-- Add structured record_labels column to artists table
ALTER TABLE "artists" ADD COLUMN "record_labels" JSONB NOT NULL DEFAULT '[]';

-- Drop the old plain-text column from epks table
ALTER TABLE "epks" DROP COLUMN IF EXISTS "record_labels";
