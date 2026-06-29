import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../lib/prisma';
import { sendEmail } from '../services/emailService';

const router = express.Router();

router.post('/', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array().map((e: any) => e.msg).join(', ') });
    }

    const { email } = req.body;

    // Upsert: if email already exists, just return success (idempotent)
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    // Notify admin of new subscriber
    const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL || 'noreply@aurastudio.com';
    try {
      await sendEmail({
        to: adminEmail,
        subject: 'New Newsletter Subscription — AURA Studio',
        text: `A new user subscribed to the AURA Studio newsletter:\n\nEmail: ${email}\n\nTime: ${new Date().toISOString()}`,
        html: `<p>A new user subscribed to the AURA Studio newsletter:</p><p><strong>Email:</strong> ${email}</p><p><strong>Time:</strong> ${new Date().toLocaleString()}</p>`,
      });
    } catch (emailErr) {
      console.warn('Failed to send newsletter admin notification:', emailErr);
    }

    res.json({ message: 'Thank you for subscribing to the AURA Studio newsletter!' });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ error: 'Failed to process subscription' });
  }
});

export default router;
