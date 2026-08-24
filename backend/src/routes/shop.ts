import express, { Request, Response } from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { uploadToSupabase } from '../lib/upload';
import crypto from 'crypto';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
  file?: Express.Multer.File;
}

const router = express.Router();

// Multer for receipt uploads (memory storage → Supabase)
const receiptUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop() || '');
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only JPEG, JPG, PNG, GIF, and PDF files are allowed'));
  },
});

// Helper: generate sequential order number
async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.shopOrder.count();
  const num = (count + 1).toString().padStart(5, '0');
  return `AURA-${year}-${num}`;
}

// Helper: slugify
function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// ============================================================
// PUBLIC CATALOG — no auth required
// ============================================================

// Get all active categories
router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.productCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: { where: { status: 'ACTIVE' } } } },
      },
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching shop categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get products with filtering, search, sorting, pagination
router.get('/products', async (req: Request, res: Response) => {
  try {
    const {
      category,
      search,
      size,
      color,
      minPrice,
      maxPrice,
      sort = 'newest',
      page = 1,
      limit = 24,
      featured,
    } = req.query;

    const where: any = { status: 'ACTIVE' };

    if (category) {
      where.category = { slug: category as string, isActive: true };
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (minPrice || maxPrice) {
      where.OR = [
        {
          salePrice: { gte: minPrice ? Number(minPrice) : undefined, lte: maxPrice ? Number(maxPrice) : undefined },
        },
        {
          salePrice: null,
          basePrice: { gte: minPrice ? Number(minPrice) : undefined, lte: maxPrice ? Number(maxPrice) : undefined },
        },
      ];
    }

    // Variant filters
    if (size || color) {
      where.variants = { some: {} };
      if (size) where.variants.some.size = size as string;
      if (color) where.variants.some.color = { contains: color as string, mode: 'insensitive' };
    }

    const orderBy: any = { createdAt: 'desc' };
    if (sort === 'price-low') orderBy.basePrice = 'asc';
    if (sort === 'price-high') orderBy.basePrice = 'desc';
    if (sort === 'name') orderBy.name = 'asc';

    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip: (Number(page) - 1) * Number(limit),
      take: Math.min(Math.max(Number(limit) || 24, 1), 100),
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true } },
      },
    });

    const total = await prisma.product.count({ where });

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching shop products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product by slug
router.get('/products/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { isActive: true } },
      },
    });

    if (!product || product.status === 'ARCHIVED' || product.status === 'DRAFT') {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Related products in same category
    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: 'ACTIVE',
      },
      take: 4,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });

    res.json({ product, related });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// ORDERS
// ============================================================

