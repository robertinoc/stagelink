ALTER TYPE "subscription_status" ADD VALUE IF NOT EXISTS 'inactive';

ALTER TABLE "subscriptions"
ALTER COLUMN "status" SET DEFAULT 'inactive';

UPDATE "subscriptions"
SET "status" = 'inactive'
WHERE "plan" = 'free'
  AND "stripe_subscription_id" IS NULL;
