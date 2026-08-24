-- Migrate money columns from DOUBLE PRECISION (Float) to DECIMAL(10,2).
--
-- This prevents floating-point rounding drift on ETB monetary values.
-- PostgreSQL can cast DOUBLE PRECISION → DECIMAL implicitly, so we use
-- ALTER COLUMN ... TYPE DECIMAL(10,2) USING column::DECIMAL(10,2) for
-- each money column. Idempotent: re-running is a no-op if the column is
-- already DECIMAL (the USING clause is harmless on an already-DECIMAL col).

-- shop_products
ALTER TABLE "shop_products" ALTER COLUMN "basePrice" TYPE DECIMAL(10,2) USING "basePrice"::DECIMAL(10,2);
ALTER TABLE "shop_products" ALTER COLUMN "salePrice" TYPE DECIMAL(10,2) USING "salePrice"::DECIMAL(10,2);

-- shop_product_variants
ALTER TABLE "shop_product_variants" ALTER COLUMN "priceDelta" TYPE DECIMAL(10,2) USING "priceDelta"::DECIMAL(10,2);

-- shop_orders
ALTER TABLE "shop_orders" ALTER COLUMN "subtotal" TYPE DECIMAL(10,2) USING "subtotal"::DECIMAL(10,2);
ALTER TABLE "shop_orders" ALTER COLUMN "shippingCost" TYPE DECIMAL(10,2) USING "shippingCost"::DECIMAL(10,2);
ALTER TABLE "shop_orders" ALTER COLUMN "discount" TYPE DECIMAL(10,2) USING "discount"::DECIMAL(10,2);
ALTER TABLE "shop_orders" ALTER COLUMN "total" TYPE DECIMAL(10,2) USING "total"::DECIMAL(10,2);

-- shop_order_items
ALTER TABLE "shop_order_items" ALTER COLUMN "unitPrice" TYPE DECIMAL(10,2) USING "unitPrice"::DECIMAL(10,2);
ALTER TABLE "shop_order_items" ALTER COLUMN "lineTotal" TYPE DECIMAL(10,2) USING "lineTotal"::DECIMAL(10,2);
