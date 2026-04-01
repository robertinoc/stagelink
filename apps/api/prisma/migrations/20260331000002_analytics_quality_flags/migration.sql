-- T4-4: Analytics quality flags
-- Adds 5 flag columns to analytics_events so every event is persisted
-- with quality metadata and filtered at aggregation time.
-- All defaults match the "clean / production" state so existing rows remain valid.

ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "is_bot_suspected"     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "is_internal"          BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "is_qa"                BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "has_tracking_consent" BOOLEAN;          -- null = unknown (server-side events)
ALTER TABLE "analytics_events" ADD COLUMN IF NOT EXISTS "environment"          TEXT    NOT NULL DEFAULT 'production';

CREATE INDEX IF NOT EXISTS "analytics_events_quality_flags_idx"
  ON "analytics_events"("artist_id", "is_bot_suspected", "is_internal", "is_qa", "environment");
