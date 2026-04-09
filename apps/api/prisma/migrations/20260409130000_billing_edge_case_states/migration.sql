ALTER TYPE "subscription_status" ADD VALUE IF NOT EXISTS 'unpaid';
ALTER TYPE "subscription_status" ADD VALUE IF NOT EXISTS 'incomplete_expired';

ALTER TABLE "subscriptions"
ADD COLUMN "last_stripe_event_at" TIMESTAMP(3);

ALTER TABLE "stripe_webhook_events"
ADD COLUMN "stripe_event_at" TIMESTAMP(3);

UPDATE "stripe_webhook_events"
SET "stripe_event_at" = COALESCE("processed_at", "created_at")
WHERE "stripe_event_at" IS NULL;

ALTER TABLE "stripe_webhook_events"
ALTER COLUMN "stripe_event_at" SET NOT NULL;

DROP INDEX IF EXISTS "stripe_webhook_events_artist_id_processed_at_idx";
CREATE INDEX "stripe_webhook_events_artist_id_stripe_event_at_idx"
ON "stripe_webhook_events"("artist_id", "stripe_event_at");
