-- Create shop_coupons table and add couponId to shop_orders.
-- Idempotent: uses IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS "shop_coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "value" DECIMAL(10,2) NOT NULL,
    "minSubtotal" DECIMAL(10,2),
    "maxDiscount" DECIMAL(10,2),
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_coupons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "shop_coupons_code_key" ON "shop_coupons"("code");

ALTER TABLE "shop_orders" ADD COLUMN IF NOT EXISTS "couponId" TEXT;
CREATE INDEX IF NOT EXISTS "shop_orders_couponId_idx" ON "shop_orders"("couponId");

ALTER TABLE "shop_orders"
    ADD CONSTRAINT "shop_orders_couponId_fkey"
    FOREIGN KEY ("couponId") REFERENCES "shop_coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
