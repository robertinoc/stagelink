-- T4-4 follow-up: convert analytics_events.environment from TEXT to an
-- explicit enum. This prevents silent misspellings (e.g. 'prod', 'test')
-- that would cause events to escape the QUALITY_FILTER undetected.
--
-- All existing rows have environment='production' (the default from migration
-- 20260331000002), so the cast is safe with no data loss.

CREATE TYPE "analytics_environment" AS ENUM ('production', 'staging', 'development');

ALTER TABLE "analytics_events"
  ALTER COLUMN "environment" DROP DEFAULT;

ALTER TABLE "analytics_events"
  ALTER COLUMN "environment" TYPE "analytics_environment"
    USING "environment"::"analytics_environment";

ALTER TABLE "analytics_events"
  ALTER COLUMN "environment" SET DEFAULT 'production'::"analytics_environment";
