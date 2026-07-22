import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { telegramService } from '../services/telegramService';
import { promoteNextForClass } from '../services/waitlistService';
import { uploadToSupabase } from '../lib/upload';

const router = express.Router();

const guestBookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many booking attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const guestCancelLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many cancellation attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
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

// Create a booking as a guest (no authentication required)
router.post('/guest', guestBookingLimiter, upload.single('paymentReceipt'), [
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('paymentMethod').isIn(['BANK_TRANSFER', 'MOBILE_MONEY', 'CASH']).withMessage('Invalid payment method'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { classId, paymentMethod, paymentAmount } = req.body;
    const paymentReceiptFile = req.file;

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

    // Check if class is fully booked
    const activeBookings = classItem.bookings.filter((b) => b.status !== 'CANCELLED');
    if (activeBookings.length >= classItem.capacity) {
      return res.status(400).json({ error: 'Class is fully booked' });
    }

    // Generate unique guest token
    const guestToken = crypto.randomUUID();

    // Upload receipt if provided
    let receiptUrl: string | null = null;
    if (paymentReceiptFile) {
      try {
        receiptUrl = await uploadToSupabase(
          paymentReceiptFile.buffer,
          paymentReceiptFile.originalname,
          paymentReceiptFile.mimetype
        );
      } catch (uploadErr) {
        console.error('Payment receipt upload failed:', uploadErr);
      }
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: null,
        classId,
        guestToken,
        status: 'CONFIRMED',
        paymentMethod: paymentMethod || null,
        paymentAmount: parseFloat(paymentAmount) || classItem.price || 0,
        paymentStatus: 'PENDING',
        paymentReceiptUrl: receiptUrl,
      },
      include: {
        class: true,
      },
    });

    // Send Telegram notification to admin
    const notificationData = {
      userName: 'Guest',
      userEmail: '-',
      className: booking.class.name,
      classDate: new Date(booking.class.date).toLocaleDateString(),
      classTime: booking.class.time,
      paymentStatus: 'PENDING',
    };

    if (receiptUrl) {
      try {
        await telegramService.sendPaymentNotification({
          userName: 'Guest',
          userEmail: `Booking Ref: ${guestToken.slice(0, 8)}`,
          className: booking.class.name,
          classDate: new Date(booking.class.date).toLocaleDateString(),
          classTime: booking.class.time,
          paymentMethod: paymentMethod || 'CASH',
          amount: booking.paymentAmount || 0,
          receiptUrl,
        });
      } catch (telegramError) {
        console.error('Telegram notification failed:', telegramError);
      }
    } else {
      try {
        await telegramService.sendBookingConfirmationNotification(notificationData);
      } catch (telegramError) {
        console.error('Telegram notification failed:', telegramError);
      }
    }

    const message = paymentMethod === 'CASH'
      ? 'Booking successful! Please pay at the studio to complete your booking.'
      : 'Booking successful! Payment receipt sent to admin for verification.';

    res.status(201).json({
      message,
      booking: {
        ...booking,
        guestToken,
      },
    });
  } catch (error) {
    console.error('Guest booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a guest booking by token
router.get('/guest/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { guestToken: token },
      include: {
        class: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Error fetching guest booking:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel a guest booking by token
router.patch('/guest/:token/cancel', guestCancelLimiter, async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { guestToken: token },
      include: {
        class: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Check if already cancelled
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    // Check if class is in the past
    const classDateTime = new Date(`${booking.class.date.toISOString().split('T')[0]}T${booking.class.time}`);
    if (classDateTime < new Date()) {
      return res.status(400).json({ error: 'Cannot cancel past classes' });
    }

    // Check if it's too close to class time (less than 2 hours)
    const twoHoursFromNow = new Date();
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);
    if (classDateTime < twoHoursFromNow) {
      return res.status(400).json({ error: 'Cannot cancel less than 2 hours before class' });
    }

    // Cancel booking and promote waitlist
    const { cancelledBooking, promoted } = await prisma.$transaction(async (tx) => {
      const cancelledBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
        include: {
          class: true,
        },
      });

      const promoted = await promoteNextForClass(tx, booking.classId);

      return { cancelledBooking, promoted };
    });

    res.json({
      message: 'Booking cancelled successfully',
      booking: cancelledBooking,
      promotedFromWaitlist: promoted
        ? { userId: promoted.userId, classId: promoted.classId }
        : null,
    });
  } catch (error) {
    console.error('Guest cancellation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