// Create order (auth or guest)
router.post('/orders', optionalAuth, receiptUpload.single('receipt'), [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('paymentMethod').isIn(['BANK_TRANSFER', 'MOBILE_MONEY', 'CASH_ON_DELIVERY']).withMessage('Invalid payment method'),
  body('shippingFullName').notEmpty().withMessage('Full name is required'),
  body('shippingPhone').notEmpty().withMessage('Phone is required'),
  body('shippingRegion').notEmpty().withMessage('Region is required'),
  body('shippingCity').notEmpty().withMessage('City is required'),
  body('shippingAddress').notEmpty().withMessage('Address is required'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Enforce receipt upload for non-COD payment methods.
    // Cash on delivery does not require a receipt; bank transfer and mobile
    // money must include proof of payment at submission time.
    const paymentMethod = req.body.paymentMethod as string;
    if (paymentMethod !== 'CASH_ON_DELIVERY' && !req.file) {
      return res.status(400).json({
        error: 'A payment receipt is required for bank transfer and mobile money orders. Please upload your receipt and try again.',
      });
    }

    const {
      items,
      paymentMethod: _pm,
      shippingFullName,
      shippingPhone,
      shippingRegion,
      shippingCity,
      shippingAddress,
      shippingPostalCode,
      shippingNotes,
      notes,
    } = req.body;

    // Parse items if sent as string (multipart form)
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

    const userId = req.user?.id || null;
    // Always mint a fresh per-order guest token for unauthenticated orders.
    // A single browser/device may place multiple orders, and guestToken is no
    // longer unique-constrained, so reusing a client-supplied token would let
    // one order's link leak access to another. We ignore any client value.
    const guestToken = userId ? null : crypto.randomUUID();

    // Validate stock and compute totals server-side (never trust client prices)
    const orderItemsData: any[] = [];
    let subtotal = 0;

    for (const item of parsedItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product || product.status !== 'ACTIVE') {
        return res.status(400).json({ error: `Product not available: ${item.productId}` });
      }

      let variant = null;
      let unitPrice = product.salePrice ?? product.basePrice;

      if (item.variantId) {
        variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant || !variant.isActive) {
          return res.status(400).json({ error: `Variant not available: ${item.variantId}` });
        }
        unitPrice += variant.priceDelta;
      }

      const qty = Number(item.quantity);
      if (qty < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1' });
      }

      // Stock check
      // - Variant items: check variant.stock
      // - Simple products (no variant): check product.stock when it is tracked (non-null)
      // - product.stock === null means unlimited / not tracked
      if (variant) {
        if (variant.stock < qty) {
          return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
        }
      } else if (product.stock !== null) {
        if (product.stock < qty) {
          return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
        }
      }

      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;

      const variantLabel = variant
        ? [variant.size, variant.color, variant.style].filter(Boolean).join(' / ')
        : null;

      orderItemsData.push({
        productId: product.id,
        variantId: variant?.id || null,
        name: product.name,
        variantLabel,
        unitPrice,
        quantity: qty,
        lineTotal,
      });
    }

    const shippingCost = 0; // flat — admin can adjust later
    const total = subtotal + shippingCost;

    // Handle receipt upload
    let receiptUrl: string | null = null;
    if (req.file && paymentMethod !== 'CASH_ON_DELIVERY') {
      receiptUrl = await uploadToSupabase(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'shop-receipts'
      );
    }

    // Create order in transaction (decrement stock for non-COD, or for COD too to reserve)
    const orderNumber = await generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.shopOrder.create({
        data: {
          orderNumber,
          userId,
          guestToken,
          status: 'PENDING',
          subtotal,
          shippingCost,
          total,
          paymentMethod,
          paymentReceiptUrl: receiptUrl,
          paymentStatus: paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PENDING',
          notes: notes || null,
          items: {
            create: orderItemsData,
          },
          shippingAddress: {
            create: {
              fullName: shippingFullName,
              phone: shippingPhone,
              region: shippingRegion,
              city: shippingCity,
              address: shippingAddress,
              postalCode: shippingPostalCode || null,
              notes: shippingNotes || null,
            },
          },
        },
        include: {
          items: true,
          shippingAddress: true,
        },
      });

      // Decrement stock atomically inside the transaction.
      // Uses updateMany with a `stock >= qty` guard so concurrent orders
      // cannot drive stock negative. If zero rows are updated, another
      // concurrent order won the stock — abort the whole transaction.
      for (const item of orderItemsData) {
        if (item.variantId) {
          const result = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (result.count === 0) {
            throw new Error(`Insufficient stock for ${item.name}`);
          }
        } else {
          // Only decrement product-level stock when it is tracked (non-null).
          // null stock means unlimited / not tracked.
          const fresh = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true, name: true },
          });
          if (fresh && fresh.stock !== null) {
            const result = await tx.product.updateMany({
              where: { id: item.productId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (result.count === 0) {
              throw new Error(`Insufficient stock for ${fresh.name}`);
            }
          }
        }
      }

      return newOrder;
    });

    res.status(201).json({
      message: 'Order placed successfully',
      order,
      guestToken,
    });
  } catch (error: any) {
    // Surface stock-exhaustion errors (thrown inside the transaction) as 400
    if (error?.message?.startsWith('Insufficient stock for ')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error creating shop order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload receipt for an existing order (e.g., if not uploaded at creation)
router.post('/orders/:id/receipt', authenticateToken, receiptUpload.single('receipt'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.shopOrder.findUnique({ where: { id } });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (!req.file) return res.status(400).json({ error: 'Receipt file is required' });

    const receiptUrl = await uploadToSupabase(req.file.buffer, req.file.originalname, req.file.mimetype, 'shop-receipts');

    const updated = await prisma.shopOrder.update({
      where: { id },
      data: { paymentReceiptUrl: receiptUrl },
    });

    res.json({ message: 'Receipt uploaded', order: updated });
  } catch (error) {
    console.error('Error uploading receipt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my orders (authenticated user)
router.get('/orders/mine', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orders = await prisma.shopOrder.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } } } } },
        shippingAddress: true,
      },
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching my orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single order (owner or admin or guest with token)
router.get('/orders/:id', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { guestToken } = req.query;

    const order = await prisma.shopOrder.findUnique({
      where: { id },
      include: {
        items: { include: { product: { include: { images: { orderBy: { sortOrder: 'asc' } } } } } },
        shippingAddress: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Authorization: owner, admin, or guest with matching token
    const isOwner = req.user && order.userId === req.user.id;
    const isAdmin = req.user?.role === 'ADMIN';
    const isGuest = order.guestToken && guestToken === order.guestToken;

    if (!isOwner && !isAdmin && !isGuest) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
