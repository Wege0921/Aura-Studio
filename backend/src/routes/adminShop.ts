import express, { Request, Response } from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { uploadToSupabase, deleteFromSupabase, detectMimetype } from '../lib/upload';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  files?: Express.Multer.File[];
}

const router = express.Router();

// Multer for product image uploads (memory → Supabase 'products' bucket)
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop() || '');
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only JPEG, JPG, PNG, WebP, and GIF files are allowed'));
  },
});

function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }
}

// ============================================================
// CATEGORIES
// ============================================================

router.get('/categories', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const categories = await prisma.productCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/categories', authenticateToken, requireAdmin, [
  body('name').notEmpty().withMessage('Name is required'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description, imageUrl, sortOrder, isActive } = req.body;
    const slug = slugify(req.body.slug || name);

    const category = await prisma.productCategory.create({
      data: {
        slug,
        name,
        description: description || null,
        imageUrl: imageUrl || null,
        sortOrder: sortOrder ? Number(sortOrder) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/categories/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, sortOrder, isActive, slug } = req.body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    // Slug is NOT auto-regenerated from name on update — that would break
    // existing /shop/:categorySlug URLs and inbound links. Slug is only
    // changed when explicitly provided by the admin.
    if (slug !== undefined && slug) {
      updateData.slug = slugify(slug);
    }
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (sortOrder !== undefined) updateData.sortOrder = Number(sortOrder);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.productCategory.update({ where: { id }, data: updateData });
    res.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/categories/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return res.status(400).json({ error: 'Cannot delete category with products. Move or archive products first.' });
    }
    // Clean up category image from storage if present
    const category = await prisma.productCategory.findUnique({ where: { id } });
    if (category?.imageUrl) {
      try { await deleteFromSupabase(category.imageUrl); } catch { /* ignore storage errors */ }
    }
    await prisma.productCategory.delete({ where: { id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload category image (single file via field 'image')
router.post('/categories/:id/image', authenticateToken, requireAdmin, imageUpload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const category = await prisma.productCategory.findUnique({ where: { id } });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Validate the file is an image (detectMimetype is sync, returns string | null)
    const detected = detectMimetype(file.buffer);
    if (!detected) {
      return res.status(400).json({ error: 'File does not appear to be a valid image' });
    }

    // Delete old image from storage if present
    if (category.imageUrl) {
      try { await deleteFromSupabase(category.imageUrl); } catch { /* ignore */ }
    }

    const url = await uploadToSupabase(file.buffer, file.originalname, detected, 'products', 'categories');
    const updated = await prisma.productCategory.update({
      where: { id },
      data: { imageUrl: url },
    });

    res.json({ message: 'Category image uploaded', imageUrl: url, category: updated });
  } catch (error) {
    console.error('Error uploading category image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// PRODUCTS
// ============================================================

router.get('/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 20 } = req.query;
    const where: any = {};
    if (category) where.category = { slug: category as string };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Math.min(Math.max(Number(limit) || 20, 1), 100),
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: true,
      },
    });

    const total = await prisma.product.count({ where });

    res.json({
      products,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/products', authenticateToken, requireAdmin, [
  body('name').notEmpty().withMessage('Name is required'),
  body('categoryId').notEmpty().withMessage('Category is required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Price must be positive'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, description, categoryId, basePrice, salePrice, sku, status, isFeatured, weightGrams, stock } = req.body;
    const slug = await ensureUniqueSlug(slugify(name));

    const product = await prisma.product.create({
      data: {
        slug,
        name,
        description: description || null,
        categoryId,
        basePrice: Number(basePrice),
        salePrice: salePrice ? Number(salePrice) : null,
        sku: sku || null,
        status: status || 'ACTIVE',
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : false,
        weightGrams: weightGrams ? Number(weightGrams) : null,
        // stock: null = unlimited/untracked; otherwise a non-negative integer.
        // Accept empty string / undefined as null.
        stock: stock === undefined || stock === '' || stock === null ? null : Math.max(0, Number(stock)),
      },
      include: { category: true, images: true, variants: true },
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/products/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId, basePrice, salePrice, sku, status, isFeatured, weightGrams, stock } = req.body;
    const updateData: any = {};
    if (name !== undefined) { updateData.name = name; updateData.slug = await ensureUniqueSlug(slugify(name), id); }
    if (description !== undefined) updateData.description = description;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (basePrice !== undefined) updateData.basePrice = Number(basePrice);
    if (salePrice !== undefined) updateData.salePrice = salePrice ? Number(salePrice) : null;
    if (sku !== undefined) updateData.sku = sku || null;
    if (status !== undefined) updateData.status = status;
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (weightGrams !== undefined) updateData.weightGrams = weightGrams ? Number(weightGrams) : null;
    if (stock !== undefined) {
      const newStock = stock === '' || stock === null ? null : Math.max(0, Number(stock));
      updateData.stock = newStock;
      // Auto-reactivate OUT_OF_STOCK products when stock is replenished
      if (newStock !== null && newStock > 0 && status === undefined) {
        // Only auto-set to ACTIVE if the admin didn't explicitly set a status
        const current = await prisma.product.findUnique({ where: { id }, select: { status: true } });
        if (current?.status === 'OUT_OF_STOCK') {
          updateData.status = 'ACTIVE';
        }
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true, images: true, variants: true },
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/products/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    // Check for active orders
    const activeOrders = await prisma.shopOrderItem.count({
      where: {
        productId: id,
        order: { status: { notIn: ['CANCELLED', 'REFUNDED', 'DELIVERED'] } },
      },
    });
    if (activeOrders > 0) {
      return res.status(400).json({ error: 'Cannot delete product with active orders. Archive it instead.' });
    }
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload product images (multiple files via field 'images')
router.post('/products/:id/images', authenticateToken, requireAdmin, imageUpload.array('images', 10), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }

    const product = await prisma.product.findUnique({ where: { id }, include: { images: true } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Validate file contents via magic bytes (don't trust client mimetype)
    for (const file of files) {
      const detected = detectMimetype(file.buffer);
      if (!detected) {
        return res.status(400).json({ error: `File "${file.originalname}" does not appear to be a valid image` });
      }
    }

    const uploadedImages: any[] = [];
    let sortOrder = product.images.length;

    for (const file of files) {
      const detected = detectMimetype(file.buffer) || file.mimetype;
      const url = await uploadToSupabase(file.buffer, file.originalname, detected, 'products', 'products');
      const img = await prisma.productImage.create({
        data: {
          productId: id,
          url,
          sortOrder,
        },
      });
      uploadedImages.push(img);
      sortOrder++;
    }

    res.status(201).json({ message: 'Images uploaded', images: uploadedImages });
  } catch (error) {
    console.error('Error uploading product images:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a product image
router.delete('/products/:id/images/:imageId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { imageId } = req.params;
    // Fetch the image URL before deleting so we can clean up Supabase storage
    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image) return res.status(404).json({ error: 'Image not found' });

    await prisma.productImage.delete({ where: { id: imageId } });
    // Best-effort cleanup of the Supabase storage object (don't block on failure)
    await deleteFromSupabase(image.url);

    res.json({ message: 'Image deleted' });
  } catch (error) {
    console.error('Error deleting product image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// VARIANTS
// ============================================================

router.post('/products/:id/variants', authenticateToken, requireAdmin, [
  body('stock').isInt({ min: 0 }).withMessage('Stock must be 0 or positive'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { size, color, style, sku, priceDelta, stock, isActive } = req.body;

    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        size: size || null,
        color: color || null,
        style: style || null,
        sku: sku || null,
        priceDelta: priceDelta ? Number(priceDelta) : 0,
        stock: Number(stock) || 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });
    res.status(201).json(variant);
  } catch (error) {
    console.error('Error creating variant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/variants/:variantId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { variantId } = req.params;
    const { size, color, style, sku, priceDelta, stock, isActive } = req.body;
    const updateData: any = {};
    if (size !== undefined) updateData.size = size || null;
    if (color !== undefined) updateData.color = color || null;
    if (style !== undefined) updateData.style = style || null;
    if (sku !== undefined) updateData.sku = sku || null;
    if (priceDelta !== undefined) updateData.priceDelta = Number(priceDelta);
    if (stock !== undefined) updateData.stock = Number(stock);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.productVariant.update({ where: { id: variantId }, data: updateData });
    res.json(updated);
  } catch (error) {
    console.error('Error updating variant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/variants/:variantId', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { variantId } = req.params;
    const inOrders = await prisma.shopOrderItem.count({ where: { variantId } });
    if (inOrders > 0) {
      // Don't delete — just deactivate
      await prisma.productVariant.update({ where: { id: variantId }, data: { isActive: false } });
      return res.json({ message: 'Variant deactivated (has order history)' });
    }
    await prisma.productVariant.delete({ where: { id: variantId } });
    res.json({ message: 'Variant deleted' });
  } catch (error) {
    console.error('Error deleting variant:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Quick stock update
router.patch('/variants/:variantId/stock', authenticateToken, requireAdmin, [
  body('stock').isInt({ min: 0 }).withMessage('Stock must be 0 or positive'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { variantId } = req.params;
    const { stock } = req.body;
    const updated = await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: Number(stock) },
    });
    res.json({ message: 'Stock updated', variant: updated });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// ORDERS
// ============================================================

router.get('/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, paymentStatus, search, page = 1, limit = 20 } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { user: { name: { contains: search as string, mode: 'insensitive' } } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const orders = await prisma.shopOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Math.min(Math.max(Number(limit) || 20, 1), 100),
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: { select: { name: true, slug: true } } } },
        shippingAddress: true,
      },
    });

    const total = await prisma.shopOrder.count({ where });

    res.json({
      orders,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.shopOrder.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: { include: { product: { include: { images: { take: 1 } } } } },
        shippingAddress: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    console.error('Error fetching admin order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order details (shipping cost, tracking, carrier, notes)
router.patch('/orders/:id/details', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { shippingCost, trackingNumber, carrier, notes } = req.body;
    const updateData: any = {};

    if (shippingCost !== undefined) updateData.shippingCost = Number(shippingCost);
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber || null;
    if (carrier !== undefined) updateData.carrier = carrier || null;
    if (notes !== undefined) updateData.notes = notes || null;

    // Recalculate total if shippingCost changed
    if (shippingCost !== undefined) {
      const order = await prisma.shopOrder.findUnique({ where: { id }, select: { subtotal: true, discount: true } });
      if (!order) return res.status(404).json({ error: 'Order not found' });
      updateData.total = Number(order.subtotal) + Number(shippingCost) - Number(order.discount);
    }

    const updated = await prisma.shopOrder.update({ where: { id }, data: updateData });
    res.json({ message: 'Order details updated', order: updated });
  } catch (error) {
    console.error('Error updating order details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status
router.patch('/orders/:id/status', authenticateToken, requireAdmin, [
  body('status').isIn(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).withMessage('Invalid status'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { status, note } = req.body;
    const adminId = req.user!.id;

    const order = await prisma.shopOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const result = await prisma.$transaction(async (tx) => {
      // Restock on cancellation/refund. Stock is decremented at order
      // creation (even while PENDING), so we restock from any non-terminal
      // status. Guard against double-restock by only restocking when the
      // order is leaving an active state for a terminal one, and only if
      // we haven't already restocked (tracked via the previous status).
      const activeStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'];
      const isLeavingActive = activeStatuses.includes(order.status);
      const isTerminalRestock = status === 'CANCELLED' || status === 'REFUNDED';

      if (isTerminalRestock && isLeavingActive) {
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          } else {
            // Only restock product-level stock when it is tracked (non-null)
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stock: true },
            });
            if (product && product.stock !== null) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              });
            }
          }
        }
      }

      const updated = await tx.shopOrder.update({
        where: { id },
        data: { status },
      });

      await tx.shopOrderStatusHistory.create({
        data: {
          orderId: id,
          status,
          note: note || null,
          changedBy: adminId,
        },
      });

      return updated;
    });

    res.json({ message: `Order status updated to ${status}`, order: result });

    // Send status-update emails (fire-and-forget)
    if (status === 'SHIPPED' || status === 'DELIVERED') {
      setImmediate(async () => {
        try {
          const fullOrder = await prisma.shopOrder.findUnique({
            where: { id },
            include: { user: { select: { email: true, name: true } }, shippingAddress: true },
          });
          if (!fullOrder || !fullOrder.user?.email) return;

          const frontendUrl = (process.env.FRONTEND_URL || 'https://aurastudio.et').split(',')[0].trim().replace(/\/$/, '');
          const orderUrl = `${frontendUrl}/shop/orders/${fullOrder.id}`;
          const { sendShopOrderShipped, sendShopOrderDelivered } = await import('../services/emailService');

          if (status === 'SHIPPED') {
            await sendShopOrderShipped({
              to: fullOrder.user.email,
              customerName: fullOrder.user.name || fullOrder.shippingAddress?.fullName || 'Customer',
              orderNumber: fullOrder.orderNumber,
              orderUrl,
              carrier: (fullOrder as any).carrier || null,
              trackingNumber: (fullOrder as any).trackingNumber || null,
            });
          } else if (status === 'DELIVERED') {
            await sendShopOrderDelivered({
              to: fullOrder.user.email,
              customerName: fullOrder.user.name || fullOrder.shippingAddress?.fullName || 'Customer',
              orderNumber: fullOrder.orderNumber,
              orderUrl,
            });
          }
        } catch (emailErr) {
          console.error('Failed to send order status email:', emailErr);
        }
      });
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify/reject payment
router.patch('/orders/:id/payment', authenticateToken, requireAdmin, [
  body('paymentStatus').isIn(['VERIFIED', 'REJECTED']).withMessage('Invalid payment status'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const { paymentStatus } = req.body;

    const order = await prisma.shopOrder.findUnique({ where: { id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.paymentStatus !== 'PENDING') {
      return res.status(400).json({ error: 'Payment has already been processed' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.shopOrder.update({
        where: { id },
        data: {
          paymentStatus,
          paidAt: paymentStatus === 'VERIFIED' ? new Date() : null,
          status: paymentStatus === 'VERIFIED' ? 'CONFIRMED' : order.status,
        },
      });

      await tx.shopOrderStatusHistory.create({
        data: {
          orderId: id,
          status: paymentStatus === 'VERIFIED' ? 'CONFIRMED' : order.status,
          note: `Payment ${paymentStatus.toLowerCase()}`,
          changedBy: req.user!.id,
        },
      });

      return updated;
    });

    res.json({ message: `Payment ${paymentStatus.toLowerCase()} successfully`, order: result });

    // Send payment-verified email (fire-and-forget)
    if (paymentStatus === 'VERIFIED') {
      setImmediate(async () => {
        try {
          const fullOrder = await prisma.shopOrder.findUnique({
            where: { id },
            include: { user: { select: { email: true, name: true } }, shippingAddress: true },
          });
          if (!fullOrder || !fullOrder.user?.email) return;

          const frontendUrl = (process.env.FRONTEND_URL || 'https://aurastudio.et').split(',')[0].trim().replace(/\/$/, '');
          const orderUrl = `${frontendUrl}/shop/orders/${fullOrder.id}`;

          const { sendShopPaymentVerified } = await import('../services/emailService');
          await sendShopPaymentVerified({
            to: fullOrder.user.email,
            customerName: fullOrder.user.name || fullOrder.shippingAddress?.fullName || 'Customer',
            orderNumber: fullOrder.orderNumber,
            orderUrl,
            total: Number(fullOrder.total),
          });
        } catch (emailErr) {
          console.error('Failed to send payment-verified email:', emailErr);
        }
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// SHIPPING RATES
// ============================================================

router.get('/shipping-rates', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const rates = await prisma.shippingRate.findMany({ orderBy: { region: 'asc' } });
    res.json(rates);
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/shipping-rates', authenticateToken, requireAdmin, [
  body('rate').isFloat({ min: 0 }).withMessage('Rate must be positive'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { region, rate, freeShippingOver, isActive } = req.body;
    const created = await prisma.shippingRate.create({
      data: {
        region: region || null,
        rate: Number(rate),
        freeShippingOver: freeShippingOver ? Number(freeShippingOver) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating shipping rate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/shipping-rates/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { region, rate, freeShippingOver, isActive } = req.body;
    const updateData: any = {};
    if (region !== undefined) updateData.region = region || null;
    if (rate !== undefined) updateData.rate = Number(rate);
    if (freeShippingOver !== undefined) updateData.freeShippingOver = freeShippingOver ? Number(freeShippingOver) : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.shippingRate.update({ where: { id }, data: updateData });
    res.json(updated);
  } catch (error) {
    console.error('Error updating shipping rate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/shipping-rates/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.shippingRate.delete({ where: { id } });
    res.json({ message: 'Shipping rate deleted' });
  } catch (error) {
    console.error('Error deleting shipping rate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// COUPONS
// ============================================================

// Low-stock report: products and variants at or below the threshold
router.get('/inventory/low-stock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 5;

    // Low-stock simple products (stock tracked, <= threshold, not null)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { not: null, lte: threshold },
        status: { notIn: ['ARCHIVED'] },
      },
      select: {
        id: true, name: true, slug: true, sku: true, stock: true, status: true,
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
      },
      orderBy: { stock: 'asc' },
    });

    // Low-stock variants
    const lowStockVariants = await prisma.productVariant.findMany({
      where: {
        stock: { lte: threshold },
        product: { status: { notIn: ['ARCHIVED'] } },
      },
      include: {
        product: { select: { id: true, name: true, slug: true, status: true } },
      },
      orderBy: { stock: 'asc' },
    });

    res.json({
      threshold,
      products: lowStockProducts.map((p) => ({
        id: p.id, name: p.name, slug: p.slug, sku: p.sku,
        stock: p.stock, status: p.status,
        category: p.category?.name || null,
        image: p.images[0]?.url || null,
      })),
      variants: lowStockVariants.map((v) => ({
        id: v.id,
        productId: v.product.id,
        productName: v.product.name,
        productSlug: v.product.slug,
        size: v.size, color: v.color, style: v.style,
        sku: v.sku, stock: v.stock, isActive: v.isActive,
      })),
    });
  } catch (error) {
    console.error('Error fetching low-stock report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/coupons', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/coupons', authenticateToken, requireAdmin, [
  body('code').notEmpty().withMessage('Code is required'),
  body('type').isIn(['PERCENTAGE', 'FIXED']).withMessage('Invalid type'),
  body('value').isFloat({ min: 0 }).withMessage('Value must be positive'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { code, type, value, minSubtotal, maxDiscount, maxUses, startsAt, endsAt, isActive } = req.body;
    const created = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        type,
        value: Number(value),
        minSubtotal: minSubtotal ? Number(minSubtotal) : null,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        maxUses: maxUses ? Number(maxUses) : null,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });
    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/coupons/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { code, type, value, minSubtotal, maxDiscount, maxUses, startsAt, endsAt, isActive } = req.body;
    const updateData: any = {};
    if (code !== undefined) updateData.code = code.toUpperCase().trim();
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = Number(value);
    if (minSubtotal !== undefined) updateData.minSubtotal = minSubtotal ? Number(minSubtotal) : null;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? Number(maxDiscount) : null;
    if (maxUses !== undefined) updateData.maxUses = maxUses ? Number(maxUses) : null;
    if (startsAt !== undefined) updateData.startsAt = startsAt ? new Date(startsAt) : null;
    if (endsAt !== undefined) updateData.endsAt = endsAt ? new Date(endsAt) : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.coupon.update({ where: { id }, data: updateData });
    res.json(updated);
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/coupons/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.coupon.delete({ where: { id } });
    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// ANALYTICS
// ============================================================

router.get('/analytics/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const where: any = {};
    if (Object.keys(dateFilter).length > 0) where.createdAt = dateFilter;

    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      pendingPayments,
    ] = await Promise.all([
      prisma.shopOrder.count({ where }),
      prisma.shopOrder.count({ where: { ...where, status: 'PENDING' } }),
      prisma.shopOrder.count({ where: { ...where, status: 'CONFIRMED' } }),
      prisma.shopOrder.count({ where: { ...where, status: 'SHIPPED' } }),
      prisma.shopOrder.count({ where: { ...where, status: 'DELIVERED' } }),
      prisma.shopOrder.count({ where: { ...where, status: 'CANCELLED' } }),
      prisma.shopOrder.aggregate({ where: { ...where, paymentStatus: 'VERIFIED' }, _sum: { total: true } }),
      prisma.shopOrder.count({ where: { ...where, paymentStatus: 'PENDING' } }),
    ]);

    // Top products
    const topProducts = await prisma.shopOrderItem.groupBy({
      by: ['productId'],
      where: { order: { paymentStatus: 'VERIFIED' } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: 'desc' } },
      take: 5,
    });

    const topProductIds = topProducts.map((t) => t.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, slug: true },
    });

    const topProductsWithDetails = topProducts.map((t) => {
      const detail = topProductDetails.find((p) => p.id === t.productId);
      return {
        productId: t.productId,
        name: detail?.name || 'Unknown',
        slug: detail?.slug || '',
        _sum: {
          quantity: t._sum.quantity,
          lineTotal: t._sum.lineTotal ? Number(t._sum.lineTotal) : 0,
        },
      };
    });

    // Revenue over time (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = await prisma.shopOrder.findMany({
      where: {
        ...where,
        paymentStatus: 'VERIFIED',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const revenueByDay: { date: string; revenue: number; orders: number }[] = [];
    const dayMap = new Map<string, { revenue: number; orders: number }>();
    for (const o of recentOrders) {
      const dayKey = o.createdAt.toISOString().slice(0, 10);
      const existing = dayMap.get(dayKey) || { revenue: 0, orders: 0 };
      existing.revenue += Number(o.total);
      existing.orders += 1;
      dayMap.set(dayKey, existing);
    }
    for (const [date, val] of dayMap) {
      revenueByDay.push({ date, revenue: val.revenue, orders: val.orders });
    }
    revenueByDay.sort((a, b) => a.date.localeCompare(b.date));

    // Average order value
    const verifiedOrders = totalOrders > 0
      ? await prisma.shopOrder.count({ where: { ...where, paymentStatus: 'VERIFIED' } })
      : 0;
    const totalRevenueNum = totalRevenue._sum.total ? Number(totalRevenue._sum.total) : 0;
    const aov = verifiedOrders > 0 ? totalRevenueNum / verifiedOrders : 0;

    res.json({
      summary: {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: totalRevenueNum,
        pendingPayments,
        aov: Math.round(aov * 100) / 100,
        verifiedOrders,
      },
      topProducts: topProductsWithDetails,
      revenueOverTime: revenueByDay,
    });
  } catch (error) {
    console.error('Error fetching shop analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
