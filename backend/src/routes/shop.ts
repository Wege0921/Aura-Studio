import express, { Request, Response } from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { uploadToSupabase, detectMimetype } from '../lib/upload';
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

// Rate limiters
// Order creation is strict: anonymous scripts could otherwise zero out
// inventory by spamming checkout. 5 orders / 15 min per IP is generous
// for real users but blocks abuse.
const orderCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many orders from this address, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Receipt uploads: moderate limit to prevent storage abuse.
const receiptUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many receipt uploads, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Catalog reads: generous, but bounded to prevent scraping / DoS.
const catalogLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { error: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

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

// Helper: calculate shipping cost for a given region and subtotal.
// Looks up a region-specific rate (case-insensitive); falls back to the
// default rate (region = null). Returns 0 if no rates are configured.
async function calculateShippingCost(region: string, subtotal: number): Promise<number> {
  // Try region-specific rate (case-insensitive)
  const regionRate = await prisma.shippingRate.findFirst({
    where: {
      region: { equals: region, mode: 'insensitive' },
      isActive: true,
    },
  });

  if (regionRate) {
    if (regionRate.freeShippingOver && subtotal >= Number(regionRate.freeShippingOver)) {
      return 0;
    }
    return Number(regionRate.rate);
  }

  // Fall back to default rate (region = null)
  const defaultRate = await prisma.shippingRate.findFirst({
    where: { region: null, isActive: true },
  });

  if (defaultRate) {
    if (defaultRate.freeShippingOver && subtotal >= Number(defaultRate.freeShippingOver)) {
      return 0;
    }
    return Number(defaultRate.rate);
  }

  // No rates configured → free shipping
  return 0;
}

// Idempotency cache for order creation.
// Keyed by Idempotency-Key header (per IP) → cached response.
// Prevents duplicate orders from double-clicks or network retries.
// In-memory with TTL; for multi-instance deployments, use Redis.
const IDEMPOTENCY_TTL_MS = 10 * 60 * 1000; // 10 minutes
const idempotencyCache = new Map<string, { response: any; expiresAt: number }>();

// Helper: generate a unique order number.
// Uses count+1 as a base for human-readability, then verifies uniqueness
// with a retry loop that appends an incrementing suffix on collision.
// Safe under concurrency: the unique constraint on orderNumber is the source
// of truth, and we retry until we find a free slot. Accepts an optional
// transaction client so the check+insert can be atomic.
type OrderNumberClient = Pick<typeof prisma, 'shopOrder'>;
async function generateOrderNumber(tx?: OrderNumberClient): Promise<string> {
  const client = tx || prisma;
  const year = new Date().getFullYear();
  // Start from the current count (approximate — fine since we retry on collision)
  const count = await client.shopOrder.count();
  let seq = count + 1;
  for (let attempt = 0; attempt < 10; attempt++) {
    const num = seq.toString().padStart(5, '0');
    const candidate = `AURA-${year}-${num}`;
    const exists = await client.shopOrder.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });
    if (!exists) return candidate;
    seq++;
  }
  // Fallback: append a random suffix to guarantee uniqueness
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `AURA-${year}-${suffix}`;
}

// Transaction-scoped variant (the tx client has the same shopOrder shape)
async function generateOrderNumberWithTx(tx: any): Promise<string> {
  return generateOrderNumber(tx as OrderNumberClient);
}

// Helper: slugify
function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Cache-Control middleware for public catalog endpoints.
// Allows CDN/browser caching for 60 seconds, with a short stale-while-
// revalidate window. Private endpoints (orders, wishlist) are never cached.
function cachePublicRead(seconds: number = 60) {
  return (_req: Request, res: Response, next: () => void) => {
    res.setHeader('Cache-Control', `public, max-age=${seconds}, stale-while-revalidate=30`);
    next();
  };
}

// ============================================================
// PUBLIC CATALOG — no auth required
// ============================================================

