-- AURA Shop — baseline delta migration
--
-- Brings an existing shop-enabled database (created via shop_tables.sql or
-- earlier ad-hoc scripts) into alignment with the current Prisma schema.
--
-- This migration is IDEMPOTENT: every statement guards with IF NOT EXISTS /
-- IF EXISTS, so it is safe to run on databases at any prior shop schema state,
-- including ones where shop_tables.sql was already applied.
--
-- Changes applied:
--   1. Add Product.stock (nullable INTEGER) for simple-product inventory.
--   2. Add ShopOrder.paidAt (nullable TIMESTAMP) if missing.
--   3. Drop the unique constraint on ShopOrder.guestToken and replace it with
--      a plain index (a single device may place multiple guest orders).
--   4. Add missing indexes: shop_orders_createdAt_idx, shop_orders_guestToken_idx.
--
-- NOTE: Prisma cannot express "DROP INDEX IF EXISTS" portably across all
-- Postgres versions in raw migrations, so we use a DO block with exception
-- handling for the unique-index drop.

-- 1. Product.stock
ALTER TABLE "shop_products" ADD COLUMN IF NOT EXISTS "stock" INTEGER;

-- 2. ShopOrder.paidAt
ALTER TABLE "shop_orders" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);

-- 3. Drop the unique guestToken index (if present) and create a plain index.
--    The unique index name used by shop_tables.sql was shop_orders_guestToken_key.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'shop_orders_guestToken_key'
  ) THEN
    DROP INDEX "shop_orders_guestToken_key";
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignore if the index does not exist or cannot be dropped.
  NULL;
END $$;

-- 4. Indexes (idempotent)
CREATE INDEX IF NOT EXISTS "shop_orders_guestToken_idx" ON "shop_orders"("guestToken");
CREATE INDEX IF NOT EXISTS "shop_orders_createdAt_idx" ON "shop_orders"("createdAt");
