CREATE TABLE "stripe_webhook_events" (
  "id" TEXT NOT NULL,
  "stripe_event_id" TEXT NOT NULL,
  "stripe_event_type" TEXT NOT NULL,
  "artist_id" TEXT,
  "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stripe_webhook_events_stripe_event_id_key"
ON "stripe_webhook_events"("stripe_event_id");

CREATE INDEX "stripe_webhook_events_artist_id_processed_at_idx"
ON "stripe_webhook_events"("artist_id", "processed_at");
