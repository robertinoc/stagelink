-- CreateEnum
CREATE TYPE "block_type" AS ENUM ('link', 'music', 'video', 'fan_capture');

-- CreateEnum
CREATE TYPE "event_type" AS ENUM ('page_view', 'link_click');

-- CreateEnum
CREATE TYPE "plan_tier" AS ENUM ('free', 'pro', 'pro_plus');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('active', 'canceled', 'past_due', 'trialing', 'incomplete');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "workos_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artists" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "bio" TEXT,
    "avatar_url" TEXT,
    "cover_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "title" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "type" "block_type" NOT NULL,
    "title" TEXT,
    "url" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "block_id" TEXT,
    "event_type" "event_type" NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "country" TEXT,
    "device" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribers" (
    "id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "plan" "plan_tier" NOT NULL DEFAULT 'free',
    "status" "subscription_status" NOT NULL DEFAULT 'active',
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "current_period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_workos_id_key" ON "users"("workos_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "artists_username_key" ON "artists"("username");

-- CreateIndex
CREATE UNIQUE INDEX "pages_artist_id_key" ON "pages"("artist_id");

-- CreateIndex
CREATE INDEX "blocks_page_id_position_idx" ON "blocks"("page_id", "position");

-- CreateIndex
CREATE INDEX "analytics_events_artist_id_created_at_idx" ON "analytics_events"("artist_id", "created_at");

-- CreateIndex
CREATE INDEX "analytics_events_artist_id_event_type_created_at_idx" ON "analytics_events"("artist_id", "event_type", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_block_id_email_key" ON "subscribers"("block_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_artist_id_key" ON "subscriptions"("artist_id");

-- AddForeignKey
ALTER TABLE "artists" ADD CONSTRAINT "artists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
