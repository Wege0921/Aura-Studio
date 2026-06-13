import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireAdmin } from '../middleware/auth';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, PNG, GIF, and PDF files are allowed'));
    }
  }
});

// Create a payment record
router.post('/', authenticateToken, upload.single('receipt'), [
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive'),
  body('paymentMethod').isIn(['BANK_TRANSFER', 'MOBILE_MONEY', 'CASH']).withMessage('Invalid payment method'),
  body('packageId').optional().notEmpty().withMessage('Package ID is required for package payments'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, paymentMethod, packageId } = req.body;
    const userId = req.user!.id;
    const receiptFile = req.file;

    if (!receiptFile) {
      return res.status(400).json({ error: 'Receipt file is required' });
    }

    // If this is a package payment, verify the package exists
    if (packageId) {
      const packageInfo = await prisma.package.findUnique({
        where: { id: packageId },
      });

      if (!packageInfo) {
        return res.status(404).json({ error: 'Package not found' });
      }

      // Verify amount matches package price
      if (Math.abs(amount - packageInfo.price) > 0.01) {
        return res.status(400).json({ error: 'Payment amount does not match package price' });
      }
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount,
        paymentMethod,
        receiptUrl: receiptFile.filename,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      message: 'Payment recorded successfully. Please wait for admin verification.',
      payment,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's payment history
router.get('/my-payments', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status } = req.query;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all payments
router.get('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, paymentMethod } = req.query;
    const { page = 1, limit = 10 } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.payment.count({ where });

    res.json({
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Verify a payment
router.patch('/:id/verify', authenticateToken, requireAdmin, [
  body('status').isIn(['VERIFIED', 'REJECTED']).withMessage('Invalid status'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== 'PENDING') {
      return res.status(400).json({ error: 'Payment has already been processed' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id },
        data: {
          status,
          verifiedAt: status === 'VERIFIED' ? new Date() : null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          package: true,
        },
      });

      // If verifying a package payment, create the UserPackage
      if (status === 'VERIFIED' && updatedPayment.packageId) {
        const pkg = updatedPayment.package;
        if (pkg) {
          let expiresAt = null;
          if (pkg.validityDays) {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + pkg.validityDays);
            expiresAt = expiryDate;
          }

          await tx.userPackage.create({
            data: {
              userId: updatedPayment.userId,
              packageId: updatedPayment.packageId,
              remainingSessions: pkg.sessionsCount,
              expiresAt,
              source: 'PURCHASE',
            },
          });
        }
      }

      return updatedPayment;
    });

    res.json({
      message: `Payment ${status.toLowerCase()} successfully`,
      payment: result,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment receipt file
router.get('/:id/receipt', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const payment = await prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Check if payment belongs to user or user is admin
    if (payment.userId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to view this receipt' });
    }

    if (!payment.receiptUrl) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const filePath = path.join('uploads', payment.receiptUrl);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error serving receipt:', err);
        res.status(404).json({ error: 'Receipt file not found' });
      }
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment statistics (admin only)
router.get('/stats/summary', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const where: any = {};
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }

    const [
      totalPayments,
      verifiedPayments,
      pendingPayments,
      rejectedPayments,
      totalRevenue
    ] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.count({ where: { ...where, status: 'VERIFIED' } }),
      prisma.payment.count({ where: { ...where, status: 'PENDING' } }),
      prisma.payment.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.payment.aggregate({
        where: { ...where, status: 'VERIFIED' },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      summary: {
        totalPayments,
        verifiedPayments,
        pendingPayments,
        rejectedPayments,
        totalRevenue: totalRevenue._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
