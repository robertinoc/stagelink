ALTER TABLE "subscriptions"
ADD COLUMN "stripe_price_id" TEXT,
ADD COLUMN "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false;
