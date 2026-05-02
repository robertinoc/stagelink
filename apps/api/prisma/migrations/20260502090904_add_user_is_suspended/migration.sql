-- Migration: add_user_is_suspended
-- Adds a boolean flag to soft-suspend platform users.
-- DEFAULT false ensures all existing users remain active.
-- The NOT NULL constraint + DEFAULT makes this safe on a live table.

ALTER TABLE "users" ADD COLUMN "is_suspended" BOOLEAN NOT NULL DEFAULT false;
