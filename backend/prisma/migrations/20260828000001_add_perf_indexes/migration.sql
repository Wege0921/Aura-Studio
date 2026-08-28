-- CreateIndex
CREATE INDEX "shop_categories_isActive_sortOrder_idx" ON "shop_categories"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "shop_order_items_productId_idx" ON "shop_order_items"("productId");

-- CreateIndex
CREATE INDEX "shop_order_items_variantId_idx" ON "shop_order_items"("variantId");

-- CreateIndex
CREATE INDEX "shop_orders_paymentStatus_idx" ON "shop_orders"("paymentStatus");

-- CreateIndex
CREATE INDEX "shop_orders_status_paymentStatus_createdAt_idx" ON "shop_orders"("status", "paymentStatus", "createdAt");

-- CreateIndex
CREATE INDEX "shop_product_variants_stock_idx" ON "shop_product_variants"("stock");

-- CreateIndex
CREATE INDEX "shop_product_variants_productId_isActive_idx" ON "shop_product_variants"("productId", "isActive");

-- CreateIndex
CREATE INDEX "shop_products_status_stock_idx" ON "shop_products"("status", "stock");

-- CreateIndex
CREATE INDEX "shop_products_status_isFeatured_createdAt_idx" ON "shop_products"("status", "isFeatured", "createdAt");

-- CreateIndex
CREATE INDEX "shop_products_categoryId_status_createdAt_idx" ON "shop_products"("categoryId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "shop_products_status_salePrice_basePrice_idx" ON "shop_products"("status", "salePrice", "basePrice");
