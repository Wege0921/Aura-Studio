-- Add tracking number and carrier fields to shop_orders.
-- Idempotent: uses IF NOT EXISTS so re-running is a no-op.

ALTER TABLE "shop_orders" ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT;
ALTER TABLE "shop_orders" ADD COLUMN IF NOT EXISTS "carrier" TEXT;
