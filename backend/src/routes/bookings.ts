import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { telegramService } from '../services/telegramService';
import { promoteNextForClass } from '../services/waitlistService';
import { uploadToSupabase } from '../lib/upload';

// Extend Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const router = express.Router();

// Configure multer for file uploads (memory storage — uploaded to Supabase Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase().split('.').pop() || '');
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, PNG, GIF, and PDF files are allowed'));
    }
  }
});

// Create a booking with payment screenshot or package session
router.post('/', authenticateToken, upload.single('paymentReceipt'), [
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('paymentMethod').isIn(['BANK_TRANSFER', 'MOBILE_MONEY', 'CASH', 'PACKAGE_SESSION']).withMessage('Invalid payment method'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { classId, paymentMethod, paymentAmount, usePackageSession } = req.body;
    const userId = req.user!.id;
    const paymentReceiptFile = req.file;
    const useSession = usePackageSession === 'true' || usePackageSession === true;

    // Check if class exists and has available spots
    const classItem = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        bookings: true,
      },
    });

    if (!classItem) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Check if class is in the past
    const classDateTime = new Date(`${classItem.date.toISOString().split('T')[0]}T${classItem.time}`);
    if (classDateTime < new Date()) {
      return res.status(400).json({ error: 'Cannot book past classes' });
    }

    // Check if class is fully booked (cancelled bookings do not hold a spot)
    const activeBookings = classItem.bookings.filter((b) => b.status !== 'CANCELLED');
    if (activeBookings.length >= classItem.capacity) {
      return res.status(400).json({ error: 'Class is fully booked' });
    }

    // Check if user already booked this class
    const existingBooking = await prisma.booking.findUnique({
      where: {
        userId_classId: {
          userId,
          classId,
        },
      },
    });

    if (existingBooking) {
      return res.status(400).json({ error: 'You have already booked this class' });
    }

    let bookingData: any = {
      userId,
      classId,
      status: 'CONFIRMED',
      paymentMethod: paymentMethod || null,
      paymentAmount: parseFloat(paymentAmount) || classItem.price || 0,
    };
    let userPackageId: string | null = null;

    if (useSession) {
      // Find an active user package with remaining sessions
      const activePackages = await prisma.userPackage.findMany({
        where: {
          userId,
          remainingSessions: { gt: 0 },
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
          ],
        },
        orderBy: { expiresAt: 'asc' },
      });

      if (activePackages.length === 0) {
        return res.status(400).json({ error: 'No active package with available sessions found' });
      }

      // Use the package that expires soonest
      const targetPackage = activePackages[0];
      userPackageId = targetPackage.id;

      // Deduct session in transaction
      await prisma.$transaction(async (tx) => {
        await tx.userPackage.update({
          where: { id: targetPackage.id },
          data: { remainingSessions: { decrement: 1 } },
        });
      });

      bookingData.paymentStatus = 'PAID';
      bookingData.paidAt = new Date();
      bookingData.userPackageId = userPackageId;
    } else {
      // Validate payment receipt requirement for non-cash payments
      if (paymentMethod !== 'CASH' && !paymentReceiptFile) {
        return res.status(400).json({ error: 'Payment receipt is required for bank transfer and mobile money payments' });
      }

      let receiptUrl: string | null = null;
      if (paymentReceiptFile) {
        receiptUrl = await uploadToSupabase(
          paymentReceiptFile.buffer,
          paymentReceiptFile.originalname,
          paymentReceiptFile.mimetype
        );
      }
      bookingData.paymentStatus = 'PENDING';
      bookingData.paymentReceiptUrl = receiptUrl;
    }

    // Create booking with payment information
    const booking = await prisma.booking.create({
      data: bookingData,
      include: {
        class: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        userPackage: {
          include: { package: true },
        },
      },
    });

    // Send Telegram notification to admin
    if (!useSession && paymentMethod !== 'CASH' && booking.paymentReceiptUrl) {
      try {
        await telegramService.sendPaymentNotification({
          userName: booking.user.name || 'Unknown User',
          userEmail: booking.user.email,
          className: booking.class.name,
          classDate: new Date(booking.class.date).toLocaleDateString(),
          classTime: booking.class.time,
          paymentMethod: paymentMethod,
          amount: booking.paymentAmount || 0,
          receiptUrl: booking.paymentReceiptUrl,
        });
      } catch (telegramError) {
        console.error('Telegram notification failed:', telegramError);
      }
    } else if (useSession) {
      try {
        await telegramService.sendBookingConfirmationNotification({
          userName: booking.user.name || 'Unknown User',
          userEmail: booking.user.email,
          className: booking.class.name,
          classDate: new Date(booking.class.date).toLocaleDateString(),
          classTime: booking.class.time,
          paymentStatus: 'PAID (Package Session)',
        });
      } catch (telegramError) {
        console.error('Telegram notification failed:', telegramError);
      }
    } else if (paymentMethod === 'CASH') {
      try {
        await telegramService.sendBookingConfirmationNotification({
          userName: booking.user.name || 'Unknown User',
          userEmail: booking.user.email,
          className: booking.class.name,
          classDate: new Date(booking.class.date).toLocaleDateString(),
          classTime: booking.class.time,
          paymentStatus: 'PENDING',
        });
      } catch (telegramError) {
        console.error('Telegram notification failed:', telegramError);
      }
    }

    const message = useSession
      ? `Booking successful! Session deducted from ${booking.userPackage?.package?.name || 'your package'}.`
      : paymentMethod === 'CASH'
      ? 'Booking successful! Please pay at the studio to complete your booking.'
      : 'Booking successful! Payment receipt sent to admin for verification.';

    res.status(201).json({
      message,
      booking,
    });
  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload payment receipt for booking
