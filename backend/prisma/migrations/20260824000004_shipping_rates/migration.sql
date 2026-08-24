-- Create shop_shipping_rates table for region-based shipping rates.
-- Idempotent: uses IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS "shop_shipping_rates" (
    "id" TEXT NOT NULL,
    "region" TEXT,
    "rate" DECIMAL(10,2) NOT NULL,
    "freeShippingOver" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_shipping_rates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "shop_shipping_rates_region_key" ON "shop_shipping_rates"("region");
