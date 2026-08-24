-- AURA Shop — create shop tables only (additive, does not touch existing tables)
-- Safe to run on production database

-- Categories
CREATE TABLE IF NOT EXISTS "shop_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "shop_categories_slug_key" ON "shop_categories"("slug");

-- Products
CREATE TABLE IF NOT EXISTS "shop_products" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "salePrice" DOUBLE PRECISION,
    "sku" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "weightGrams" INTEGER,
    "stock" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_products_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "shop_products_slug_key" ON "shop_products"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "shop_products_sku_key" ON "shop_products"("sku");
CREATE INDEX IF NOT EXISTS "shop_products_categoryId_idx" ON "shop_products"("categoryId");
CREATE INDEX IF NOT EXISTS "shop_products_status_idx" ON "shop_products"("status");
CREATE INDEX IF NOT EXISTS "shop_products_isFeatured_idx" ON "shop_products"("isFeatured");

ALTER TABLE "shop_products"
    ADD CONSTRAINT "shop_products_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "shop_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Product Variants
CREATE TABLE IF NOT EXISTS "shop_product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "size" TEXT,
    "color" TEXT,
    "style" TEXT,
    "sku" TEXT,
    "priceDelta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_product_variants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "shop_product_variants_sku_key" ON "shop_product_variants"("sku");
CREATE INDEX IF NOT EXISTS "shop_product_variants_productId_idx" ON "shop_product_variants"("productId");

ALTER TABLE "shop_product_variants"
    ADD CONSTRAINT "shop_product_variants_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "shop_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Product Images
CREATE TABLE IF NOT EXISTS "shop_product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_product_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "shop_product_images_productId_idx" ON "shop_product_images"("productId");

ALTER TABLE "shop_product_images"
    ADD CONSTRAINT "shop_product_images_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "shop_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Shop Orders
CREATE TABLE IF NOT EXISTS "shop_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT,
    "guestToken" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "subtotal" DOUBLE PRECISION NOT NULL,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT,
    "paymentReceiptUrl" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "shippingFullName" TEXT NOT NULL,
    "shippingPhone" TEXT NOT NULL,
    "shippingRegion" TEXT NOT NULL,
    "shippingCity" TEXT NOT NULL,
    "shippingAddress" TEXT NOT NULL,
    "shippingPostalCode" TEXT,
    "shippingNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_orders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "shop_orders_orderNumber_key" ON "shop_orders"("orderNumber");
-- guestToken is no longer unique: a single device may place multiple guest orders,
-- each with its own freshly-minted token. Plain index for lookup performance.
CREATE INDEX IF NOT EXISTS "shop_orders_guestToken_idx" ON "shop_orders"("guestToken");
CREATE INDEX IF NOT EXISTS "shop_orders_userId_idx" ON "shop_orders"("userId");
CREATE INDEX IF NOT EXISTS "shop_orders_status_idx" ON "shop_orders"("status");
CREATE INDEX IF NOT EXISTS "shop_orders_createdAt_idx" ON "shop_orders"("createdAt");

ALTER TABLE "shop_orders"
    ADD CONSTRAINT "shop_orders_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Shop Order Items
CREATE TABLE IF NOT EXISTS "shop_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "name" TEXT NOT NULL,
    "variantLabel" TEXT,
    "sku" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_order_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "shop_order_items_orderId_idx" ON "shop_order_items"("orderId");
CREATE INDEX IF NOT EXISTS "shop_order_items_productId_idx" ON "shop_order_items"("productId");
CREATE INDEX IF NOT EXISTS "shop_order_items_variantId_idx" ON "shop_order_items"("variantId");

ALTER TABLE "shop_order_items"
    ADD CONSTRAINT "shop_order_items_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "shop_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shop_order_items"
    ADD CONSTRAINT "shop_order_items_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "shop_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "shop_order_items"
    ADD CONSTRAINT "shop_order_items_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES "shop_product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Shop Order Status History
CREATE TABLE IF NOT EXISTS "shop_order_status_history" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_order_status_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "shop_order_status_history_orderId_idx" ON "shop_order_status_history"("orderId");

ALTER TABLE "shop_order_status_history"
    ADD CONSTRAINT "shop_order_status_history_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "shop_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Wishlist
CREATE TABLE IF NOT EXISTS "shop_wishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_wishlist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "shop_wishlist_userId_productId_key" ON "shop_wishlist"("userId", "productId");
CREATE INDEX IF NOT EXISTS "shop_wishlist_userId_idx" ON "shop_wishlist"("userId");
CREATE INDEX IF NOT EXISTS "shop_wishlist_productId_idx" ON "shop_wishlist"("productId");

ALTER TABLE "shop_wishlist"
    ADD CONSTRAINT "shop_wishlist_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shop_wishlist"
    ADD CONSTRAINT "shop_wishlist_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "shop_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
