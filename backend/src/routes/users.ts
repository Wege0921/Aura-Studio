import express, { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    if (role && role !== 'all') {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              bookings: true,
              userPackages: true,
              payments: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get instructors only (admin only)
router.get('/instructors', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const instructors = await prisma.user.findMany({
      where: { role: 'INSTRUCTOR' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      instructors,
      count: instructors.length
    });
  } catch (error) {
    console.error('Get instructors error:', error);
    res.status(500).json({ error: 'Failed to get instructors' });
  }
});

// Get user statistics (admin only)
router.get('/stats/overview', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const [
      totalUsers,
      totalAdmins,
      recentUsers,
      usersWithBookings,
      usersWithPackages,
      usersWithPayments
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.user.count({
        where: { bookings: { some: {} } }
      }),
      prisma.user.count({
        where: { userPackages: { some: {} } }
      }),
      prisma.user.count({
        where: { payments: { some: {} } }
      })
    ]);

    res.json({
      totalUsers,
      totalAdmins,
      recentUsers,
      usersWithBookings,
      usersWithPackages,
      usersWithPayments,
      regularUsers: totalUsers - totalAdmins
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user by ID (admin only)
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        bookings: {
          include: {
            class: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        userPackages: {
          include: {
            package: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            bookings: true,
            userPackages: true,
            payments: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role (admin only)
router.patch('/:id/role', authenticateToken, [
  body('role').isIn(['USER', 'ADMIN']).withMessage('Invalid role. Must be USER or ADMIN')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { role } = req.body;

    // Prevent admin from changing their own role
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'User role updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile (admin only)
router.patch('/:id/profile', authenticateToken, [
  body('name').optional().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, email } = req.body;

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email is already taken' });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'User profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't allow deletion of admin users
    if (user.role === 'ADMIN') {
      return res.status(403).json({ error: 'Cannot delete admin users' });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Create instructor (admin only)
router.post('/instructor', 
  authenticateToken,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().isLength({ min: 10 }).withMessage('Valid phone number required')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Check if user is admin
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0]?.msg || 'Validation failed' });
      }

      const { name, email, password, phone } = req.body;

      // Check if user already exists in Prisma or Supabase
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Create instructor in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, phone, role: 'INSTRUCTOR' },
      });

      if (authError || !authData.user) {
        return res.status(400).json({ error: authError?.message || 'Failed to create instructor account' });
      }

      // Create instructor profile in Prisma
      const instructor = await prisma.user.create({
        data: {
          id: authData.user.id,
          name,
          email,
          phone,
          role: 'INSTRUCTOR'
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });

      res.status(201).json({
        message: 'Instructor created successfully',
        instructor
      });
    } catch (error) {
      console.error('Create instructor error:', error);
      res.status(500).json({ error: 'Failed to create instructor' });
    }
  }
);


export default router;
