import express, { Request, Response } from 'express';
import { query } from 'express-validator';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all classes with optional filtering
router.get('/', [
  query('date').optional().isISO8601(),
  query('classType').optional().isIn(['PILATES', 'PRENATAL', 'POSTPARTUM', 'MEDITATION']),
  query('instructor').optional().isString(),
], async (req: Request, res: Response) => {
  try {
    const { date, classType, instructor } = req.query;

    // Build filter conditions
    const where: any = {};

    if (date) {
      const filterDate = new Date(date as string);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.date = {
        gte: filterDate,
        lt: nextDay,
      };
    } else {
      // Default to today and future classes
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.date = {
        gte: today,
      };
    }

    if (classType) {
      where.classType = classType;
    }

    if (instructor) {
      where.instructor = {
        contains: instructor as string,
        mode: 'insensitive',
      };
    }

    const classes = await prisma.class.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
      include: {
        bookings: {
          where: {
            status: { not: 'CANCELLED' },
          },
          select: {
            id: true,
          },
        },
      },
    });

    // Calculate available spots for each class
    const classesWithAvailability = classes.map(cls => ({
      ...cls,
      availableSpots: cls.capacity - cls.bookings.length,
      isFullyBooked: cls.capacity <= cls.bookings.length,
    }));

    res.json(classesWithAvailability);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single class by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const classItem = await prisma.class.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: { not: 'CANCELLED' },
          },
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
    });

    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Calculate available spots
    const availableSpots = classItem.capacity - classItem.bookings.length;

    res.json({
      ...classItem,
      availableSpots,
      isFullyBooked: availableSpots <= 0,
    });
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available class types
router.get('/types/list', async (req: Request, res: Response) => {
  try {
    const classTypes = await prisma.class.groupBy({
      by: ['classType'],
      _count: {
        classType: true,
      },
    });

    const types = classTypes.map(type => ({
      type: type.classType,
      count: type._count.classType,
    }));

    res.json(types);
  } catch (error) {
    console.error('Error fetching class types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get classes for logged-in instructor
router.get('/instructor/my-classes', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as any;
    const user = authReq.user;
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    // Look up the instructor's name from the users table
    const instructorUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true },
    });
    if (!instructorUser) {
      return res.status(404).json({ error: 'Instructor not found' });
    }
    const classes = await prisma.class.findMany({
      where: {
        instructor: instructorUser.name,
        date: { gte: new Date() },
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      include: {
        bookings: {
          where: { status: { not: 'CANCELLED' } },
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });
    const result = classes.map(cls => ({
      ...cls,
      availableSpots: cls.capacity - cls.bookings.length,
    }));
    res.json(result);
  } catch (error) {
    console.error('Error fetching instructor classes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available instructors
router.get('/instructors/list', async (req: Request, res: Response) => {
  try {
    const instructors = await prisma.class.groupBy({
      by: ['instructor'],
      _count: {
        instructor: true,
      },
    });

    const instructorList = instructors.map(instructor => ({
      name: instructor.instructor,
      classCount: instructor._count.instructor,
    }));

    res.json(instructorList);
  } catch (error) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