router.post('/:id/payment', authenticateToken, upload.single('receipt'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { paymentMethod } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { class: true },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if booking belongs to user
    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }

    // Upload receipt to Supabase Storage
    let receiptUrl: string | null = null;
    if (req.file) {
      receiptUrl = await uploadToSupabase(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    }

    // Update booking with payment information
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        paymentMethod: paymentMethod || booking.paymentMethod,
        paymentReceiptUrl: receiptUrl,
        paymentAmount: booking.paymentAmount || booking.class.price || 0,
      },
      include: {
        class: true,
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
      message: 'Payment receipt uploaded successfully. Waiting for admin approval.',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Payment receipt upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's bookings
router.get('/my-bookings', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { status } = req.query;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        class: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel a booking
router.patch('/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        class: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if booking belongs to user
    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    // Check if class is in the past
    const classDateTime = new Date(`${booking.class.date.toISOString().split('T')[0]}T${booking.class.time}`);
    if (classDateTime < new Date()) {
      return res.status(400).json({ error: 'Cannot cancel past classes' });
    }

    // Check if it's too close to class time (e.g., less than 2 hours)
    const twoHoursFromNow = new Date();
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);
    if (classDateTime < twoHoursFromNow) {
      return res.status(400).json({ error: 'Cannot cancel less than 2 hours before class' });
    }

    // Cancel the booking, refund any package session, and promote the next
    // waitlisted member — all in one transaction so a promotion is never
    // recorded without the spot actually freeing up.
    const { updatedBooking, promoted } = await prisma.$transaction(async (tx) => {
      if (booking.userPackageId) {
        await tx.userPackage.update({
          where: { id: booking.userPackageId },
          data: { remainingSessions: { increment: 1 } },
        });
      }

      const updatedBooking = await tx.booking.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
        include: {
          class: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      const promoted = await promoteNextForClass(tx, booking.classId);

      return { updatedBooking, promoted };
    });

    res.json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
      promotedFromWaitlist: promoted
        ? { userId: promoted.userId, classId: promoted.classId }
        : null,
    });
  } catch (error) {
    console.error('Cancellation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single booking details
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        class: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if booking belongs to user
    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Approve payment for booking
router.patch('/:id/approve-payment', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user is admin
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        class: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Update booking payment status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
      },
      include: {
        class: true,
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
      message: 'Payment approved successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Payment approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Reject payment for booking
router.patch('/:id/reject-payment', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check if user is admin
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        class: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Update booking payment status
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        paymentStatus: 'FAILED',
      },
      include: {
        class: true,
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
      message: 'Payment rejected',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Payment rejection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
