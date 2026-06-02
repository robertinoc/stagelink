-- Add onboarding_email_sent to the EventType enum
ALTER TYPE "event_type" ADD VALUE IF NOT EXISTS 'onboarding_email_sent';

-- Create onboarding_states table
CREATE TABLE "onboarding_states" (
    "id"                         TEXT NOT NULL,
    "artist_id"                  TEXT NOT NULL,
    "welcome_email_sent_at"      TIMESTAMP(3),
    "reengagement_email_sent_at" TIMESTAMP(3),
    "reengagement_variant"       TEXT,
    "activation_email_sent_at"   TIMESTAMP(3),
    "is_dismissed"               BOOLEAN NOT NULL DEFAULT false,
    "created_at"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                 TIMESTAMP(3) NOT NULL,

    CONSTRAINT "onboarding_states_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "onboarding_states_artist_id_key" ON "onboarding_states"("artist_id");

ALTER TABLE "onboarding_states"
    ADD CONSTRAINT "onboarding_states_artist_id_fkey"
    FOREIGN KEY ("artist_id") REFERENCES "artists"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