// Get all active categories
router.get('/categories', catalogLimiter, cachePublicRead(300), async (_req: Request, res: Response) => {
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
router.get('/products', catalogLimiter, cachePublicRead(60), async (req: Request, res: Response) => {
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

    // Build AND conditions so search and price filters combine correctly
    // (the old code overwrote where.OR, breaking search+price together).
    const andConditions: any[] = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ],
      });
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (minPrice || maxPrice) {
      const min = minPrice ? Number(minPrice) : undefined;
      const max = maxPrice ? Number(maxPrice) : undefined;
      andConditions.push({
        OR: [
          // Products on sale: filter by salePrice
          {
            salePrice: { not: null, gte: min, lte: max },
          },
          // Products not on sale: filter by basePrice
          {
            salePrice: null,
            basePrice: { gte: min, lte: max },
          },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Variant filters
    if (size || color) {
      where.variants = { some: {} };
      if (size) where.variants.some.size = size as string;
      if (color) where.variants.some.color = { contains: color as string, mode: 'insensitive' };
    }

    // Sorting: "newest", "name", and price sorts all use DB orderBy.
    // Price sorting orders by salePrice first then basePrice as a tiebreaker.
    // This is an approximation of "effective price" (salePrice ?? basePrice)
    // that Prisma can express in orderBy without fetching all rows into memory.
    const sortStr = (sort as string) || 'newest';
    let dbOrderBy: any = { createdAt: 'desc' };

    if (sortStr === 'name') {
      dbOrderBy = { name: 'asc' };
    } else if (sortStr === 'price-low') {
      dbOrderBy = [{ salePrice: 'asc' }, { basePrice: 'asc' }];
    } else if (sortStr === 'price-high') {
      dbOrderBy = [{ salePrice: 'desc' }, { basePrice: 'desc' }];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: dbOrderBy,
      skip: (Number(page) - 1) * Number(limit),
      take: Math.min(Math.max(Number(limit) || 24, 1), 100),
      select: {
        id: true, slug: true, name: true, basePrice: true, salePrice: true,
        status: true, stock: true, isFeatured: true, createdAt: true,
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: { where: { isActive: true }, select: { id: true, size: true, color: true, style: true, priceDelta: true, stock: true } },
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

// Get distinct sizes and colors from active variants (for filter UI)
router.get('/filters', catalogLimiter, cachePublicRead(300), async (req: Request, res: Response) => {
  try {
    const variants = await prisma.productVariant.findMany({
      where: {
        isActive: true,
        product: { status: 'ACTIVE' }
      },
      select: { size: true, color: true },
      distinct: ['size', 'color'],
    });
    const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
    const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
    res.json({ sizes, colors });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load filters' });
  }
});

// Get single product by slug
router.get('/products/:slug', catalogLimiter, cachePublicRead(120), async (req: Request, res: Response) => {
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

// Get shipping quote for a region and subtotal
router.get('/shipping/quote', catalogLimiter, async (req: Request, res: Response) => {
  try {
    const { region, subtotal } = req.query;
    if (!region) {
      return res.status(400).json({ error: 'Region is required' });
    }
    const subtotalNum = Number(subtotal) || 0;
    const shippingCost = await calculateShippingCost(region as string, subtotalNum);
    res.json({ shippingCost, subtotal: subtotalNum, total: subtotalNum + shippingCost });
  } catch (error) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate a coupon code and return the discount amount for a given subtotal
router.post('/coupons/validate', orderCreationLimiter, [
  body('code').notEmpty().withMessage('Coupon code is required'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be positive'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { code, subtotal } = req.body;
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!coupon || !coupon.isActive) {
      return res.status(400).json({ error: 'Invalid or inactive coupon code' });
    }

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      return res.status(400).json({ error: 'This coupon is not yet active' });
    }
    if (coupon.endsAt && now > coupon.endsAt) {
      return res.status(400).json({ error: 'This coupon has expired' });
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: 'This coupon has reached its usage limit' });
    }
    if (coupon.minSubtotal && Number(subtotal) < Number(coupon.minSubtotal)) {
      return res.status(400).json({ error: `Minimum order of ETB ${Number(coupon.minSubtotal).toLocaleString()} required for this coupon` });
    }

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = (Number(subtotal) * Number(coupon.value)) / 100;
      if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
        discount = Number(coupon.maxDiscount);
      }
    } else {
      // FIXED
      discount = Number(coupon.value);
      if (discount > Number(subtotal)) discount = Number(subtotal);
    }

    res.json({
      code: coupon.code,
      type: coupon.type,
      value: Number(coupon.value),
      discount,
      subtotal: Number(subtotal),
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================
// ORDERS
// ============================================================

// Create order (auth or guest)
router.post('/orders', orderCreationLimiter, optionalAuth, receiptUpload.single('receipt'), [
  body('items').custom((value) => {
    // FormData sends items as a JSON string; JSON body sends an actual array.
    let parsed: any;
    try {
      parsed = typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      throw new Error('Items must be valid JSON');
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('At least one item is required');
    }
    for (const item of parsed) {
      if (typeof item.productId !== 'string' || item.productId.trim() === '') {
        throw new Error('Each item must have a non-empty productId');
      }
      if (item.variantId !== undefined && item.variantId !== null && typeof item.variantId !== 'string') {
        throw new Error('variantId must be a string when provided');
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1) {
        throw new Error('Each item must have an integer quantity >= 1');
      }
    }
    return true;
  }),
  body('paymentMethod').isIn(['BANK_TRANSFER', 'MOBILE_MONEY', 'CASH_ON_DELIVERY']).withMessage('Invalid payment method'),
  body('shippingFullName').notEmpty().withMessage('Full name is required'),
  body('shippingPhone').notEmpty().withMessage('Phone is required'),
  body('shippingAddress').notEmpty().withMessage('Address is required'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Idempotency: if the client sends an Idempotency-Key header and we've
    // already processed it, return the cached response instead of creating
    // a duplicate order. Keyed by IP + header to prevent cross-user leakage.
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    const cacheKey = idempotencyKey ? `${req.ip}:${idempotencyKey}` : null;

    if (cacheKey) {
      const cached = idempotencyCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return res.status(201).json(cached.response);
      }
    }

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

    // Validate receipt file contents via magic bytes (don't trust client mimetype)
    if (req.file) {
      const detected = detectMimetype(req.file.buffer);
      if (!detected) {
        return res.status(400).json({ error: 'The uploaded receipt does not appear to be a valid image or PDF file.' });
      }
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
      couponCode,
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

    // Load all products in one query to avoid N+1 lookups
    const productIds = parsedItems.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true, category: true },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    for (const item of parsedItems) {
      const product = productMap.get(item.productId);

      if (!product || product.status !== 'ACTIVE') {
        return res.status(400).json({ error: `Product not available: ${item.productId}` });
      }

      let variant = null;
      // Convert Decimal to number for arithmetic. Prisma returns Decimal as
      // Prisma.Decimal objects when the column type is Decimal.
      let unitPrice = Number(product.salePrice ?? product.basePrice);

      if (item.variantId) {
        variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant || !variant.isActive) {
          return res.status(400).json({ error: `Variant not available: ${item.variantId}` });
        }
        unitPrice += Number(variant.priceDelta);
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

    const shippingCost = shippingRegion ? await calculateShippingCost(shippingRegion, subtotal) : 0;

    // Apply coupon if provided
    let discount = 0;
    let couponRecord: any = null;
    if (couponCode && couponCode.trim()) {
      couponRecord = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase().trim() },
      });

      if (!couponRecord || !couponRecord.isActive) {
        return res.status(400).json({ error: 'Invalid coupon code' });
      }

      const now = new Date();
      if (couponRecord.startsAt && now < couponRecord.startsAt) {
        return res.status(400).json({ error: 'This coupon is not yet active' });
      }
      if (couponRecord.endsAt && now > couponRecord.endsAt) {
        return res.status(400).json({ error: 'This coupon has expired' });
      }
      if (couponRecord.maxUses !== null && couponRecord.usedCount >= couponRecord.maxUses) {
        return res.status(400).json({ error: 'This coupon has reached its usage limit' });
      }
      if (couponRecord.minSubtotal && subtotal < Number(couponRecord.minSubtotal)) {
        return res.status(400).json({ error: `Minimum order of ETB ${Number(couponRecord.minSubtotal).toLocaleString()} required for this coupon` });
      }

      if (couponRecord.type === 'PERCENTAGE') {
        discount = (subtotal * Number(couponRecord.value)) / 100;
        if (couponRecord.maxDiscount && discount > Number(couponRecord.maxDiscount)) {
          discount = Number(couponRecord.maxDiscount);
        }
      } else {
        discount = Number(couponRecord.value);
        if (discount > subtotal) discount = subtotal;
      }
    }

    const total = subtotal + shippingCost - discount;

    // Create order in transaction. Order number is generated inside the
    // transaction so the uniqueness check and insert are atomic.
    // The receipt file is uploaded only AFTER the transaction commits, so a
    // failed checkout never leaves an orphaned file in object storage.
    const order = await prisma.$transaction(async (tx) => {
      // Generate an order number and insert, retrying on unique-constraint
      // collisions (P2002) with a fresh candidate each attempt.
      let newOrder: any = null;
      for (let attempt = 0; attempt < 10; attempt++) {
        const orderNumber = await generateOrderNumberWithTx(tx);
        try {
          newOrder = await tx.shopOrder.create({
            data: {
              orderNumber,
              userId,
              guestToken,
              status: 'PENDING',
              subtotal,
              shippingCost,
              discount,
              total,
              paymentMethod,
              couponId: couponRecord?.id || null,
              paymentReceiptUrl: null,
              paymentStatus: paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'PENDING',
              notes: notes || null,
              items: {
                create: orderItemsData,
              },
              shippingAddress: {
                create: {
                  fullName: shippingFullName,
                  phone: shippingPhone,
                  region: shippingRegion || null,
                  city: shippingCity || null,
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
          break;
        } catch (err: any) {
          // P2002 = unique constraint violation on orderNumber; try again
          if (err?.code !== 'P2002' || attempt === 9) throw err;
        }
      }
      if (!newOrder) throw new Error('Failed to generate a unique order number');

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
          // Auto-deactivate variant when stock reaches 0
          await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { lte: 0 } },
            data: { isActive: false },
          });
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
            // Auto-transition product to OUT_OF_STOCK when stock reaches 0
            await tx.product.updateMany({
              where: { id: item.productId, stock: { lte: 0 }, status: 'ACTIVE' },
              data: { status: 'OUT_OF_STOCK' },
            });
          }
        }
      }

      // Increment coupon usage count atomically. The conditional update only
      // increments when usedCount < maxUses (or maxUses is unlimited), which
      // prevents a race where two concurrent orders both pass the pre-check
      // but exceed the limit. If zero rows update, the coupon is exhausted.
      if (couponRecord) {
        const where: any = { id: couponRecord.id };
        if (couponRecord.maxUses !== null) {
          where.usedCount = { lt: couponRecord.maxUses };
        }
        const result = await tx.coupon.updateMany({
          where,
          data: { usedCount: { increment: 1 } },
        });
        if (result.count === 0) {
          throw new Error('This coupon has reached its usage limit');
        }
      }

      return newOrder;
    }, { timeout: 15000, maxWait: 20000 });

    // Upload the receipt now that the order has been committed. Doing this
    // after the transaction guarantees no orphaned files are left in R2 when
    // checkout fails. We then patch the URL onto the order.
    let receiptUrl: string | null = null;
    if (req.file && paymentMethod !== 'CASH_ON_DELIVERY') {
      receiptUrl = await uploadToSupabase(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'shop-receipts'
      );
      await prisma.shopOrder.update({
        where: { id: order.id },
        data: { paymentReceiptUrl: receiptUrl },
      });
      order.paymentReceiptUrl = receiptUrl;
    }

    const responseBody = {
      message: 'Order placed successfully',
      order,
      guestToken,
    };

    // Cache the successful response for idempotency
    if (cacheKey) {
      idempotencyCache.set(cacheKey, {
        response: responseBody,
        expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
      });
      // Bound the cache size
      if (idempotencyCache.size > 500) {
        const now = Date.now();
        for (const [key, val] of idempotencyCache) {
          if (val.expiresAt <= now) idempotencyCache.delete(key);
        }
      }
    }

    res.status(201).json(responseBody);

    // Send confirmation emails (fire-and-forget — don't block the response)
    setImmediate(async () => {
      try {
        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim().replace(/\/$/, '');
        const orderUrl = `${frontendUrl}/shop/orders/${order.id}${guestToken ? `?guestToken=${guestToken}` : ''}`;
        const adminUrl = `${frontendUrl}/admin/shop/orders/${order.id}`;

        // Determine customer email and name
        let customerEmail: string | null = null;
        let customerName = shippingFullName;
        if (userId) {
          const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
          if (user) {
            customerEmail = user.email;
            customerName = user.name || shippingFullName;
          }
        }

        const { sendShopOrderConfirmation, sendShopAdminNewOrderAlert } = await import('../services/emailService');

        if (customerEmail) {
          await sendShopOrderConfirmation({
            to: customerEmail,
            customerName,
            orderNumber: order.orderNumber,
            orderUrl,
            items: orderItemsData.map((i) => ({
              name: i.name,
              variantLabel: i.variantLabel,
              quantity: i.quantity,
              lineTotal: i.lineTotal,
            })),
            subtotal: Number(subtotal),
            shippingCost: Number(shippingCost),
            total: Number(total),
            paymentMethod,
            shippingAddress: { fullName: shippingFullName, phone: shippingPhone, region: shippingRegion || '', city: shippingCity || '', address: shippingAddress },
          });
        }

        await sendShopAdminNewOrderAlert({
          orderNumber: order.orderNumber,
          customerName,
          total: Number(total),
          paymentMethod,
          adminUrl,
        });
      } catch (emailErr) {
        console.error('Failed to send order confirmation emails:', emailErr);
      }
    });
  } catch (error: any) {
    // Surface stock-exhaustion and coupon-limit errors (thrown inside the
    // transaction) as 400 instead of 500.
    if (error?.message?.startsWith('Insufficient stock for ') || error?.message === 'This coupon has reached its usage limit') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error creating shop order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload receipt for an existing order (e.g., if not uploaded at creation)
router.post('/orders/:id/receipt', receiptUploadLimiter, authenticateToken, receiptUpload.single('receipt'), async (req: AuthenticatedRequest, res: Response) => {
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
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const where = { userId: req.user!.id };
    const [orders, total] = await Promise.all([
      prisma.shopOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: { include: { product: { include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } } } } },
          shippingAddress: true,
        },
      }),
      prisma.shopOrder.count({ where }),
    ]);
    res.json({
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching my orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Guest order recovery: look up an order by order number + shipping phone.
// Returns the order ID + guest token so the frontend can redirect to the
// order confirmation page. Does NOT return full order details (those require
// the guest token, which is returned here).
router.post('/orders/lookup', orderCreationLimiter, [
  body('orderNumber').notEmpty().withMessage('Order number is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { orderNumber, phone } = req.body;

    const order = await prisma.shopOrder.findUnique({
      where: { orderNumber },
      include: { shippingAddress: true },
    });

    if (!order || !order.shippingAddress) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Match phone (loose comparison: trim + last 9 digits to handle formatting)
    const normalizePhone = (p: string) => p.replace(/\D/g, '').slice(-9);
    if (normalizePhone(order.shippingAddress.phone) !== normalizePhone(phone)) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      orderId: order.id,
      guestToken: order.guestToken,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error('Error looking up order:', error);
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
        items: { include: { product: { include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } } } } },
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

// ============================================================
// WISHLIST (authenticated users only)
// ============================================================

// Get my wishlist
router.get('/wishlist', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

    const where = { userId: req.user!.id };
    const [wishlist, total] = await Promise.all([
      prisma.wishlist.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: {
            include: {
              images: { orderBy: { sortOrder: 'asc' }, take: 1 },
              category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
      prisma.wishlist.count({ where }),
    ]);
    res.json({
      wishlist,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to wishlist
router.post('/wishlist/:productId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // upsert (unique constraint on userId+productId prevents duplicates)
    const item = await prisma.wishlist.upsert({
      where: { userId_productId: { userId: req.user!.id, productId } },
      create: { userId: req.user!.id, productId },
      update: {}, // no-op if already exists
    });
    res.status(201).json(item);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from wishlist
router.delete('/wishlist/:productId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { productId } = req.params;
    await prisma.wishlist.deleteMany({
      where: { userId: req.user!.id, productId },
    });
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
