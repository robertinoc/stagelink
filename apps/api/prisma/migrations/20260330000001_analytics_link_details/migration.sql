-- Add smart_link_resolution value to event_type enum
-- PostgreSQL requires ADD VALUE for enums; cannot be done inside a transaction
ALTER TYPE "event_type" ADD VALUE 'smart_link_resolution';

-- Add link-specific columns to analytics_events
-- Populated only for link_click and smart_link_resolution events.
ALTER TABLE "analytics_events"
  ADD COLUMN "link_item_id" TEXT,
  ADD COLUMN "label"        TEXT,
  ADD COLUMN "is_smart_link" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "smart_link_id" TEXT;

-- Index for top-links aggregation (group by link_item_id per artist in a range)
CREATE INDEX "analytics_events_artist_link_idx"
  ON "analytics_events" ("artist_id", "link_item_id", "created_at");
