import express, { Request, Response } from 'express';
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

// Get all available packages (public)
router.get('/available', async (req: Request, res: Response) => {
  try {
    const packages = await prisma.package.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    res.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's packages
router.get('/my-packages', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const userPackages = await prisma.userPackage.findMany({
      where: { userId },
      include: {
        package: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(userPackages);
  } catch (error) {
    console.error('Error fetching user packages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Purchase a package — creates a PENDING payment; admin must verify to activate
router.post('/purchase', authenticateToken, [
  body('packageId').notEmpty().withMessage('Package ID is required'),
  body('paymentMethod').isIn(['BANK_TRANSFER', 'MOBILE_MONEY', 'CASH']).withMessage('Invalid payment method'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { packageId, paymentMethod } = req.body;
    const userId = req.user!.id;

    // Get package details
    const packageInfo = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!packageInfo) {
      return res.status(404).json({ error: 'Package not found' });
    }

    if (!packageInfo.isActive) {
      return res.status(400).json({ error: 'Package is not available' });
    }

    // Create a pending payment record for admin verification
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: packageInfo.price,
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        status: 'PENDING',
        packageId,
      },
    });

    res.status(201).json({
      message: 'Purchase request submitted. Waiting for admin verification.',
      payment,
    });
  } catch (error) {
    console.error('Package purchase error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Create a package
router.post('/', authenticateToken, requireAdmin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('sessionsCount').isInt({ min: 1 }).withMessage('Sessions count must be at least 1'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('validityDays').optional().isInt({ min: 1 }).withMessage('Validity days must be positive'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      description,
      sessionsCount,
      price,
      validityDays,
    } = req.body;

    const newPackage = await prisma.package.create({
      data: {
        name,
        description,
        sessionsCount,
        price,
        validityDays,
      },
    });

    res.status(201).json({
      message: 'Package created successfully',
      package: newPackage,
    });
  } catch (error) {
    console.error('Package creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Update a package
router.put('/:id', authenticateToken, requireAdmin, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('sessionsCount').optional().isInt({ min: 1 }),
  body('price').optional().isFloat({ min: 0 }),
  body('validityDays').optional().isInt({ min: 1 }),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    const updatedPackage = await prisma.package.update({
      where: { id },
      data: updateData,
    });

    res.json({
      message: 'Package updated successfully',
      package: updatedPackage,
    });
  } catch (error) {
    console.error('Package update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Delete/deactivate a package
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if package has active user packages
    const activeUserPackages = await prisma.userPackage.count({
      where: {
        packageId: id,
        remainingSessions: { gt: 0 },
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
    });

    if (activeUserPackages > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete package with active user packages. Deactivate instead.' 
      });
    }

    await prisma.package.delete({
      where: { id },
    });

    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Package deletion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all packages
router.get('/', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const packages = await prisma.package.findMany({
      include: {
        userPackages: {
          select: {
            id: true,
            userId: true,
            remainingSessions: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
