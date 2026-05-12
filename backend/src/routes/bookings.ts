import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { telegramService } from '../services/telegramService';

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
    cb(null, 'payment-receipt-' + uniqueSuffix + path.extname(file.originalname));
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

// Create a booking with payment screenshot
router.post('/', authenticateToken, upload.single('paymentReceipt'), [
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('paymentMethod').isIn(['BANK_TRANSFER', 'MOBILE_MONEY', 'CASH']).withMessage('Invalid payment method'),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { classId, paymentMethod, paymentAmount } = req.body;
    const userId = req.user!.id;
    const paymentReceiptFile = req.file;

    // Validate payment receipt requirement for non-cash payments
    if (paymentMethod !== 'CASH' && !paymentReceiptFile) {
      return res.status(400).json({ error: 'Payment receipt is required for bank transfer and mobile money payments' });
    }

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
    if (classItem.bookings.length >= classItem.capacity) {
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

    // Prepare payment receipt URL
    const receiptUrl = paymentReceiptFile ? `/uploads/${paymentReceiptFile.filename}` : null;

    // Create booking with payment information
    const booking = await prisma.booking.create({
      data: {
        userId,
        classId,
        status: 'CONFIRMED',
        paymentStatus: paymentMethod === 'CASH' ? 'PENDING' : 'PENDING', // Both pending until verification
        paymentMethod: paymentMethod || null,
        paymentAmount: parseFloat(paymentAmount) || classItem.price || 0,
        paymentReceiptUrl: receiptUrl,
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

    // Send Telegram notification to admin
    if (paymentMethod !== 'CASH' && receiptUrl) {
      const fullReceiptUrl = `${process.env.SERVER_URL || 'http://localhost:5000'}${receiptUrl}`;
      
      try {
        // Send text notification first
        await telegramService.sendPaymentNotification({
          userName: booking.user.name || 'Unknown User',
          userEmail: booking.user.email,
          className: booking.class.name,
          classDate: new Date(booking.class.date).toLocaleDateString(),
          classTime: booking.class.time,
          paymentMethod: paymentMethod,
          amount: booking.paymentAmount || 0,
          receiptUrl: fullReceiptUrl,
        });
        
        // Send receipt file if it exists
        if (paymentReceiptFile && receiptUrl) {
          const fs = require('fs');
          const path = require('path');
          const receiptPath = path.join(process.cwd(), receiptUrl);
          
          if (fs.existsSync(receiptPath)) {
            // Send the actual file instead of URL
            const fileExtension = path.extname(receiptPath).toLowerCase();
            const isImage = ['.jpg', '.jpeg', '.png', '.gif'].includes(fileExtension);
            
            if (isImage) {
              // Try to send as photo first, fallback to document if it fails
              const photoSent = await telegramService.sendPhotoFile(receiptPath, `💳 Payment receipt for ${booking.user.name || 'Unknown User'} - ${booking.class.name}`);
              if (!photoSent) {
                console.log('Photo upload failed, sending as document instead');
                await telegramService.sendDocumentWithCaption(receiptPath, `💳 Payment receipt for ${booking.user.name || 'Unknown User'} - ${booking.class.name}`);
              }
            } else {
              await telegramService.sendDocumentWithCaption(receiptPath, `💳 Payment receipt for ${booking.user.name || 'Unknown User'} - ${booking.class.name}`);
            }
          }
        }
      } catch (telegramError) {
        console.error('Telegram notification failed:', telegramError);
        // Continue with booking even if Telegram fails
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
        // Continue with booking even if Telegram fails
      }
    }

    const message = paymentMethod === 'CASH' 
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

    // Update booking with payment information
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        paymentMethod: paymentMethod || booking.paymentMethod,
        paymentReceiptUrl: req.file ? `/uploads/${req.file.filename}` : null,
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

    // Update booking status
    const updatedBooking = await prisma.booking.update({
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

    res.json({
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
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
