-- Phase 1: Access architecture and internal administration.
--
-- Adds manual (admin-granted) temporary access fields to the subscription.
-- These are fully independent of the commercial Stripe billing columns
-- (`plan`, `status`, `stripe_*`). A manual grant lets a Behind-the-Stage
-- owner give a tenant PRO / PRO+ access for a bounded period without
-- touching their real billing state.
--
-- All columns are nullable: NULL means "no manual grant".
--   manual_access_plan        — PRO or PRO+ (never `free` in practice)
--   manual_access_starts_at   — when the grant becomes active (NULL = immediately)
--   manual_access_expires_at  — when the grant lapses (NULL = no expiry)
--   manual_access_reason      — free-text justification (audit trail)
--   manual_access_granted_by  — admin User.id who granted it
--
-- Additive-only / idempotent so it is safe to re-run.

ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "manual_access_plan" "plan_tier";
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "manual_access_starts_at" TIMESTAMP(3);
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "manual_access_expires_at" TIMESTAMP(3);
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "manual_access_reason" TEXT;
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "manual_access_granted_by" TEXT;
