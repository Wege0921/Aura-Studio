import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { PackageExpiryService } from '../services/packageExpiryService';
import { sendPackageExpiryReminder } from '../services/emailService';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard/stats', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalClasses,
      totalBookings,
      totalRevenue,
      activePackages,
      pendingPayments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.class.count(),
      prisma.booking.count(),
      prisma.payment.aggregate({
        where: { status: 'VERIFIED' },
        _sum: { amount: true },
      }),
      prisma.package.count({
        where: { isActive: true },
      }),
      prisma.payment.count({
        where: { status: 'PENDING' },
      }),
    ]);

    res.json({
      totalUsers,
      totalClasses,
      totalBookings,
      totalRevenue: totalRevenue._sum.amount || 0,
      activePackages,
      pendingPayments,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent bookings with user and class details
router.get('/bookings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
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
        class: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Math.min(Math.max(Number(limit) || 20, 1), 100),
    });

    const total = await prisma.booking.count({ where });

    res.json({
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update booking status (admin only)
router.patch('/bookings/:id/status', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['CONFIRMED', 'CANCELLED', 'COMPLETED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true } },
        class: true,
      },
    });

    res.json({ message: 'Booking status updated', booking: updatedBooking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete booking (admin only)
router.delete('/bookings/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.booking.delete({
      where: { id },
    });

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all classes for admin management
router.get('/classes', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new class
router.post('/classes', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      description,
      instructor,
      date,
      time,
      duration,
      capacity,
      classType,
      price,
      isActive,
    } = req.body;

    const newClass = await prisma.class.create({
      data: {
        name,
        description,
        instructor,
        date: date ? new Date(date) : new Date(),
        time: time || '09:00',
        duration: duration ? Number(duration) : 60,
        capacity: capacity ? Number(capacity) : 20,
        classType: classType || 'PILATES',
        price: price !== undefined ? Number(price) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    res.status(201).json(newClass);
  } catch (error) {
    console.error('Error creating class:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update class
router.put('/classes/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      instructor,
      date,
      time,
      duration,
      capacity,
      classType,
      price,
      isActive,
    } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (instructor !== undefined) updateData.instructor = instructor;
    if (date !== undefined) updateData.date = new Date(date);
    if (time !== undefined) updateData.time = time;
    if (duration !== undefined) updateData.duration = Number(duration);
    if (capacity !== undefined) updateData.capacity = Number(capacity);
    if (classType !== undefined) updateData.classType = classType;
    if (price !== undefined) updateData.price = Number(price);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedClass = await prisma.class.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    res.json(updatedClass);
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete class
router.delete('/classes/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if class has any active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        classId: id,
        status: { not: 'CANCELLED' },
      },
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        error: 'Cannot delete class with active bookings. Cancel or complete bookings first.',
      });
    }

    await prisma.class.delete({
      where: { id },
    });

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle class status
router.patch('/classes/:id/toggle-status', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const updatedClass = await prisma.class.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });

    res.json({ message: `Class ${isActive ? 'activated' : 'deactivated'} successfully`, class: updatedClass });
  } catch (error) {
    console.error('Error toggling class status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all packages for admin management
router.get('/packages', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const packages = await prisma.package.findMany({
      include: {
        _count: {
          select: {
            userPackages: true,
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

// Create new package
router.post('/packages', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      description,
      classType,
      sessionsCount,
      price,
      validityDays,
    } = req.body;

    const newPackage = await prisma.package.create({
      data: {
        name,
        description,
        classType: classType || 'ALL',
        sessionsCount,
        price,
        validityDays: validityDays || null,
      },
      include: {
        _count: {
          select: {
            userPackages: true,
          },
        },
      },
    });

    res.json(newPackage);
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update package
router.put('/packages/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      classType,
      sessionsCount,
      price,
      validityDays,
    } = req.body;

    const updatedPackage = await prisma.package.update({
      where: { id },
      data: {
        name,
        description,
        classType: classType || 'ALL',
        sessionsCount,
        price,
        validityDays: validityDays || null,
      },
      include: {
        _count: {
          select: {
            userPackages: true,
          },
        },
      },
    });

    res.json(updatedPackage);
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete package
router.delete('/packages/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.package.delete({
      where: { id },
    });

    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle package status
router.patch('/packages/:id/toggle-status', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    await prisma.package.update({
      where: { id },
      data: { isActive },
    });

    res.json({ message: `Package ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    console.error('Error toggling package status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all payments for admin management
router.get('/payments', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, status, paymentMethod, search } = req.query;
    
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (paymentMethod) {
      where.paymentMethod = paymentMethod;
    }
    if (search) {
      where.user = {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Math.min(Math.max(Number(limit) || 20, 1), 100),
    });

    const total = await prisma.payment.count({ where });

    res.json({
      payments,
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: msg });
  }
});

// Verify payment
router.patch('/payments/:id/verify', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
      },
    });

    res.json({ message: `Payment ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get users with their package information
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        userPackages: {
          include: {
            package: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Math.min(Math.max(Number(limit) || 20, 1), 100),
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get package expiry information
router.get('/packages/expiry', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + Number(days));

    const expiringPackages = await prisma.userPackage.findMany({
      where: {
        expiresAt: {
          lte: futureDate,
          gte: new Date(),
        },
        remainingSessions: {
          gt: 0,
        },
      },
      include: {
        package: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        expiresAt: 'asc',
      },
    });

    res.json(expiringPackages);
  } catch (error) {
    console.error('Error fetching expiring packages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all packages with usage statistics
router.get('/packages/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const packages = await prisma.package.findMany({
      include: {
        userPackages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            userPackages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const packageStats = packages.map((pkg: any) => {
      const activeUserPackages = pkg.userPackages.filter((up: any) => up.remainingSessions > 0).length;
      const totalRevenue = pkg.userPackages.reduce((sum: any, up: any) => sum + pkg.price, 0);
      return {
        ...pkg,
        stats: {
          activeUserPackages,
          totalRevenue,
        },
      };
    });

    res.json(packageStats);
  } catch (error) {
    console.error('Error fetching package stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get class attendance statistics
router.get('/classes/attendance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const classes = await prisma.class.findMany({
      where: dateFilter ? { date: dateFilter } : {},
      include: {
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const classStats = classes.map((cls: any) => {
      const totalBookings = cls.bookings.length;
      const confirmedBookings = cls.bookings.filter((b: any) => b.status === 'CONFIRMED').length;
      const cancelledBookings = cls.bookings.filter((b: any) => b.status === 'CANCELLED').length;
      const completedBookings = cls.bookings.filter((b: any) => b.status === 'COMPLETED').length;
      const attendanceRate = totalBookings > 0 ? completedBookings / totalBookings : 0;

      return {
        ...cls,
        stats: {
          totalBookings,
          confirmedBookings,
          cancelledBookings,
          completedBookings,
          attendanceRate,
        },
      };
    });

    res.json(classStats);
  } catch (error) {
    console.error('Error fetching class attendance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Extend user package expiry
router.patch('/packages/:userPackageId/extend', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userPackageId } = req.params;
    const { additionalDays } = req.body;

    if (!additionalDays || additionalDays <= 0) {
      return res.status(400).json({ error: 'Additional days must be positive' });
    }

    const userPackage = await prisma.userPackage.findUnique({
      where: { id: userPackageId },
      include: { package: true },
    });

    if (!userPackage) {
      return res.status(404).json({ error: 'User package not found' });
    }

    let newExpiryDate = new Date();
    
    if (userPackage.expiresAt) {
      newExpiryDate = new Date(userPackage.expiresAt);
    }

    newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);

    const updatedPackage = await prisma.userPackage.update({
      where: { id: userPackageId },
      data: {
        expiresAt: newExpiryDate,
      },
      include: {
        package: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: 'Package expiry extended successfully',
      package: updatedPackage,
    });
  } catch (error) {
    console.error('Error extending package expiry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system health metrics
router.get('/health', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      recentUsers,
      recentBookings,
      recentPayments,
      systemUptime,
    ] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: last24Hours } },
      }),
      prisma.booking.count({
        where: { createdAt: { gte: last24Hours } },
      }),
      prisma.payment.count({
        where: { createdAt: { gte: last24Hours } },
      }),
      process.uptime(),
    ]);

    res.json({
      health: 'OK',
      uptime: systemUptime,
      last24Hours: {
        newUsers: recentUsers,
        newBookings: recentBookings,
        newPayments: recentPayments,
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analytics data
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      bookingsByStatus,
      paymentsByMonth,
      usersByMonth,
      topClasses,
      packagePopularity,
      recentBookings30d,
      completedBookings30d,
      recentPayments30d,
      recentRevenue30d,
    ] = await Promise.all([
      // Bookings by status
      prisma.booking.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Payments grouped by month (last 6 months)
      prisma.payment.findMany({
        where: {
          status: 'VERIFIED',
          createdAt: { gte: sixMonthsAgo },
        },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),

      // Users grouped by month (last 6 months)
      prisma.user.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),

      // Top 5 classes by bookings count
      prisma.class.findMany({
        take: 5,
        include: {
          _count: { select: { bookings: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Package popularity
      prisma.package.findMany({
        include: {
          _count: { select: { userPackages: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Recent bookings (30d)
      prisma.booking.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),

      // Completed bookings (30d)
      prisma.booking.count({
        where: { createdAt: { gte: thirtyDaysAgo }, status: 'COMPLETED' },
      }),

      // Recent payments (30d)
      prisma.payment.count({
        where: { createdAt: { gte: thirtyDaysAgo }, status: 'VERIFIED' },
      }),

      // Recent revenue (30d)
      prisma.payment.aggregate({
        where: { createdAt: { gte: thirtyDaysAgo }, status: 'VERIFIED' },
        _sum: { amount: true },
      }),
    ]);

    // Sort top classes by booking count manually
    const sortedTopClasses = topClasses
      .map((c: any) => ({ name: c.name, bookings: c._count.bookings }))
      .sort((a: any, b: any) => b.bookings - a.bookings)
      .slice(0, 5);

    // Sort packages by purchase count manually
    const sortedPackages = packagePopularity
      .map((p: any) => ({ name: p.name, purchases: p._count.userPackages }))
      .sort((a: any, b: any) => b.purchases - a.purchases)
      .slice(0, 5);

    // Build month labels
    const monthLabels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthLabels.push(d.toLocaleString('default', { month: 'short' }));
    }

    // Group payments by month
    const revenueByMonth = monthLabels.map(() => 0);
    paymentsByMonth.forEach((p: any) => {
      const m = new Date(p.createdAt).toLocaleString('default', { month: 'short' });
      const idx = monthLabels.indexOf(m);
      if (idx >= 0) revenueByMonth[idx] += p.amount;
    });

    // Group users by month
    const usersByMonthCount = monthLabels.map(() => 0);
    usersByMonth.forEach((u: any) => {
      const m = new Date(u.createdAt).toLocaleString('default', { month: 'short' });
      const idx = monthLabels.indexOf(m);
      if (idx >= 0) usersByMonthCount[idx] += 1;
    });

    res.json({
      bookingsByStatus: bookingsByStatus.map((b: any) => ({ status: b.status, count: b._count.id })),
      revenueByMonth: { labels: monthLabels, data: revenueByMonth },
      usersByMonth: { labels: monthLabels, data: usersByMonthCount },
      topClasses: sortedTopClasses,
      packagePopularity: sortedPackages,
      recentActivity: {
        bookings30d: recentBookings30d,
        completed30d: completedBookings30d,
        payments30d: recentPayments30d,
        revenue30d: recentRevenue30d._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin campaigns (email marketing)
router.get('/campaigns', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // For now, return empty list since we don't persist campaigns in DB yet.
    // In production, add a Campaign model to Prisma.
    res.json({ campaigns: [] });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/campaigns', authenticateToken, requireAdmin, [
  body('subject').notEmpty().withMessage('Subject is required'),
  body('body').notEmpty().withMessage('Body is required'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { subject, body: emailBody } = req.body;

    // Get all user emails
    const users = await prisma.user.findMany({
      select: { email: true, name: true },
      where: { role: { not: 'ADMIN' } },
    });

    const { sendEmail } = await import('../services/emailService');
    let sent = 0;
    for (const u of users) {
      if (u.email) {
        try {
          await sendEmail({
            to: u.email,
            subject,
            text: `Hi ${u.name || 'there'},\n\n${emailBody}\n\nAURA Studio`,
            html: `<p>Hi ${u.name || 'there'},</p><p>${emailBody.replace(/\n/g, '<br/>')}</p><p>AURA Studio</p>`,
          });
          sent++;
        } catch (e) {
          console.error('Failed to send campaign email to', u.email, e);
        }
      }
    }

    res.json({ message: `Campaign sent to ${sent} users`, sent });
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vercel Cron: run package expiry check daily at midnight
// No auth required — Vercel cron jobs don't send auth headers.
// Optionally verify CRON_SECRET header if you set one in the dashboard.
router.post('/run-expiry-check', async (req: Request, res: Response) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const headerSecret = req.headers['x-cron-secret'] || req.headers['authorization'];
      if (headerSecret !== cronSecret && headerSecret !== `Bearer ${cronSecret}`) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    console.log('[Cron] Running package expiry check...');
    await PackageExpiryService.checkAndExpirePackages();

    // Send reminder emails for packages expiring in 3 days
    const expiringPackages = await PackageExpiryService.getExpiringPackages(3);
    let remindersSent = 0;
    for (const up of expiringPackages) {
      if (up.user?.email && up.expiresAt) {
        const daysLeft = Math.ceil((new Date(up.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        try {
          await sendPackageExpiryReminder({
            to: up.user.email,
            userName: up.user.name,
            packageName: up.package.name,
            daysLeft: Math.max(0, daysLeft),
          });
          remindersSent++;
        } catch (emailErr) {
          console.error('Failed to send expiry reminder:', emailErr);
        }
      }
    }

    res.json({
      message: 'Expiry check completed',
      remindersSent,
      expiredChecked: true,
    });
  } catch (error) {
    console.error('[Cron] Error in package expiry check:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
